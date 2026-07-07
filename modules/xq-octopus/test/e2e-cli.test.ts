import assert from "node:assert/strict"
import { execFile as execFileWithCallback } from "node:child_process"
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from "node:http"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import test from "node:test"

const cliPath = fileURLToPath(new URL("../dist/cli/main.js", import.meta.url))
const execFile = promisify(execFileWithCallback)

test("compiled CLI calls the local test API", async () => {
  await withTestApi(async (baseUrl) => {
    const configPath = await writeConfig(baseUrl)
    const result = await runCli([
      "get",
      "/health",
      "--env",
      "e2e",
      "--config",
      configPath,
      "--expect-status",
      "200",
      "--expect-json",
      "/ok=true"
    ])

    const output = JSON.parse(result.stdout)

    assert.equal(result.exitCode, 0)
    assert.equal(output.ok, true)
    assert.equal(output.evidence.statusCode, 200)
    assert.equal(output.evidence.json.service, "xq-octopus-test-api")
  })
})

test("compiled CLI can post JSON to the local test API", async () => {
  await withTestApi(async (baseUrl) => {
    const configPath = await writeConfig(baseUrl)
    const result = await runCli([
      "post",
      "/echo",
      "--env",
      "e2e",
      "--config",
      configPath,
      "--body",
      JSON.stringify({ name: "octopus" }),
      "--expect-status",
      "201",
      "--expect-json",
      "/received/name=octopus"
    ])

    const output = JSON.parse(result.stdout)

    assert.equal(result.exitCode, 0)
    assert.equal(output.ok, true)
    assert.equal(output.evidence.statusCode, 201)
    assert.equal(output.evidence.json.received.name, "octopus")
  })
})

test("compiled CLI can fetch the local OpenAPI document", async () => {
  await withTestApi(async (baseUrl) => {
    const configPath = await writeConfig(baseUrl)
    const result = await runCli([
      "get",
      "/openapi.json",
      "--env",
      "e2e",
      "--config",
      configPath,
      "--expect-status",
      "200",
      "--expect-json",
      "/openapi=3.1.0"
    ])

    const output = JSON.parse(result.stdout)

    assert.equal(result.exitCode, 0)
    assert.equal(output.ok, true)
    assert.equal(output.evidence.json.info.title, "xq-octopus test API")
  })
})

async function withTestApi(
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createServer(handleRequest)

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  try {
    const address = server.address()
    assert.equal(typeof address, "object")
    assert.notEqual(address, null)
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)))
    })
  }
}

function handleRequest(
  request: IncomingMessage,
  response: ServerResponse
): void {
  const url = new URL(request.url ?? "/", "http://127.0.0.1")

  if (request.method === "GET" && url.pathname === "/health") {
    writeJson(response, 200, {
      ok: true,
      service: "xq-octopus-test-api"
    })
    return
  }

  if (request.method === "GET" && url.pathname === "/openapi.json") {
    writeJson(response, 200, openApiDocument)
    return
  }

  if (request.method === "POST" && url.pathname === "/echo") {
    let body = ""
    request.setEncoding("utf8")
    request.on("data", (chunk) => {
      body += chunk
    })
    request.on("end", () => {
      writeJson(response, 201, {
        received: JSON.parse(body),
        authorization: request.headers.authorization ?? null
      })
    })
    return
  }

  writeJson(response, 404, {
    error: "not found"
  })
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown
): void {
  response.writeHead(statusCode, {
    "content-type": "application/json"
  })
  response.end(JSON.stringify(body))
}

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "xq-octopus test API",
    version: "1.0.0"
  },
  paths: {
    "/health": {
      get: {
        responses: {
          "200": {
            description: "Health response"
          }
        }
      }
    },
    "/echo": {
      post: {
        responses: {
          "201": {
            description: "Echo response"
          }
        }
      }
    }
  }
}

async function runCli(args: readonly string[]): Promise<{
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
}> {
  try {
    const result = await execFile(process.execPath, [cliPath, ...args], {
      timeout: 5000
    })

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "stdout" in error &&
      "stderr" in error &&
      "code" in error
    ) {
      return {
        stdout: String(error.stdout),
        stderr: String(error.stderr),
        exitCode: Number(error.code)
      }
    }

    throw error
  }
}

async function writeConfig(apiBaseUrl: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "xq-octopus-e2e-"))
  const filePath = join(dir, "xq.json")
  await writeFile(
    filePath,
    JSON.stringify({
      environments: {
        e2e: {
          apiBaseUrl,
          apiToken: "e2e-token"
        }
      }
    })
  )
  return filePath
}
