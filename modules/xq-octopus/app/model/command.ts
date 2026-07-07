import type { RuntimeConfig } from "./config.js"
import type { CommandResult, JsonValue } from "./result.js"

export type RestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface Command {
  readonly kind: string
  readonly timeoutMs: number
  execute(context: ExecutionContext): Promise<CommandResult>
}

export interface ExecutionContext {
  readonly config: RuntimeConfig
  readonly tools: ToolFactory
}

export interface ToolFactory {
  rest(): RestCommandTool
}

export interface RestCommandTool {
  callGet(command: RestCommand, config: RuntimeConfig): Promise<CommandResult>
  callPost(command: RestCommand, config: RuntimeConfig): Promise<CommandResult>
  callPut(command: RestCommand, config: RuntimeConfig): Promise<CommandResult>
  callPatch(command: RestCommand, config: RuntimeConfig): Promise<CommandResult>
  callDelete(
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult>
}

export class RestCommand implements Command {
  readonly kind = "rest"
  readonly method: RestMethod
  readonly path: string
  readonly body: JsonValue | null
  readonly expectedStatus: number | null
  readonly expectedJson: readonly string[]
  readonly timeoutMs: number

  constructor(
    method: RestMethod,
    path: string,
    body: JsonValue | null,
    expectedStatus: number | null,
    expectedJson: readonly string[],
    timeoutMs: number
  ) {
    this.method = method
    this.path = path
    this.body = body
    this.expectedStatus = expectedStatus
    this.expectedJson = expectedJson
    this.timeoutMs = timeoutMs
  }

  async execute(context: ExecutionContext): Promise<CommandResult> {
    const restTool = context.tools.rest()

    switch (this.method) {
      case "GET":
        return restTool.callGet(this, context.config)
      case "POST":
        return restTool.callPost(this, context.config)
      case "PUT":
        return restTool.callPut(this, context.config)
      case "PATCH":
        return restTool.callPatch(this, context.config)
      case "DELETE":
        return restTool.callDelete(this, context.config)
    }
  }
}
