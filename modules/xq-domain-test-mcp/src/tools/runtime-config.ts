import { z } from "zod/v4";

import type { RuntimeEnvironmentStatus, RuntimeState } from "../runtime/runtime-state.js";
import type { McpTool } from "./mcp-tool.js";

export type ConfigureEnvironmentInput = {
  environment: string;
  api_base_url: string;
  api_token?: string;
};

export type ConfigureEnvironmentOutput = {
  status: "configured";
  configured: true;
  environment: string;
  api_base_url: string;
  has_api_token: boolean;
};

export type GetEnvironmentInput = Record<string, never>;
export type GetEnvironmentOutput = RuntimeEnvironmentStatus;
export type ClearEnvironmentInput = Record<string, never>;
export type ClearEnvironmentOutput = {
  status: "cleared";
  was_configured: boolean;
  configured: false;
};

const environmentStatusSchema = z.object({
  configured: z.boolean(),
  environment: z.string().optional(),
  api_base_url: z.string().optional(),
  has_api_token: z.boolean().optional()
});

const configuredStatusSchema = z.object({
  configured: z.literal(true),
  environment: z.string(),
  api_base_url: z.string(),
  has_api_token: z.boolean()
});

export class ConfigureEnvironmentTool
  implements McpTool<ConfigureEnvironmentInput, ConfigureEnvironmentOutput>
{
  readonly name = "configure_environment";
  readonly category = "runtime_config";
  readonly title = "Configure Environment";
  readonly description = "Configure runtime environment parameters for this MCP process.";
  readonly inputSchema = z.object({
    environment: z.string().min(1),
    api_base_url: z.string().min(1),
    api_token: z.string().optional()
  }) satisfies z.ZodType<ConfigureEnvironmentInput>;
  readonly outputSchema = configuredStatusSchema.extend({
    status: z.literal("configured")
  }) satisfies z.ZodType<ConfigureEnvironmentOutput>;

  constructor(private readonly runtime: RuntimeState) {}

  execute(input: ConfigureEnvironmentInput): ConfigureEnvironmentOutput {
    return this.runtime.configure(input);
  }
}

export class GetEnvironmentTool implements McpTool<GetEnvironmentInput, GetEnvironmentOutput> {
  readonly name = "get_environment";
  readonly category = "runtime_config";
  readonly title = "Get Environment";
  readonly description = "Read redacted runtime environment status.";
  readonly annotations = { readOnlyHint: true };
  readonly inputSchema = z.object({}) satisfies z.ZodType<GetEnvironmentInput>;
  readonly outputSchema = environmentStatusSchema satisfies z.ZodType<GetEnvironmentOutput>;

  constructor(private readonly runtime: RuntimeState) {}

  execute(_input: GetEnvironmentInput): GetEnvironmentOutput {
    return this.runtime.status();
  }
}

export class ClearEnvironmentTool implements McpTool<ClearEnvironmentInput, ClearEnvironmentOutput> {
  readonly name = "clear_environment";
  readonly category = "runtime_config";
  readonly title = "Clear Environment";
  readonly description = "Clear runtime environment parameters from memory.";
  readonly inputSchema = z.object({}) satisfies z.ZodType<ClearEnvironmentInput>;
  readonly outputSchema = z.object({
    status: z.literal("cleared"),
    was_configured: z.boolean(),
    configured: z.literal(false)
  }) satisfies z.ZodType<ClearEnvironmentOutput>;

  constructor(private readonly runtime: RuntimeState) {}

  execute(_input: ClearEnvironmentInput): ClearEnvironmentOutput {
    return this.runtime.clear();
  }
}
