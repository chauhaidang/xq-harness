import assert from "node:assert/strict";
import test from "node:test";

import {
  ClearEnvironmentTool,
  ConfigureEnvironmentTool,
  GetEnvironmentTool
} from "../src/tools/runtime-config.js";
import { RuntimeState } from "../src/runtime/runtime-state.js";

test("runtime tools configure, redact, and clear environment", () => {
  const runtime = new RuntimeState();
  const configure = new ConfigureEnvironmentTool(runtime);
  const get = new GetEnvironmentTool(runtime);
  const clear = new ClearEnvironmentTool(runtime);

  assert.deepEqual(get.execute({}), { configured: false });

  const configured = configure.execute({
    environment: "dev",
    api_base_url: "https://api.example.test/",
    api_token: "secret-token"
  });

  assert.deepEqual(configured, {
    status: "configured",
    configured: true,
    environment: "dev",
    api_base_url: "https://api.example.test",
    has_api_token: true
  });
  assert.equal(JSON.stringify(configured).includes("secret-token"), false);
  assert.deepEqual(get.execute({}), {
    configured: true,
    environment: "dev",
    api_base_url: "https://api.example.test",
    has_api_token: true
  });
  assert.deepEqual(clear.execute({}), {
    status: "cleared",
    was_configured: true,
    configured: false
  });
});
