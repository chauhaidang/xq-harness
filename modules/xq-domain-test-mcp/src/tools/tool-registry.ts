import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod/v4";

import type { McpTool } from "./mcp-tool.js";

type SdkToolShape = Record<string, z.ZodType<unknown>>;

function asSdkShape(schema: z.ZodType<unknown>): SdkToolShape {
  const maybeShape = schema as z.ZodType<unknown> & { shape?: SdkToolShape };
  return maybeShape.shape ?? {};
}

function asStructuredContent(output: unknown): Record<string, unknown> {
  if (typeof output !== "object" || output === null || Array.isArray(output)) {
    throw new Error("Tool output must be an object for MCP structuredContent.");
  }
  return output as Record<string, unknown>;
}

export class ToolRegistry {
  constructor(private readonly tools: readonly McpTool<unknown, unknown>[]) {}

  registerAll(server: McpServer): void {
    for (const tool of this.tools) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: asSdkShape(tool.inputSchema),
          outputSchema: asSdkShape(tool.outputSchema),
          annotations: tool.annotations
        },
        async (rawInput: unknown) => {
          const input = tool.inputSchema.parse(rawInput);
          const output = await tool.execute(input);
          const structuredContent = asStructuredContent(tool.outputSchema.parse(output));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(structuredContent)
              }
            ],
            structuredContent
          };
        }
      );
    }
  }
}
