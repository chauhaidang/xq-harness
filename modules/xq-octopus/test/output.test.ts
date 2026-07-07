import assert from "node:assert/strict"
import test from "node:test"

import {
  renderJson,
  renderPrettyConfig,
  renderPrettyResult
} from "../dist/cli/output.js"

test("default output is valid JSON", () => {
  const rendered = renderJson({
    ok: true,
    exitCode: 0,
    command: "GET /health",
    validations: []
  })

  assert.equal(JSON.parse(rendered).ok, true)
})

test("pretty config output does not leak token values", () => {
  const rendered = renderPrettyConfig({
    environment: "dev",
    apiBaseUrl: "https://api.example.test",
    hasApiToken: true,
    headers: {}
  })

  assert.match(rendered, /API token configured: yes/)
  assert.equal(rendered.includes("secret-token"), false)
})

test("pretty error output is structured", () => {
  const rendered = renderPrettyResult({
    ok: false,
    exitCode: 2,
    command: "config",
    validations: [],
    error: {
      kind: "config",
      message: "missing config"
    }
  })

  assert.equal(rendered, "Error (config): missing config")
})
