import { z } from "zod/v4";

import type { RestCallInput, RestCallOutput, RestClient } from "../rest/rest-client.js";
import type { RuntimeState } from "../runtime/runtime-state.js";
import type { McpTool } from "./mcp-tool.js";

export type CallRestApiInput = RestCallInput;
export type CallRestApiOutput = RestCallOutput;

export class CallRestApiTool implements McpTool<CallRestApiInput, CallRestApiOutput> {
  readonly name = "call_rest_api";
  readonly category = "rest_api";
  readonly title = "Call REST API";
  readonly description = "Call a REST endpoint using the configured runtime environment.";
  readonly inputSchema = z.object({
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: z.string().min(1),
    body: z.unknown().optional(),
    expected_status: z.number().int().min(100).max(599).optional(),
    timeout_seconds: z.number().positive().optional()
  }) satisfies z.ZodType<CallRestApiInput>;
  readonly outputSchema = z.object({
    tool: z.literal("call_rest_api"),
    category: z.literal("rest_api"),
    method: z.string(),
    url: z.string().url(),
    statusCode: z.number().int(),
    json: z.unknown().optional(),
    assertion: z.object({
      expected_status: z.number().int(),
      actual_status: z.number().int(),
      passed: z.boolean()
    }).optional()
  }) satisfies z.ZodType<CallRestApiOutput>;

  constructor(
    private readonly runtime: RuntimeState,
    private readonly restClient: RestClient
  ) {}

  async execute(input: CallRestApiInput): Promise<CallRestApiOutput> {
    const config = this.runtime.requireEnvironment();
    return this.restClient.call(config, input);
  }
}
