export interface CommandCatalogEntry {
  readonly name: string
  readonly summary: string
  readonly whenToUse: string
  readonly arguments: readonly string[]
  readonly options: readonly string[]
  readonly requiredConfig: readonly string[]
  readonly outputShape: string
  readonly exitCodes: Readonly<Record<string, string>>
  readonly examples: readonly string[]
}

export const commandCatalog: readonly CommandCatalogEntry[] = [
  {
    name: "commands",
    summary: "Print the machine-readable command catalog.",
    whenToUse: "Use when an agent needs to discover xq-octopus capabilities.",
    arguments: [],
    options: ["--json"],
    requiredConfig: [],
    outputShape: "JSON array of command catalog entries.",
    exitCodes: {
      "0": "Catalog printed."
    },
    examples: ["xq-octopus commands --json"]
  },
  {
    name: "config",
    summary: "Load and print redacted runtime config.",
    whenToUse:
      "Use before REST calls to verify the selected environment is configured.",
    arguments: [],
    options: ["--env <name>", "--config <path>", "--pretty"],
    requiredConfig: ["environments[env].apiBaseUrl"],
    outputShape:
      "Redacted config JSON with hasApiToken instead of token value.",
    exitCodes: {
      "0": "Config loaded.",
      "2": "Config or input error."
    },
    examples: ["xq-octopus config --env dev"]
  },
  {
    name: "get",
    summary: "Send a GET request and validate the response.",
    whenToUse: "Use for read-only REST API checks such as health endpoints.",
    arguments: ["path"],
    options: [
      "--env <name>",
      "--config <path>",
      "--expect-status <code>",
      "--expect-json <ptr=value>",
      "--timeout <ms>",
      "--pretty"
    ],
    requiredConfig: ["environments[env].apiBaseUrl"],
    outputShape: "CommandResult JSON with response evidence and validations.",
    exitCodes: restExitCodes(),
    examples: ["xq-octopus get /health --env dev --expect-status 200"]
  },
  {
    name: "post",
    summary: "Send a POST request with an optional JSON body.",
    whenToUse: "Use for REST API create actions.",
    arguments: ["path"],
    options: [
      "--env <name>",
      "--config <path>",
      "--body <json>",
      "--body-file <path>",
      "--expect-status <code>",
      "--expect-json <ptr=value>",
      "--timeout <ms>",
      "--pretty"
    ],
    requiredConfig: ["environments[env].apiBaseUrl"],
    outputShape: "CommandResult JSON with response evidence and validations.",
    exitCodes: restExitCodes(),
    examples: [
      `xq-octopus post /users --env dev --body '{"name":"Ada"}' --expect-status 201`
    ]
  },
  {
    name: "put",
    summary: "Send a PUT request with an optional JSON body.",
    whenToUse: "Use for REST API replace actions.",
    arguments: ["path"],
    options: [
      "--env <name>",
      "--config <path>",
      "--body <json>",
      "--body-file <path>",
      "--expect-status <code>",
      "--expect-json <ptr=value>",
      "--timeout <ms>",
      "--pretty"
    ],
    requiredConfig: ["environments[env].apiBaseUrl"],
    outputShape: "CommandResult JSON with response evidence and validations.",
    exitCodes: restExitCodes(),
    examples: ["xq-octopus put /users/123 --env dev --body-file payload.json"]
  },
  {
    name: "patch",
    summary: "Send a PATCH request with an optional JSON body.",
    whenToUse: "Use for REST API partial update actions.",
    arguments: ["path"],
    options: [
      "--env <name>",
      "--config <path>",
      "--body <json>",
      "--body-file <path>",
      "--expect-status <code>",
      "--expect-json <ptr=value>",
      "--timeout <ms>",
      "--pretty"
    ],
    requiredConfig: ["environments[env].apiBaseUrl"],
    outputShape: "CommandResult JSON with response evidence and validations.",
    exitCodes: restExitCodes(),
    examples: [`xq-octopus patch /users/123 --env dev --body '{"active":true}'`]
  },
  {
    name: "delete",
    summary: "Send a DELETE request.",
    whenToUse: "Use for REST API delete actions.",
    arguments: ["path"],
    options: [
      "--env <name>",
      "--config <path>",
      "--expect-status <code>",
      "--expect-json <ptr=value>",
      "--timeout <ms>",
      "--pretty"
    ],
    requiredConfig: ["environments[env].apiBaseUrl"],
    outputShape: "CommandResult JSON with response evidence and validations.",
    exitCodes: restExitCodes(),
    examples: ["xq-octopus delete /users/123 --env dev --expect-status 204"]
  }
]

function restExitCodes(): Readonly<Record<string, string>> {
  return {
    "0": "Request completed and validations passed.",
    "1": "Request completed but validation failed.",
    "2": "Config or input error.",
    "3": "Transport or unexpected error."
  }
}
