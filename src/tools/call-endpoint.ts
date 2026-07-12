import { existsSync } from "node:fs";
import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadEndpointSpec, loadIndex, suggestSlugs } from "../catalog/endpoint-spec.js";
import { invoiceNinjaClient } from "../clients/invoiceninja-client.js";

const schema = z.object({
  endpoint_name: z
    .string()
    .describe("The endpoint slug to call, e.g. 'get_invoices' or 'show_invoice'. See list_endpoints / describe_endpoint."),
  path_params: z
    .record(z.union([z.string(), z.number()]))
    .optional()
    .describe("Values for {placeholders} in the path, e.g. { id: 'D2J234DFA' }. Required ones must be present."),
  query: z
    .record(z.any())
    .optional()
    .describe(
      "Query-string parameters keyed by name from describe_endpoint, e.g. { include: 'client', per_page: 50, " +
        "status: 'active' }. Arrays are serialized as key[]=value."
    ),
  body: z
    .record(z.any())
    .optional()
    .describe("Request-body object for POST/PUT (keys from describe_endpoint's requestBody.fields)."),
  files: z
    .array(z.string())
    .optional()
    .describe(
      "Local file path(s) to upload for multipart endpoints (the upload_* endpoints, e.g. " +
        "upload_expense / upload_invoice_document to attach a receipt). Each is sent as documents[]."
    ),
  file_field: z
    .string()
    .optional()
    .describe("Override the multipart file field name (default 'documents[]')."),
  authorization_confirmed: z
    .boolean()
    .optional()
    .describe("REQUIRED true for mutating endpoints (POST/PUT/DELETE). Confirms the user explicitly approved this change."),
  authorization_note: z
    .string()
    .optional()
    .describe("REQUIRED for mutating endpoints: a short note describing the user's explicit approval. Stored in the backup."),
});

function errorText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/**
 * Executes one Invoice Ninja endpoint after validating against the catalog spec:
 * the endpoint must exist, required path parameters must be present, and any
 * mutating endpoint must carry authorization_confirmed=true + authorization_note
 * (a JSON backup is written before the call). Read-only GET endpoints run freely.
 */
export const callEndpointTool: ToolDefinition<typeof schema> = {
  name: "call_endpoint",
  description:
    "Call an Invoice Ninja API endpoint and return its response. Validates the endpoint name and " +
    "required path parameters against the catalog before calling. Mutating endpoints (POST/PUT/DELETE) " +
    "require authorization_confirmed=true and an authorization_note and are backed up before execution. " +
    "Use describe_endpoint first to learn the exact parameters.",
  schema,
  handler: async ({ params }: any) => {
    const name: string = params?.endpoint_name;
    const spec = loadEndpointSpec(name);

    if (!spec) {
      const suggestions = suggestSlugs(name);
      const total = loadIndex().endpointCount;
      return errorText(
        `Unknown endpoint "${name}". ` +
          (suggestions.length ? `Did you mean: ${suggestions.join(", ")}? ` : "") +
          `Call list_endpoints to see all ${total} endpoints.`
      );
    }

    // Required path parameters must be present.
    const pathParams: Record<string, string | number> = params?.path_params ?? {};
    const missingPath = spec.pathParameters
      .filter((p) => p.required)
      .map((p) => p.name)
      .filter((n) => {
        const v = pathParams[n];
        return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
      });
    // Also catch placeholders in the path that have no provided value.
    const placeholders = [...spec.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    for (const ph of placeholders) {
      if (!(ph in pathParams) && !missingPath.includes(ph)) missingPath.push(ph);
    }
    if (missingPath.length > 0) {
      return errorText(
        `Missing required path parameter(s) for "${spec.slug}": ${[...new Set(missingPath)].join(", ")}. ` +
          `Call describe_endpoint("${spec.slug}") for details.`
      );
    }

    // Enforce required query parameters (rare, but honored).
    const query: Record<string, unknown> = params?.query ?? {};
    const missingQuery = spec.queryParameters
      .filter((p) => p.required)
      .map((p) => p.name)
      .filter((n) => query[n] === undefined || query[n] === null || query[n] === "");
    if (missingQuery.length > 0) {
      return errorText(
        `Missing required query parameter(s) for "${spec.slug}": ${missingQuery.join(", ")}. ` +
          `Call describe_endpoint("${spec.slug}") for details.`
      );
    }

    // Write guard for state-changing endpoints. Defense-in-depth: any {action} route
    // (email/mark_paid/archive/delete/clone/…) is treated as mutating even if the flag
    // were ever miscomputed, so destructive action GETs can never slip past unguarded.
    const isMutating = spec.mutating || /\{action\}/.test(spec.path);
    if (isMutating) {
      const confirmed = params?.authorization_confirmed === true;
      const note = (params?.authorization_note ?? "").toString().trim();
      if (!confirmed || !note) {
        return errorText(
          `"${spec.slug}" is a ${spec.method} (mutating) endpoint and changes data. ` +
            `To proceed, re-call with authorization_confirmed=true and a non-empty authorization_note ` +
            `describing the user's explicit approval. A JSON backup is written before the call.`
        );
      }
    }

    // Multipart upload endpoints (upload_*) need local file(s); a JSON body never reaches them.
    const isMultipart = spec.requestBody?.contentType === "multipart/form-data";
    const files: string[] = Array.isArray(params?.files) ? params.files : [];
    if (files.length > 0 && !isMultipart) {
      return errorText(
        `"${spec.slug}" does not accept file uploads (its body is ${spec.requestBody?.contentType ?? "JSON"}). ` +
          `Remove "files" or choose a multipart upload endpoint.`
      );
    }
    if (isMultipart && files.length === 0) {
      return errorText(
        `"${spec.slug}" is a multipart upload endpoint — pass file path(s) via "files", ` +
          `e.g. files: ["C:/path/to/receipt.pdf"].`
      );
    }
    const missingFiles = files.filter((f) => !existsSync(f));
    if (missingFiles.length > 0) {
      return errorText(`File(s) not found: ${missingFiles.join(", ")}. Provide absolute local path(s).`);
    }

    const response = await invoiceNinjaClient.call(spec, {
      pathParams,
      query,
      body: params?.body,
      files: files.length ? files : undefined,
      fileField: params?.file_field,
      authorizationNote: params?.authorization_note,
    });

    if (response.isError) {
      return errorText(
        `Error calling ${spec.slug} (${spec.method} ${spec.path}): ${response.error}` +
          (response.backupPath ? ` [backup: ${response.backupPath}]` : "")
      );
    }

    const data = response.result as any;
    const rowCount = Array.isArray(data?.data) ? data.data.length : undefined;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            endpoint_name: spec.slug,
            method: spec.method,
            path: spec.path,
            ...(rowCount !== undefined ? { rowCount } : {}),
            ...(response.backupPath ? { backupPath: response.backupPath } : {}),
            response: response.result,
          }),
        },
      ],
    };
  },
};
