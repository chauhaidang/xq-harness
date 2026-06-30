import type { z } from "zod/v4";

export type ToolCategory = "runtime_config" | "rest_api";

export type ToolAnnotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export interface McpTool<Input, Output> {
  readonly name: string;
  readonly category: ToolCategory;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: z.ZodType<Input>;
  readonly outputSchema: z.ZodType<Output>;
  readonly annotations?: ToolAnnotations;

  execute(input: Input): Promise<Output> | Output;
}
