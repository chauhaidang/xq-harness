import { RestClient } from "../rest/rest-client.js";
import { RuntimeState } from "../runtime/runtime-state.js";
import type { McpTool } from "./mcp-tool.js";
import { CallRestApiTool } from "./rest-api.js";
import {
  ClearEnvironmentTool,
  ConfigureEnvironmentTool,
  GetEnvironmentTool
} from "./runtime-config.js";

export function buildTools(
  runtime: RuntimeState = new RuntimeState(),
  restClient: RestClient = new RestClient()
): McpTool<unknown, unknown>[] {
  return [
    new ConfigureEnvironmentTool(runtime),
    new GetEnvironmentTool(runtime),
    new ClearEnvironmentTool(runtime),
    new CallRestApiTool(runtime, restClient)
  ];
}

export {
  CallRestApiTool,
  ClearEnvironmentTool,
  ConfigureEnvironmentTool,
  GetEnvironmentTool
};
export type { CallRestApiInput, CallRestApiOutput } from "./rest-api.js";
export type {
  ClearEnvironmentInput,
  ClearEnvironmentOutput,
  ConfigureEnvironmentInput,
  ConfigureEnvironmentOutput,
  GetEnvironmentInput,
  GetEnvironmentOutput
} from "./runtime-config.js";
