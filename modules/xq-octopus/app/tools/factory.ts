import type { ToolFactory as ToolFactoryContract } from "../model/command.js"
import { RestTool } from "./rest-tool.js"

export class ToolFactory implements ToolFactoryContract {
  private restTool?: RestTool

  rest(): RestTool {
    this.restTool ??= new RestTool()
    return this.restTool
  }
}
