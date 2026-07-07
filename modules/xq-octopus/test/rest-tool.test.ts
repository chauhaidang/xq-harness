import assert from "node:assert/strict"
import test from "node:test"

import { RestCommand } from "../dist/model/command.js"
import type { RuntimeConfig } from "../dist/model/config.js"
import { RestTool } from "../dist/tools/rest-tool.js"

test("builds URL, sends headers and body, parses JSON response, and validates", async () => {
  const calls = stubFetch(
    new Response(JSON.stringify({ id: 123, ok: true }), {
      status: 201,
      headers: {
        "content-type": "application/json"
      }
    })
  )

  try {
    const tool = new RestTool()
    const command = new RestCommand(
      "POST",
      "/users",
      { name: "Ada" },
      201,
      ["/id=123"],
      1000
    )
    const result = await tool.callPost(
      command,
      runtimeConfig("https://api.example.test")
    )

    assert.equal(result.ok, true)
    assert.equal(result.exitCode, 0)
    assert.equal(result.evidence?.url, "https://api.example.test/users")
    assert.equal(result.evidence?.statusCode, 201)
    assert.deepEqual(result.evidence?.json, { id: 123, ok: true })
    assert.equal(result.evidence?.text, null)
    assert.deepEqual(
      result.validations.map((validation) => validation.passed),
      [true, true]
    )
    assert.equal(calls[0]?.url, "https://api.example.test/users")
    assert.equal(calls[0]?.init.method, "POST")
    assert.equal(calls[0]?.headers.authorization, "Bearer secret-token")
    assert.equal(calls[0]?.headers["x-app"], "local")
    assert.equal(calls[0]?.headers["content-type"], "application/json")
    assert.equal(calls[0]?.init.body, JSON.stringify({ name: "Ada" }))
  } finally {
    restoreFetch()
  }
})

test("keeps text response when response is not JSON", async () => {
  stubFetch(new Response("pong", { status: 200 }))

  try {
    const result = await new RestTool().callGet(
      new RestCommand("GET", "/ping", null, 200, [], 1000),
      runtimeConfig("https://api.example.test")
    )

    assert.equal(result.ok, true)
    assert.equal(result.evidence?.json, null)
    assert.equal(result.evidence?.text, "pong")
  } finally {
    restoreFetch()
  }
})

test("handles HTTP validation failure as structured evidence", async () => {
  stubFetch(
    new Response(JSON.stringify({ error: "boom" }), {
      status: 500,
      headers: {
        "content-type": "application/json"
      }
    })
  )

  try {
    const result = await new RestTool().callGet(
      new RestCommand("GET", "/health", null, 200, [], 1000),
      runtimeConfig("https://api.example.test")
    )

    assert.equal(result.ok, false)
    assert.equal(result.exitCode, 1)
    assert.equal(result.evidence?.statusCode, 500)
    assert.equal(result.validations[0]?.passed, false)
  } finally {
    restoreFetch()
  }
})

test("maps fetch failures to transport errors", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() =>
    Promise.reject(new Error("network down"))) as typeof fetch

  try {
    const result = await new RestTool().callGet(
      new RestCommand("GET", "/health", null, 200, [], 1000),
      runtimeConfig("https://api.example.test")
    )

    assert.equal(result.ok, false)
    assert.equal(result.exitCode, 3)
    assert.equal(result.error?.kind, "transport")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("exposes method-specific calls", () => {
  const tool = new RestTool()

  assert.equal(typeof tool.callGet, "function")
  assert.equal(typeof tool.callPost, "function")
  assert.equal(typeof tool.callPut, "function")
  assert.equal(typeof tool.callPatch, "function")
  assert.equal(typeof tool.callDelete, "function")
})

interface FetchCall {
  readonly url: string
  readonly init: RequestInit
  readonly headers: Readonly<Record<string, string>>
}

const realFetch = globalThis.fetch

function stubFetch(response: Response): FetchCall[] {
  const calls: FetchCall[] = []
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const headers = Object.fromEntries(new Headers(init?.headers).entries())
    calls.push({
      url: input.toString(),
      init: init ?? {},
      headers
    })
    return Promise.resolve(response.clone())
  }) as typeof fetch
  return calls
}

function restoreFetch(): void {
  globalThis.fetch = realFetch
}

function runtimeConfig(apiBaseUrl: string): RuntimeConfig {
  return {
    environment: "test",
    apiBaseUrl,
    apiToken: "secret-token",
    headers: {
      "X-App": "local"
    }
  }
}
