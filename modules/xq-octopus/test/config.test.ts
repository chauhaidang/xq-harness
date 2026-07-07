import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { loadRuntimeConfig } from "../app/config/loader.ts"
import { redactRuntimeConfig } from "../app/model/config.ts"

test("loads valid runtime config", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test",
        apiToken: "secret-token",
        headers: {
          "X-App": "local"
        }
      }
    }
  })

  const config = await loadRuntimeConfig(configPath, "dev")

  assert.deepEqual(config, {
    environment: "dev",
    apiBaseUrl: "https://api.example.test",
    apiToken: "secret-token",
    headers: {
      "X-App": "local"
    }
  })
})

test("defaults optional token and headers", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test"
      }
    }
  })

  const config = await loadRuntimeConfig(configPath, "dev")

  assert.equal(config.apiToken, null)
  assert.deepEqual(config.headers, {})
})

test("fails on missing config file", async () => {
  await assert.rejects(() => loadRuntimeConfig("missing-xq.json", "dev"), {
    name: "ConfigError",
    code: "missing_config"
  })
})

test("fails on invalid JSON", async () => {
  const configPath = await writeText("{")

  await assert.rejects(() => loadRuntimeConfig(configPath, "dev"), {
    name: "ConfigError",
    code: "invalid_json"
  })
})

test("fails on unknown environment", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test"
      }
    }
  })

  await assert.rejects(() => loadRuntimeConfig(configPath, "prod"), {
    name: "ConfigError",
    code: "unknown_environment"
  })
})

test("fails on missing apiBaseUrl", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {}
    }
  })

  await assert.rejects(() => loadRuntimeConfig(configPath, "dev"), {
    name: "ConfigError",
    code: "invalidApiBaseUrl"
  })
})

test("fails on non-string header values", async () => {
  const configPath = await writeConfig({
    environments: {
      dev: {
        apiBaseUrl: "https://api.example.test",
        headers: {
          "X-App": 123
        }
      }
    }
  })

  await assert.rejects(() => loadRuntimeConfig(configPath, "dev"), {
    name: "ConfigError",
    code: "invalid_headers"
  })
})

test("redacts token from runtime config", () => {
  const redacted = redactRuntimeConfig({
    environment: "dev",
    apiBaseUrl: "https://api.example.test",
    apiToken: "secret-token",
    headers: {
      "X-App": "local"
    }
  })

  assert.deepEqual(redacted, {
    environment: "dev",
    apiBaseUrl: "https://api.example.test",
    hasApiToken: true,
    headers: {
      "X-App": "local"
    }
  })
  assert.equal(JSON.stringify(redacted).includes("secret-token"), false)
})

async function writeConfig(config: unknown): Promise<string> {
  return writeText(JSON.stringify(config))
}

async function writeText(contents: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "xq-octopus-config-"))
  const filePath = join(dir, "xq.json")
  await writeFile(filePath, contents)
  return filePath
}
