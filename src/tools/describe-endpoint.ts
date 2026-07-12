import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadEndpointSpec, loadIndex, suggestSlugs } from "../catalog/endpoint-spec.js";

const schema = z.object({
  endpoint_name: z
    .string()
    .describe("The endpoint slug, e.g. 'get_invoices', 'show_invoice', 'store_invoice'. See list_endpoints."),
});

/**
 * Returns the full spec for one endpoint: method, path, every path/query parameter
 * and request-body field with types, required flags, enums and descriptions, plus
 * the mutating flag. The model calls this just before call_endpoint so it sends the
 * exact parameter keys this endpoint expects.
 */
export const describeEndpointTool: ToolDefinition<typeof schema> = {
  name: "describe_endpoint",
  description:
    "Get the full specification for a single Invoice Ninja endpoint: HTTP method, path, " +
    "path/query parameters, request-body fields (types, required, enums, descriptions), and whether " +
    "it mutates data. Call this before call_endpoint to know exactly what to pass.",
  schema,
  handler: async ({ params }: any) => {
    const name: string = params?.endpoint_name;
    const spec = loadEndpointSpec(name);

    if (!spec) {
      const suggestions = suggestSlugs(name);
      const total = loadIndex().endpointCount;
      return {
        content: [
          {
            type: "text" as const,
            text:
              `Unknown endpoint "${name}". ` +
              (suggestions.length ? `Did you mean: ${suggestions.join(", ")}? ` : "") +
              `Call list_endpoints to see all ${total} endpoints.`,
          },
        ],
      };
    }

    const payload = {
      endpoint_name: spec.slug,
      name: spec.name,
      method: spec.method,
      path: spec.path,
      category: spec.category,
      mutating: spec.mutating,
      description: spec.description,
      whenToUse: spec.whenToUse,
      pathParameters: spec.pathParameters,
      queryParameters: spec.queryParameters,
      headerParameters: spec.headerParameters,
      requestBody: spec.requestBody,
      responseSchema: spec.responseSchema,
      ...(spec.mutating
        ? {
            mutationNotice:
              "This endpoint changes data. call_endpoint requires authorization_confirmed=true and an " +
              "authorization_note, and writes a JSON backup before executing.",
          }
        : {}),
    };

    return { content: [{ type: "text" as const, text: JSON.stringify(payload) }] };
  },
};
