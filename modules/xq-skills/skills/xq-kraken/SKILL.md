---
name: xq-kraken
description: Use the xq-kraken CLI to discover, inspect, invoke, and assert OpenAPI operations through deterministic JSON. Trigger when an agent needs operation-centric REST API testing, kraken.yaml setup, search-describe-invoke workflows, typed operation or response references, OpenAPI request validation, or focused response assertions.
---

# XQ Kraken

Use Kraken as a guarded OpenAPI action loop:

```text
kraken.yaml + OpenAPI -> search -> describe -> invoke -> structured evidence
```

Prefer Kraken when an OpenAPI document is available and the task should use
`operationId` values instead of constructing path-and-verb requests manually.
Kraken owns allowlist enforcement, request and documented-response validation,
compact assertions, and local typed references.

## Locate the CLI

Use the installed command when available:

```bash
command -v kraken
kraken --help
```

Inside the xq-harness repository, run the module-local command when the global
command is unavailable:

```bash
cd modules/xq-kraken
uv run kraken --help
```

Use one form consistently for the rest of the workflow. The examples below use
`kraken`.

## Configure API Definitions

Create `kraken.yaml` in the exact working directory where commands will run:

```yaml
apis:
  widgets:
    spec: ./openapi/widgets.yaml
    base_url: http://127.0.0.1:8080
    allowed_operations:
      - listWidgets
      - getWidget
      - createWidget
```

Rules:

- Use local YAML or JSON OpenAPI documents; remote specification URLs are not
  supported.
- Resolve relative `spec` paths from the `kraken.yaml` directory.
- Omit `allowed_operations` to expose every operation.
- Use an empty allowlist to expose no operations.
- Do not put tokens or secrets in command arguments or commit them in config.
- Use `--config <path>` only when the configuration is not `./kraken.yaml`.

## Run the Operation Workflow

Kraken commands are stateful across CLI processes. Start one execution and one
scenario before discovery:

```bash
kraken execution start
kraken scenario start
```

If more than one scenario is open, pass `--scenario @sN` to every
scenario-bound command. When exactly one scenario is open, omit it.

### 1. Search

Search by intent and parse the canonical JSON result:

```bash
kraken search widget
```

Read candidates from the top-level `results` array:

```json
{
  "ok": true,
  "results": [
    {
      "ref": "@o1",
      "api": "widgets",
      "operation_id": "createWidget",
      "summary": "Create a widget"
    }
  ]
}
```

Each result contains:

- `ref`: non-rebinding operation handle such as `@o1`
- `api`: API definition name
- `operation_id`: OpenAPI `operationId`
- `summary`: short operation description

Use the returned operation reference instead of copying API and operation IDs.
Search across all configured APIs by default or add `--api <name>` to limit it.
Do not guess reference numbers.

### 2. Describe

Inspect only the selected operation's callable contract:

```bash
kraken describe @o1
```

Read required parameters, their OpenAPI locations, and the request-body schema
before constructing input. Keep OpenAPI wire names exactly as described.

### 3. Invoke

Put invocation input in one JSON object:

```json
{
  "parameters": {
    "widgetId": "widget-123"
  },
  "body": {
    "name": "Keyboard",
    "quantity": 2
  }
}
```

Invoke with a file or standard input:

```bash
kraken invoke @o1 --input request.json
kraken invoke @o1 --input - < request.json
```

Kraken validates input against OpenAPI before transport. Do not bypass a
contract violation by falling back to an ad-hoc HTTP client; correct the input
or confirm that the API contract is stale.

An invocation without assertions returns the normalized documented response
and normally allocates an immutable response reference such as `@r1`. Add
`--no-state` when response data must not be retained.

## Chain Response Values

Pass a value from an earlier response with an explicit reference expression:

```json
{
  "parameters": {
    "widgetId": {
      "$kraken_ref": "@r1",
      "pointer": "/id"
    }
  }
}
```

Kraken resolves RFC 6901 JSON Pointers recursively and preserves the stored JSON
type. Pointers address normalized response body data; response headers are not
retained in response references. Ordinary strings beginning with `@o` or `@r`
are never substituted.

Inspect a stored value directly when needed:

```bash
kraken resolve @r1 --pointer /id
kraken refs status
kraken refs list
```

## Assert Focused Outcomes

Add assertions to invocation input when the task has explicit expectations:

```json
{
  "parameters": {
    "widgetId": "missing"
  },
  "assertions": {
    "status": 404,
    "body": {
      "/message": "Widget not found"
    }
  }
}
```

Body assertion keys are RFC 6901 JSON Pointers. Expected objects and arrays use
partial semantic matching; unrelated response fields do not cause failure.
Documented non-2xx responses can pass when the supplied status assertion
matches.

When assertions are present, report the compact assertion summary and unmatched
fields. Do not expect the full response body in assertion output.

## Interpret Results

Treat default JSON as the automation contract. Add `--pretty` only for human
inspection; do not scrape pretty output.

Exit categories:

- `0`: command and supplied assertions passed
- `2`: CLI input or configuration invalid
- `3`: operation unknown or unavailable under the allowlist
- `4`: invocation input violates OpenAPI
- `5`: request transport failed
- `6`: response undocumented or violates OpenAPI
- `7`: assertions failed, or a non-2xx response had no status assertion
- `8`: execution, scenario, reference, or fingerprint state failure
- `70`: unexpected internal failure

Assertion failures are structured results on standard output. Configuration,
operation, validation, transport, contract, state, and internal errors are
structured JSON on standard error.

## Finish and Report

Close the scenario when managing several scenarios, then finish the execution:

```bash
kraken scenario close @s1
kraken execution finish
```

`execution finish` removes `./.kraken/execution.sqlite` and closes remaining
scenarios. If a crashed run leaves stale state, inspect it before using the
explicit cleanup command.

Report:

- API definition and operation ID
- operation and response references used
- HTTP status and assertion counts
- unmatched assertions or structured error kind
- whether response persistence was disabled

Never report secrets, complete sensitive response snapshots, or hidden matched
fields that Kraken intentionally omitted.

## Guardrails

- Confirm the target before invoking production or destructive operations.
- Apply the same configured allowlist to discovery, description, and invocation.
- Never reinterpret an unresolved reference as an operation ID or ordinary data.
- Do not reuse references across scenarios or executions.
- Stop if `kraken.yaml` or an OpenAPI document changes during an active
  execution; finish or clean up explicitly, review the change, and start again.
- Prefer `--no-state` for sensitive responses.
