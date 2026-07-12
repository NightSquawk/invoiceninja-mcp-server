import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class InvoiceNinjaMCPServer {
  private static instance: McpServer | null = null;

  private constructor() {}

  public static GetServer(): McpServer {
    if (InvoiceNinjaMCPServer.instance === null) {
      InvoiceNinjaMCPServer.instance = new McpServer(
        {
          name: "Invoice Ninja MCP Server",
          version: "0.0.1",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
    }
    return InvoiceNinjaMCPServer.instance;
  }
}
