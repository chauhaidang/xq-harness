import type { RedactedRuntimeConfig } from "../model/config.js"
import type { CommandResult } from "../model/result.js"

export type OutputValue =
  | CommandResult
  | RedactedRuntimeConfig
  | readonly unknown[]
  | Record<string, unknown>

export function renderJson(value: OutputValue): string {
  return JSON.stringify(value, null, 2)
}

export function renderPrettyResult(result: CommandResult): string {
  if (result.error !== undefined) {
    return `Error (${result.error.kind}): ${result.error.message}`
  }

  const status = result.ok ? "OK" : "FAILED"
  const statusCode = result.evidence?.statusCode ?? "n/a"
  const validationSummary =
    result.validations.length === 0
      ? "no validations"
      : `${result.validations.filter((validation) => validation.passed).length}/${result.validations.length} validations passed`

  return `${status} ${result.command} status=${statusCode} ${validationSummary}`
}

export function renderPrettyConfig(config: RedactedRuntimeConfig): string {
  return [
    `Environment: ${config.environment}`,
    `API base URL: ${config.apiBaseUrl}`,
    `API token configured: ${config.hasApiToken ? "yes" : "no"}`,
    `Headers: ${Object.keys(config.headers).length}`
  ].join("\n")
}
