import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { serveMockLearningApi } from "./testbed/mock-learning-api.js";

function structured(result: unknown): Record<string, unknown> {
  assert.ok(typeof result === "object" && result !== null);
  const content = (result as { structuredContent?: unknown }).structuredContent;
  assert.ok(typeof content === "object" && content !== null && !Array.isArray(content));
  return content as Record<string, unknown>;
}

test("MCP client can invoke runtime and REST tools over stdio", async () => {
  const api = await serveMockLearningApi();
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist-test/src/bin/xq-domain-test-mcp.js"],
    cwd: process.cwd()
  });
  const client = new Client({
    name: "xq-domain-test-mcp-smoke",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((tool) => tool.name).sort(),
      [
        "call_rest_api",
        "clear_environment",
        "configure_environment",
        "get_environment"
      ]
    );

    const configured = await client.callTool({
      name: "configure_environment",
      arguments: {
        environment: "testbed",
        api_base_url: api.baseUrl,
        api_token: "testbed-token"
      }
    });
    assert.equal(structured(configured).configured, true);

    const created = await client.callTool({
      name: "call_rest_api",
      arguments: {
        method: "POST",
        path: "/exercises",
        body: {
          lesson_id: "lesson-a",
          count: 5,
          type: "vocabulary"
        },
        expected_status: 201
      }
    });
    assert.equal(structured(created).statusCode, 201);
    assert.deepEqual(structured(created).assertion, {
      expected_status: 201,
      actual_status: 201,
      passed: true
    });

    const listed = await client.callTool({
      name: "call_rest_api",
      arguments: {
        method: "GET",
        path: "/exercises?lesson_id=lesson-a",
        expected_status: 200
      }
    });
    assert.equal(structured(listed).statusCode, 200);

    const status = await client.callTool({
      name: "get_environment",
      arguments: {}
    });
    assert.equal(structured(status).configured, true);
    assert.equal(structured(status).has_api_token, true);

    const cleared = await client.callTool({
      name: "clear_environment",
      arguments: {}
    });
    assert.deepEqual(cleared.structuredContent, {
      status: "cleared",
      was_configured: true,
      configured: false
    });
  } finally {
    await client.close();
    await api.close();
  }
});
