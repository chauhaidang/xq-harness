import assert from "node:assert/strict";
import test from "node:test";

import { RestClient } from "../src/rest/rest-client.js";
import { RuntimeState, MissingRuntimeConfigError } from "../src/runtime/runtime-state.js";
import { CallRestApiTool } from "../src/tools/rest-api.js";
import { ConfigureEnvironmentTool } from "../src/tools/runtime-config.js";
import { serveMockLearningApi } from "./testbed/mock-learning-api.js";

test("call_rest_api requires configured environment", async () => {
  const tool = new CallRestApiTool(new RuntimeState(), new RestClient());

  await assert.rejects(
    () => tool.execute({ method: "GET", path: "/health" }),
    MissingRuntimeConfigError
  );
});

test("call_rest_api uses configured runtime and reports status assertion", async () => {
  const api = await serveMockLearningApi();
  try {
    const runtime = new RuntimeState();
    new ConfigureEnvironmentTool(runtime).execute({
      environment: "testbed",
      api_base_url: api.baseUrl,
      api_token: "testbed-token"
    });

    const tool = new CallRestApiTool(runtime, new RestClient());
    const createResult = await tool.execute({
      method: "POST",
      path: "/exercises",
      body: {
        lesson_id: "lesson-a",
        count: 5,
        type: "vocabulary"
      },
      expected_status: 201
    });

    assert.equal(createResult.tool, "call_rest_api");
    assert.equal(createResult.category, "rest_api");
    assert.equal(createResult.method, "POST");
    assert.equal(createResult.statusCode, 201);
    assert.deepEqual(createResult.assertion, {
      expected_status: 201,
      actual_status: 201,
      passed: true
    });
    assert.deepEqual(createResult.json, {
      id: "ex-1",
      lesson_id: "lesson-a",
      count: 5,
      type: "vocabulary"
    });
  } finally {
    await api.close();
  }
});
