export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export interface HttpResponseEvidence {
  readonly url: string
  readonly method: string
  readonly statusCode: number
  readonly headers: Readonly<Record<string, string>>
  readonly json: JsonValue | null
  readonly text: string | null
  readonly durationMs: number
}

export interface ValidationResult {
  readonly type: "status" | "jsonPointer"
  readonly expected: JsonValue
  readonly path?: string
  readonly passed: boolean
  readonly actual: JsonValue | undefined
  readonly message: string
}

export interface CommandError {
  readonly kind: "config" | "input" | "transport" | "unexpected"
  readonly message: string
  readonly details?: JsonValue
}

export type CommandExitCode = 0 | 1 | 2 | 3

export interface CommandResult {
  readonly ok: boolean
  readonly exitCode: CommandExitCode
  readonly command: string
  readonly evidence?: HttpResponseEvidence
  readonly validations: readonly ValidationResult[]
  readonly error?: CommandError
}

export interface InputErrorResult extends CommandResult {
  readonly ok: false
  readonly exitCode: 2
  readonly error: CommandError & { readonly kind: "input" }
}

export interface TransportErrorResult extends CommandResult {
  readonly ok: false
  readonly exitCode: 3
  readonly error: CommandError & { readonly kind: "transport" }
}

export interface UnexpectedErrorResult extends CommandResult {
  readonly ok: false
  readonly exitCode: 3
  readonly error: CommandError & { readonly kind: "unexpected" }
}
