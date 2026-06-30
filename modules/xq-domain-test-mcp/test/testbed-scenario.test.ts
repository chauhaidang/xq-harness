import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { RestClient } from "../src/rest/rest-client.js";
import { RuntimeState } from "../src/runtime/runtime-state.js";
import type { McpTool } from "../src/tools/mcp-tool.js";
import { buildTools } from "../src/tools/index.js";
import { serveMockLearningApi } from "./testbed/mock-learning-api.js";

type MappingStep = {
  tool: string;
  arguments?: Record<string, unknown>;
  expect?: Record<string, unknown>;
};

type Mapping = {
  steps: MappingStep[];
};

const mappingsDir = path.resolve("testbed/mappings");

function substituteTemplates(value: unknown, variables: Record<string, string>): unknown {
  if (typeof value === "string") {
    let result = value;
    for (const [key, replacement] of Object.entries(variables)) {
      result = result.replaceAll(`{{${key}}}`, replacement);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((item) => substituteTemplates(item, variables));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        substituteTemplates(item, variables)
      ])
    );
  }
  return value;
}

function valueAtPath(payload: unknown, dottedPath: string): unknown {
  let current = payload;
  for (const segment of dottedPath.split(".")) {
    const match = /^([A-Za-z_]+)(?:\[(\d+)])?$/.exec(segment);
    if (match === null) {
      throw new Error(`Invalid expect path segment: ${segment}`);
    }
    if (typeof current !== "object" || current === null) {
      throw new Error(`Expected object at ${segment}`);
    }
    current = (current as Record<string, unknown>)[match[1] ?? ""];
    if (match[2] !== undefined) {
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at ${segment}`);
      }
      current = current[Number(match[2])];
    }
  }
  return current;
}

test("testbed mappings replay through tool classes", async () => {
  const files = (await readdir(mappingsDir)).filter((file) => file.endsWith(".json"));
  assert.ok(files.length > 0);

  for (const file of files) {
    const api = await serveMockLearningApi();
    try {
      const mapping = JSON.parse(
        await readFile(path.join(mappingsDir, file), "utf8")
      ) as Mapping;
      const tools = new Map<string, McpTool<unknown, unknown>>();
      for (const tool of buildTools(new RuntimeState(), new RestClient())) {
        tools.set(tool.name, tool);
      }

      for (const step of mapping.steps) {
        const tool = tools.get(step.tool);
        assert.ok(tool, `unsupported tool ${step.tool}`);
        const args = substituteTemplates(step.arguments ?? {}, {
          mock_api_base_url: api.baseUrl
        });
        const input = tool.inputSchema.parse(args);
        const result = tool.outputSchema.parse(await tool.execute(input));

        for (const [expectPath, expected] of Object.entries(step.expect ?? {})) {
          assert.deepEqual(valueAtPath(result, expectPath), expected, expectPath);
        }
      }
    } finally {
      await api.close();
    }
  }
});
