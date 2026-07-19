# ADR 0001: Provide an operation-centric Kraken CLI

- Status: Accepted
- Date: 2026-07-19

## Context

Kraken exposes a transport-independent `KrakenClient` with `search`,
`describe`, and `invoke` operations. Humans and LLM agents need a command-line
layer for discovering and testing REST APIs without depending directly on the
OpenAPI transport library.

The repository already contains generic HTTP testing surfaces. Kraken's useful
distinction is its OpenAPI operation model, request validation, response
validation, and operation visibility policy. A path-and-verb CLI would obscure
that distinction and duplicate existing tooling.

The CLI also needs deterministic automation behavior. Human-readable output is
useful, but it cannot be the canonical interface because agents need stable
data shapes, failure categories, and exit codes.

## Decision

### Command model

Publish one executable named `kraken` with three operation-centric commands:

```text
kraken search <query>
kraken describe <operation-id>
kraken invoke <operation-id> --input <path-or-dash>
```

`--input -` reads the invocation input from standard input. The CLI will not
provide generic commands such as `get`, `post`, or `delete` in v1.

Every command emits JSON by default. `--pretty` selects a human-readable view.

### Configuration and API selection

The CLI automatically looks for `kraken.yaml` in the current directory and
also accepts an explicit `--config` path. Configuration supports multiple named
API definitions:

```yaml
apis:
  widgets:
    spec: ./openapi/widgets.yaml
    base_url: http://localhost:8080

  payments:
    spec: ./openapi/payments.json
    base_url: http://localhost:8090
    allowed_operations:
      - listPayments
      - createPayment
```

Each API definition has:

- a required local YAML or JSON OpenAPI `spec`
- a required `base_url`
- an optional `allowed_operations` list

Relative specification paths resolve from the configuration file's directory,
not from the process working directory. Remote specification URLs are not
supported in v1.

Omitting `allowed_operations` exposes every operation. Providing an empty list
exposes none. Search, description, and invocation enforce the same policy.

`--api <name>` selects an API definition. Search may omit it and search every
configured API, returning an operation reference that binds each result to its
API definition. Search applies each definition's allowlist before returning
results.

Describe and invoke may omit `--api` when configuration contains exactly one
definition or when their operation argument is an operation reference. An
explicit operation ID with multiple definitions still requires `--api`. This
prevents collisions when different specifications reuse an operation ID.

The reference contract is defined by
[ADR 0002](0002-stateful-cli-references.md).

Global `--spec` and `--base-url` options may override those values on the
selected API definition for one command. They do not modify the configuration
file.

### Invocation input

Invocation input is one JSON object read from a file or standard input:

```json
{
  "parameters": {
    "widgetId": "123",
    "limit": 10
  },
  "body": {
    "name": "Keyboard"
  },
  "assertions": {
    "status": 200,
    "body": {
      "/id": "123",
      "/status": "active",
      "/owner": {
        "name": "Ada"
      }
    }
  }
}
```

`parameters`, `body`, and `assertions` are optional. V1 will not add
`--param` or inline `--body` convenience flags.

Authentication, custom runtime headers, and secret handling are out of scope
for v1.

### Assertion semantics

`assertions.status` compares the expected and actual HTTP status.

Each key in `assertions.body` is an RFC 6901 JSON Pointer resolved against the
normalized response data. Its value is an expected JSON fragment. A missing
pointer is an unmatched field.

Expected fragments use partial semantic matching:

- object property order is ignored
- properties omitted from an expected object are ignored
- expected objects are matched recursively as subsets
- JSON serialization whitespace and formatting are irrelevant
- scalar JSON types and values must match, with numerically equivalent JSON
  numbers treated as equal and booleans kept distinct from numbers
- an expected array is an order-independent subset of the actual array;
  additional actual elements are ignored
- each expected array element must match a distinct actual element
- a pointer containing an explicit array index, such as `/items/0/id`, remains
  index- and therefore order-sensitive

These rules intentionally do not provide general JSONPath expressions,
predicates, string coercion, regular expressions, or numeric comparison
operators in v1.

### Documented non-2xx responses

The domain client returns every response documented by the selected OpenAPI
operation as an `InvocationResult`, including documented 4xx and 5xx responses.
The CLI then evaluates assertions.

Transport failures remain invocation failures. An undocumented response or a
response that violates its documented OpenAPI schema remains a response
contract failure.

If a status assertion is present, it determines whether the response status
passes. If no status assertion is present, only a 2xx status counts as command
success.

### Output and streams

Canonical output is JSON.

When no assertions are supplied, a successful invocation returns the complete
normalized invocation result, including status, headers, and data, so the
caller can inspect the API.

When assertions are supplied:

- a passing result contains the API name, operation ID, status, and assertion
  counts, but omits the full response body
- a failing result contains only failed status/body assertions with their
  expected and actual values; it omits matched fields and the full response
  body
- a missing body pointer is represented explicitly as missing rather than by
  inventing a JSON `null` actual value

An assertion failure is an evaluated command result and is written to standard
output even though it has a nonzero exit code. CLI/configuration, operation,
validation, transport, contract, and internal errors are structured JSON on
standard error. Successful results are written to standard output.

### Exit codes

The CLI uses stable exit categories:

| Code | Meaning |
| ---: | --- |
| `0` | Command succeeded and all supplied assertions passed |
| `2` | CLI input or configuration is invalid |
| `3` | Operation is unknown or unavailable under the allowlist |
| `4` | Invocation input violates the OpenAPI contract |
| `5` | Request transport failed |
| `6` | Response is undocumented or violates the OpenAPI contract |
| `7` | One or more explicit assertions failed, or a response without a status assertion is non-2xx |
| `70` | Unexpected internal failure |

## Consequences

- Humans and agents share one deterministic interface.
- Operation IDs, rather than paths, remain Kraken's stable public vocabulary.
- Multiple OpenAPI specifications can coexist without operation-ID ambiguity.
- Assertions can verify user-required response fragments without depending on
  field order, array order, or unrelated response data.
- Failed assertion output stays compact, but callers must invoke without
  assertions when they need the complete response for inspection.
- Supporting negative tests requires changing the current dynamic adapter,
  which currently raises `InvocationHttpError` for every non-2xx response.
- Authentication and remote OpenAPI sources require later decisions.

## Rejected alternatives

### Generic HTTP verb commands

Rejected because they duplicate other repository tooling and bypass Kraken's
operation-centric OpenAPI boundary.

### Dot-path assertions

Rejected because dot notation has no single standard and is ambiguous for
property names containing dots or brackets. JSON Pointer provides deterministic
object and array addressing.

### Whole-payload equality

Rejected because response property order, array order, and unrelated fields
should not make focused user assertions fail.

### Always returning the complete failed response

Rejected to keep agent output focused. Assertion results include only unmatched
fields and their expected and actual values.
