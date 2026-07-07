import assert from "node:assert/strict"
import test from "node:test"

import { commandCatalog } from "../dist/tools/catalog.js"

test("command catalog includes every public command", () => {
  assert.deepEqual(
    commandCatalog.map((entry) => entry.name),
    ["commands", "config", "get", "post", "put", "patch", "delete"]
  )
})

test("each command has agent-facing metadata", () => {
  for (const entry of commandCatalog) {
    assert.notEqual(entry.summary, "")
    assert.notEqual(entry.whenToUse, "")
    assert.notEqual(entry.outputShape, "")
    assert.ok(Object.keys(entry.exitCodes).length > 0)
    assert.ok(entry.examples.length > 0)
  }
})
