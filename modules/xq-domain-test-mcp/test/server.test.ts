import assert from "node:assert/strict";
import test from "node:test";

import { buildServer } from "../src/mcp/stdio-server.js";

test("buildServer creates an MCP server", () => {
  const server = buildServer();
  assert.ok(server);
});
