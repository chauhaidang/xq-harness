import assert from "node:assert/strict"
import test from "node:test"

import {
  parseExpectedValue,
  validateJsonExpectation,
  validateJsonExpectations,
  validateStatus
} from "../app/tools/validation.ts"

test("status validation passes", () => {
  const result = validateStatus(200, 200)

  assert.equal(result.passed, true)
  assert.equal(result.actual, 200)
})

test("status validation fails", () => {
  const result = validateStatus(500, 200)

  assert.equal(result.passed, false)
  assert.equal(result.actual, 500)
})

test("JSON pointer validation passes", () => {
  const result = validateJsonExpectation(
    {
      data: {
        id: 123
      }
    },
    "/data/id=123"
  )

  assert.equal(result.passed, true)
  assert.equal(result.actual, 123)
})

test("missing JSON pointer fails cleanly", () => {
  const result = validateJsonExpectation({ data: {} }, "/data/id=123")

  assert.equal(result.passed, false)
  assert.equal(result.actual, undefined)
})

test("JSON-looking expected values are parsed", () => {
  assert.equal(parseExpectedValue("123"), 123)
  assert.equal(parseExpectedValue("true"), true)
  assert.equal(parseExpectedValue('"abc"'), "abc")
  assert.equal(parseExpectedValue("abc"), "abc")
})

test("validates multiple JSON expectations", () => {
  const results = validateJsonExpectations(
    {
      ok: true,
      tags: ["one"]
    },
    ["/ok=true", "/tags/0=one"]
  )

  assert.deepEqual(
    results.map((result) => result.passed),
    [true, true]
  )
})

test("supports escaped JSON pointer segments", () => {
  const result = validateJsonExpectation(
    {
      "a/b": {
        "~key": "value"
      }
    },
    "/a~1b/~0key=value"
  )

  assert.equal(result.passed, true)
})
