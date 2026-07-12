import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadIndex } from "../catalog/endpoint-spec.js";

const schema = z.object({
  category: z
    .string()
    .optional()
    .describe(
      "Optional category filter (the API resource tag, e.g. 'invoices', 'clients', 'payments', " +
        "'reports'). Omit to list every endpoint. Call without args first to see all categories."
    ),
  mutating: z
    .boolean()
    .optional()
    .describe("Optional: true = only state-changing endpoints (POST/PUT/DELETE); false = only read-only (GET)."),
  search: z
    .string()
    .optional()
    .describe("Optional case-insensitive substring matched against slug, name, path, and summary."),
});

/**
 * Lightweight discovery tool. Returns slug, method, path, category, mutating flag
 * and a one-line summary per endpoint so the model can pick one, then call
 * describe_endpoint for its full parameter spec.
 */
export const listEndpointsTool: ToolDefinition<typeof schema> = {
  name: "list_endpoints",
  description:
    "List Invoice Ninja API endpoints (slug, method, path, category, mutating, summary). " +
    "Filter by category, read-vs-mutating, or a search term. Use this to discover which endpoint " +
    "to call, then describe_endpoint for its parameters and call_endpoint to execute it.",
  schema,
  handler: async ({ params }: any) => {
    const index = loadIndex();
    let endpoints = index.endpoints;

    const category: string | undefined = params?.category;
    const mutating: boolean | undefined = params?.mutating;
    const search: string | undefined = params?.search;

    if (category) {
      const wanted = category.toLowerCase();
      endpoints = endpoints.filter((e) => e.category.toLowerCase() === wanted);
    }
    if (mutating !== undefined) {
      endpoints = endpoints.filter((e) => e.mutating === mutating);
    }
    if (search) {
      const q = search.toLowerCase();
      endpoints = endpoints.filter(
        (e) =>
          e.slug.includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q)
      );
    }

    const payload = {
      matched: endpoints.length,
      totalEndpoints: index.endpointCount,
      readCount: index.readCount,
      mutatingCount: index.mutatingCount,
      categories: index.categories,
      endpoints: endpoints.map((e) => ({
        endpoint_name: e.slug,
        method: e.method,
        path: e.path,
        category: e.category,
        mutating: e.mutating,
        summary: e.summary,
      })),
    };

    if ((category || search || mutating !== undefined) && endpoints.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              `No endpoints matched. ` +
              `Available categories: ${index.categories.map((c) => c.name).join(", ")}.`,
          },
        ],
      };
    }

    return { content: [{ type: "text" as const, text: JSON.stringify(payload) }] };
  },
};
