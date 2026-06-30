import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { RestClient } from "../rest/rest-client.js";
import { RuntimeState } from "../runtime/runtime-state.js";
import { buildTools } from "../tools/index.js";
import { ToolRegistry } from "../tools/tool-registry.js";

export function buildServer(
  runtime: RuntimeState = new RuntimeState(),
  restClient: RestClient = new RestClient()
): McpServer {
  const server = new McpServer({
    name: "xq-domain-test-mcp",
    version: "1.0.0"
  });
  new ToolRegistry(buildTools(runtime, restClient)).registerAll(server);
  return server;
}

export async function runStdioServer(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
