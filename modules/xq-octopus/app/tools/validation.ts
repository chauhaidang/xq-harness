import type { JsonValue, ValidationResult } from "../model/result.js"

export function validateStatus(
  actualStatus: number,
  expectedStatus: number
): ValidationResult {
  const passed = actualStatus === expectedStatus

  return {
    type: "status",
    expected: expectedStatus,
    passed,
    actual: actualStatus,
    message: passed
      ? `Status matched ${expectedStatus}`
      : `Expected status ${expectedStatus}, received ${actualStatus}`
  }
}

export function validateJsonExpectations(
  responseJson: JsonValue | null,
  expectations: readonly string[]
): readonly ValidationResult[] {
  return expectations.map((expectation) =>
    validateJsonExpectation(responseJson, expectation)
  )
}

export function validateJsonExpectation(
  responseJson: JsonValue | null,
  expectation: string
): ValidationResult {
  const parsed = parseJsonExpectation(expectation)

  if (parsed === null) {
    return {
      type: "jsonPointer",
      path: expectation,
      expected: "",
      passed: false,
      actual: undefined,
      message: `Invalid JSON expectation: ${expectation}`
    }
  }

  const actual = readJsonPointer(responseJson, parsed.path)
  const passed = jsonValuesEqual(actual, parsed.expected)

  return {
    type: "jsonPointer",
    path: parsed.path,
    expected: parsed.expected,
    passed,
    actual,
    message: passed
      ? `JSON pointer ${parsed.path} matched`
      : `Expected ${parsed.path} to equal ${JSON.stringify(parsed.expected)}`
  }
}

export function parseExpectedValue(rawValue: string): JsonValue {
  try {
    return JSON.parse(rawValue) as JsonValue
  } catch {
    return rawValue
  }
}

function parseJsonExpectation(
  expectation: string
): { readonly path: string; readonly expected: JsonValue } | null {
  const separatorIndex = expectation.indexOf("=")

  if (separatorIndex <= 0) {
    return null
  }

  return {
    path: expectation.slice(0, separatorIndex),
    expected: parseExpectedValue(expectation.slice(separatorIndex + 1))
  }
}

function readJsonPointer(
  value: JsonValue | null,
  pointer: string
): JsonValue | undefined {
  if (pointer === "") {
    return value ?? undefined
  }

  if (!pointer.startsWith("/")) {
    return undefined
  }

  let current: JsonValue | undefined = value ?? undefined

  for (const segment of pointer.slice(1).split("/").map(decodePointerSegment)) {
    if (
      current === undefined ||
      current === null ||
      typeof current !== "object"
    ) {
      return undefined
    }

    if (Array.isArray(current)) {
      const index = Number(segment)
      current = Number.isInteger(index) ? current[index] : undefined
      continue
    }

    const objectValue = current as { readonly [key: string]: JsonValue }
    current = objectValue[segment]
  }

  return current
}

function decodePointerSegment(segment: string): string {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~")
}

function jsonValuesEqual(
  left: JsonValue | undefined,
  right: JsonValue
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
