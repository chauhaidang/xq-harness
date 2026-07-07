export interface RuntimeConfig {
  readonly environment: string
  readonly apiBaseUrl: string
  readonly apiToken: string | null
  readonly headers: Readonly<Record<string, string>>
}

export interface RedactedRuntimeConfig {
  readonly environment: string
  readonly apiBaseUrl: string
  readonly hasApiToken: boolean
  readonly headers: Readonly<Record<string, string>>
}

export function redactRuntimeConfig(
  config: RuntimeConfig
): RedactedRuntimeConfig {
  return {
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl,
    hasApiToken: config.apiToken !== null,
    headers: config.headers
  }
}
