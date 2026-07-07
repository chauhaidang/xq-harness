import type { RuntimeConfig } from "../model/config.js"
import type { RestCommand } from "../model/command.js"
import type {
  CommandResult,
  HttpResponseEvidence,
  JsonValue,
  ValidationResult
} from "../model/result.js"
import { validateJsonExpectations, validateStatus } from "./validation.js"

export class RestTool {
  async callGet(
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult> {
    return this.call("GET", command, config)
  }

  async callPost(
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult> {
    return this.call("POST", command, config)
  }

  async callPut(
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult> {
    return this.call("PUT", command, config)
  }

  async callPatch(
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult> {
    return this.call("PATCH", command, config)
  }

  async callDelete(
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult> {
    return this.call("DELETE", command, config)
  }

  private async call(
    method: string,
    command: RestCommand,
    config: RuntimeConfig
  ): Promise<CommandResult> {
    const url = buildUrl(config.apiBaseUrl, command.path)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), command.timeoutMs)
    const startedAt = performance.now()

    try {
      const response = await fetch(url, {
        method,
        headers: buildHeaders(config, command.body),
        body: command.body === null ? undefined : JSON.stringify(command.body),
        signal: controller.signal
      })
      const evidence = await buildEvidence(
        method,
        url,
        response,
        performance.now() - startedAt
      )
      const validations = buildValidations(command, evidence)
      const ok = validations.every((validation) => validation.passed)

      return {
        ok,
        exitCode: ok ? 0 : 1,
        command: `${method} ${command.path}`,
        evidence,
        validations
      }
    } catch (error) {
      return {
        ok: false,
        exitCode: 3,
        command: `${method} ${command.path}`,
        validations: [],
        error: {
          kind: "transport",
          message:
            error instanceof Error ? error.message : "REST request failed"
        }
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}

function buildUrl(apiBaseUrl: string, path: string): string {
  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`
  return new URL(path, baseUrl).toString()
}

function buildHeaders(
  config: RuntimeConfig,
  body: JsonValue | null
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...config.headers
  }

  if (body !== null) {
    headers["Content-Type"] = "application/json"
  }

  if (config.apiToken !== null) {
    headers.Authorization = `Bearer ${config.apiToken}`
  }

  return headers
}

async function buildEvidence(
  method: string,
  url: string,
  response: Response,
  durationMs: number
): Promise<HttpResponseEvidence> {
  const responseText = await response.text()
  const json = parseJson(responseText)

  return {
    method,
    url,
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    json,
    text: json === null ? responseText || null : null,
    durationMs: Math.round(durationMs)
  }
}

function parseJson(text: string): JsonValue | null {
  if (text === "") {
    return null
  }

  try {
    return JSON.parse(text) as JsonValue
  } catch {
    return null
  }
}

function buildValidations(
  command: RestCommand,
  evidence: HttpResponseEvidence
): readonly ValidationResult[] {
  const validations: ValidationResult[] = []

  if (command.expectedStatus !== null) {
    validations.push(
      validateStatus(evidence.statusCode, command.expectedStatus)
    )
  }

  validations.push(
    ...validateJsonExpectations(evidence.json, command.expectedJson)
  )

  return validations
}
