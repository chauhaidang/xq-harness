import assert from "node:assert/strict"
import test from "node:test"

import { RestTool } from "../dist/tools/rest-tool.js"
import { ToolFactory } from "../dist/tools/factory.js"

test("creates RestTool", () => {
  const factory = new ToolFactory()

  assert.equal(factory.rest() instanceof RestTool, true)
})

test("reuses cached RestTool instance", () => {
  const factory = new ToolFactory()

  assert.equal(factory.rest(), factory.rest())
})
