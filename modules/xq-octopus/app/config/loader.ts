import { readFile } from "node:fs/promises"

import type { RuntimeConfig } from "../model/config.js"

export type ConfigErrorCode =
  | "missing_config"
  | "invalid_json"
  | "missing_environments"
  | "unknown_environment"
  | "invalidApiBaseUrl"
  | "invalidApiToken"
  | "invalid_headers"

export class ConfigError extends Error {
  readonly code: ConfigErrorCode

  constructor(code: ConfigErrorCode, message: string) {
    super(message)
    this.name = "ConfigError"
    this.code = code
  }
}

interface RawConfigFile {
  readonly environments?: unknown
}

interface RawEnvironmentConfig {
  readonly apiBaseUrl?: unknown
  readonly apiToken?: unknown
  readonly headers?: unknown
}

export async function loadRuntimeConfig(
  configPath: string,
  env: string
): Promise<RuntimeConfig> {
  let rawText: string

  try {
    rawText = await readFile(configPath, "utf8")
  } catch {
    throw new ConfigError(
      "missing_config",
      `Config file not found: ${configPath}`
    )
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new ConfigError(
      "invalid_json",
      `Config file is not valid JSON: ${configPath}`
    )
  }

  if (!isObject(parsed)) {
    throw new ConfigError(
      "missing_environments",
      "Config must be a JSON object"
    )
  }

  const config = parsed as RawConfigFile

  if (!isObject(config.environments)) {
    throw new ConfigError(
      "missing_environments",
      "Config must contain environments"
    )
  }

  const rawEnvironment = config.environments[env]

  if (!isObject(rawEnvironment)) {
    throw new ConfigError("unknown_environment", `Unknown environment: ${env}`)
  }

  return parseEnvironmentConfig(env, rawEnvironment)
}

function parseEnvironmentConfig(
  env: string,
  raw: RawEnvironmentConfig
): RuntimeConfig {
  if (typeof raw.apiBaseUrl !== "string" || raw.apiBaseUrl.trim() === "") {
    throw new ConfigError("invalidApiBaseUrl", "apiBaseUrl is required")
  }

  if (
    raw.apiToken !== undefined &&
    raw.apiToken !== null &&
    typeof raw.apiToken !== "string"
  ) {
    throw new ConfigError(
      "invalidApiToken",
      "apiToken must be a string or null"
    )
  }

  return {
    environment: env,
    apiBaseUrl: raw.apiBaseUrl,
    apiToken: raw.apiToken ?? null,
    headers: parseHeaders(raw.headers)
  }
}

function parseHeaders(rawHeaders: unknown): Readonly<Record<string, string>> {
  if (rawHeaders === undefined || rawHeaders === null) {
    return {}
  }

  if (!isObject(rawHeaders)) {
    throw new ConfigError("invalid_headers", "headers must be an object")
  }

  const headers: Record<string, string> = {}

  for (const [key, value] of Object.entries(rawHeaders)) {
    if (typeof value !== "string") {
      throw new ConfigError("invalid_headers", "header values must be strings")
    }

    headers[key] = value
  }

  return headers
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
