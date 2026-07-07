import assert from "node:assert/strict"
import test from "node:test"

import { ExecutionEngine } from "../dist/core/engine.js"
import type { Command, ExecutionContext } from "../dist/model/command.js"
import type { RuntimeConfig } from "../dist/model/config.js"
import type { CommandResult } from "../dist/model/result.js"
import { ToolFactory } from "../dist/tools/factory.js"

test("delegates to command.execute with execution context", async () => {
  const tools = new ToolFactory()
  let receivedContext: ExecutionContext | null = null
  const command: Command = {
    kind: "fake",
    timeoutMs: 1000,
    async execute(context) {
      receivedContext = context
      return okResult("fake")
    }
  }

  const result = await new ExecutionEngine(runtimeConfig(), { tools }).execute(
    command
  )

  assert.equal(result.ok, true)
  assert.equal(receivedContext?.config.environment, "test")
  assert.equal(receivedContext?.tools, tools)
})

test("maps uncaught command failures to structured result", async () => {
  const command: Command = {
    kind: "fake",
    timeoutMs: 1000,
    async execute() {
      throw new Error("boom")
    }
  }

  const result = await new ExecutionEngine(runtimeConfig()).execute(command)

  assert.equal(result.ok, false)
  assert.equal(result.exitCode, 3)
  assert.equal(result.error?.kind, "unexpected")
  assert.equal(result.error?.message, "boom")
})

function runtimeConfig(): RuntimeConfig {
  return {
    environment: "test",
    apiBaseUrl: "https://api.example.test",
    apiToken: null,
    headers: {}
  }
}

function okResult(command: string): CommandResult {
  return {
    ok: true,
    exitCode: 0,
    command,
    validations: []
  }
}
