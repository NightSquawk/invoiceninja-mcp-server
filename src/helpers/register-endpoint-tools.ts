import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RegisterTool } from "@nightsquawktech/mcp-core/catalog";
import { listEndpointsTool } from "../tools/list-endpoints.js";
import { describeEndpointTool } from "../tools/describe-endpoint.js";
import { callEndpointTool } from "../tools/call-endpoint.js";
import { loadIndex } from "../catalog/endpoint-spec.js";

/**
 * Registers the consolidated Invoice Ninja tools with the MCP server.
 *
 * Instead of one tool per endpoint (~379 tools = heavy context cost and poor tool
 * selection), we expose three tools backed by the endpoint catalog:
 *   - list_endpoints      discover endpoints by category / search / read-vs-mutating
 *   - describe_endpoint   full parameter spec for one endpoint
 *   - call_endpoint       validate against the catalog spec, then execute (guarded writes)
 *
 * Boot-time sanity check: the catalog index must load and be non-empty, so a
 * missing/uncopied catalog fails fast at startup rather than on first tool call.
 */
export function registerAllEndpointTools(server: McpServer): void {
  const index = loadIndex();
  if (!index.endpoints || index.endpoints.length === 0) {
    throw new Error(
      "Endpoint catalog is empty or missing — expected src/catalog/index.json with endpoints. " +
        "Did the build copy the catalog into dist/?"
    );
  }

  RegisterTool(server, listEndpointsTool);
  RegisterTool(server, describeEndpointTool);
  RegisterTool(server, callEndpointTool);
}
