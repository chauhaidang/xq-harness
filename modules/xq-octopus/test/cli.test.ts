import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { buildCli, type CliRuntime } from "../dist/cli/main.js"

test("config --env prints redacted JSON", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test",
        apiToken: "secret-token"
      }
    }
  })
  const runtime = createRuntime()

  await buildCli(runtime).parseAsync([
    "node",
    "xq-octopus",
    "config",
    "--env",
    "dev",
    "--config",
    configPath
  ])

  const output = JSON.parse(runtime.stdout[0] ?? "{}")
  assert.equal(output.environment, "dev")
  assert.equal(output.hasApiToken, true)
  assert.equal(JSON.stringify(output).includes("secret-token"), false)
  assert.equal(runtime.exitCode, 0)
})

test("commands --json returns valid command catalog JSON", async () => {
  const runtime = createRuntime()

  await buildCli(runtime).parseAsync([
    "node",
    "xq-octopus",
    "commands",
    "--json"
  ])

  const output = JSON.parse(runtime.stdout[0] ?? "[]")
  assert.equal(Array.isArray(output), true)
  assert.equal(
    output.some((entry: { readonly name: string }) => entry.name === "get"),
    true
  )
})

test("get exits 0 when validations pass", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test"
      }
    }
  })
  const runtime = createRuntime()
  stubFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }))

  try {
    await buildCli(runtime).parseAsync([
      "node",
      "xq-octopus",
      "get",
      "/health",
      "--env",
      "dev",
      "--config",
      configPath,
      "--expect-status",
      "200",
      "--expect-json",
      "/ok=true"
    ])

    const output = JSON.parse(runtime.stdout[0] ?? "{}")
    assert.equal(output.ok, true)
    assert.equal(runtime.exitCode, 0)
  } finally {
    restoreFetch()
  }
})

test("failed expected status exits 1", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test"
      }
    }
  })
  const runtime = createRuntime()
  stubFetch(new Response(JSON.stringify({ ok: false }), { status: 500 }))

  try {
    await buildCli(runtime).parseAsync([
      "node",
      "xq-octopus",
      "get",
      "/health",
      "--env",
      "dev",
      "--config",
      configPath,
      "--expect-status",
      "200"
    ])

    const output = JSON.parse(runtime.stdout[0] ?? "{}")
    assert.equal(output.ok, false)
    assert.equal(runtime.exitCode, 1)
  } finally {
    restoreFetch()
  }
})

test("missing config exits 2", async () => {
  const runtime = createRuntime()

  await buildCli(runtime).parseAsync([
    "node",
    "xq-octopus",
    "config",
    "--env",
    "dev",
    "--config",
    "missing-xq.json"
  ])

  const error = JSON.parse(runtime.stderr[0] ?? "{}")
  assert.equal(error.exitCode, 2)
  assert.equal(error.error.kind, "config")
  assert.equal(runtime.exitCode, 2)
})

interface TestRuntime extends CliRuntime {
  readonly stdout: string[]
  readonly stderr: string[]
  exitCode: number
}

const realFetch = globalThis.fetch

function createRuntime(): TestRuntime {
  return {
    stdout: [],
    stderr: [],
    exitCode: 0,
    writeOut(message) {
      this.stdout.push(message)
    },
    writeErr(message) {
      this.stderr.push(message)
    },
    setExitCode(code) {
      this.exitCode = code
    }
  }
}

function stubFetch(response: Response): void {
  globalThis.fetch = (() => Promise.resolve(response.clone())) as typeof fetch
}

function restoreFetch(): void {
  globalThis.fetch = realFetch
}

async function writeConfig(config: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "xq-octopus-cli-"))
  const filePath = join(dir, "xq.json")
  await writeFile(filePath, JSON.stringify(config))
  return filePath
}
