import type { RuntimeConfig } from "../model/config.js"
import type { Command, ExecutionContext } from "../model/command.js"
import type { CommandResult } from "../model/result.js"
import { ToolFactory } from "../tools/factory.js"

export interface ExecutionEngineOptions {
  readonly tools?: ToolFactory
}

export class ExecutionEngine {
  private readonly config: RuntimeConfig
  private readonly tools: ToolFactory

  constructor(config: RuntimeConfig, options: ExecutionEngineOptions = {}) {
    this.config = config
    this.tools = options.tools ?? new ToolFactory()
  }

  async execute(command: Command): Promise<CommandResult> {
    const context: ExecutionContext = {
      config: this.config,
      tools: this.tools
    }

    try {
      return await command.execute(context)
    } catch (error) {
      return {
        ok: false,
        exitCode: 3,
        command: command.kind,
        validations: [],
        error: {
          kind: "unexpected",
          message:
            error instanceof Error
              ? error.message
              : "Unexpected command failure"
        }
      }
    }
  }
}
