#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { InvoiceNinjaMCPServer } from "./server/invoiceninja-mcp-server.js";
import { registerAllEndpointTools } from "./helpers/register-endpoint-tools.js";

const server = InvoiceNinjaMCPServer.GetServer();
registerAllEndpointTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
