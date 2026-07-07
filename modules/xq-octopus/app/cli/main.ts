#!/usr/bin/env node

import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { Command, InvalidArgumentError } from "commander"

import { loadRuntimeConfig, ConfigError } from "../config/loader.js"
import { ExecutionEngine } from "../core/engine.js"
import { redactRuntimeConfig } from "../model/config.js"
import { RestCommand, type RestMethod } from "../model/command.js"
import type { CommandResult, JsonValue } from "../model/result.js"
import { renderJson, renderPrettyConfig, renderPrettyResult } from "./output.js"
import { commandCatalog } from "../tools/catalog.js"

export interface CliRuntime {
  readonly writeOut: (message: string) => void
  readonly writeErr: (message: string) => void
  readonly setExitCode: (code: number) => void
}

interface SharedOptions {
  readonly env: string
  readonly config: string
  readonly pretty?: boolean
}

interface RestOptions extends SharedOptions {
  readonly expectStatus?: number
  readonly expectJson: readonly string[]
  readonly timeout: number
  readonly body?: string
  readonly bodyFile?: string
}

const defaultRuntime: CliRuntime = {
  writeOut(message) {
    console.log(message)
  },
  writeErr(message) {
    console.error(message)
  },
  setExitCode(code) {
    process.exitCode = code
  }
}

export function buildCli(runtime: CliRuntime = defaultRuntime): Command {
  const program = new Command()

  program
    .name("xq-octopus")
    .description("Agent-friendly REST API testing CLI")
    .version("0.1.0")
    .showHelpAfterError()

  program
    .command("commands")
    .description("Print the machine-readable command catalog")
    .option("--json", "print JSON output")
    .action(() => {
      runtime.writeOut(renderJson(commandCatalog))
    })

  program
    .command("config")
    .description("Load and print redacted runtime config")
    .requiredOption("--env <name>", "environment name")
    .option("--config <path>", "config file path", "xq.json")
    .option("--pretty", "print human-readable output")
    .action(async (options: SharedOptions) => {
      try {
        const config = await loadRuntimeConfig(options.config, options.env)
        const redacted = redactRuntimeConfig(config)
        runtime.writeOut(
          options.pretty ? renderPrettyConfig(redacted) : renderJson(redacted)
        )
      } catch (error) {
        writeError(runtime, configOrUnexpectedError(error))
      }
    })

  addRestCommand(program, runtime, "get", "GET")
  addRestCommand(program, runtime, "post", "POST", true)
  addRestCommand(program, runtime, "put", "PUT", true)
  addRestCommand(program, runtime, "patch", "PATCH", true)
  addRestCommand(program, runtime, "delete", "DELETE")

  return program
}

export async function main(argv: string[] = process.argv): Promise<void> {
  await buildCli().parseAsync(argv)
}

function addRestCommand(
  program: Command,
  runtime: CliRuntime,
  name: string,
  method: RestMethod,
  acceptsBody = false
): void {
  const command = program
    .command(`${name} <path>`)
    .description(`Send a ${method} request and validate the response`)
    .requiredOption("--env <name>", "environment name")
    .option("--config <path>", "config file path", "xq.json")
    .option("--expect-status <code>", "expected HTTP status", parseInteger)
    .option(
      "--expect-json <pointer=value>",
      "expected JSON pointer value",
      collect,
      []
    )
    .option(
      "--timeout <ms>",
      "request timeout in milliseconds",
      parseInteger,
      30000
    )
    .option("--pretty", "print human-readable output")

  if (acceptsBody) {
    command
      .option("--body <json>", "JSON request body")
      .option("--body-file <path>", "path to JSON request body file")
  }

  command.action(async (path: string, options: RestOptions) => {
    try {
      const config = await loadRuntimeConfig(options.config, options.env)
      const body = await parseBody(options)
      const restCommand = new RestCommand(
        method,
        path,
        body,
        options.expectStatus ?? null,
        options.expectJson,
        options.timeout
      )
      const result = await new ExecutionEngine(config).execute(restCommand)
      writeResult(runtime, result, options.pretty === true)
    } catch (error) {
      writeError(runtime, configOrInputError(error))
    }
  })
}

function collect(
  value: string,
  previous: readonly string[]
): readonly string[] {
  return [...previous, value]
}

function parseInteger(value: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw new InvalidArgumentError("must be an integer")
  }

  return parsed
}

async function parseBody(options: RestOptions): Promise<JsonValue | null> {
  if (options.body !== undefined && options.bodyFile !== undefined) {
    throw new InputError("Use either --body or --body-file, not both")
  }

  if (options.body !== undefined) {
    return parseJsonBody(options.body)
  }

  if (options.bodyFile !== undefined) {
    return parseJsonBody(await readFile(options.bodyFile, "utf8"))
  }

  return null
}

function parseJsonBody(body: string): JsonValue {
  try {
    return JSON.parse(body) as JsonValue
  } catch {
    throw new InputError("Request body must be valid JSON")
  }
}

class InputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InputError"
  }
}

function writeResult(
  runtime: CliRuntime,
  result: CommandResult,
  pretty: boolean
): void {
  runtime.writeOut(pretty ? renderPrettyResult(result) : renderJson(result))
  runtime.setExitCode(result.exitCode)
}

function writeError(runtime: CliRuntime, result: CommandResult): void {
  runtime.writeErr(renderJson(result))
  runtime.setExitCode(result.exitCode)
}

function configOrInputError(error: unknown): CommandResult {
  if (error instanceof InputError) {
    return errorResult("input", error.message)
  }

  return configOrUnexpectedError(error)
}

function configOrUnexpectedError(error: unknown): CommandResult {
  if (error instanceof ConfigError) {
    return errorResult("config", error.message)
  }

  return errorResult(
    "unexpected",
    error instanceof Error ? error.message : "Unexpected command failure"
  )
}

function errorResult(
  kind: "config" | "input" | "unexpected",
  message: string
): CommandResult {
  return {
    ok: false,
    exitCode: kind === "unexpected" ? 3 : 2,
    command: kind,
    validations: [],
    error: {
      kind,
      message
    }
  }
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1]
) {
  void main()
}
