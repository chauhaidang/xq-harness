---
name: xq-octopus
description: Use when an agent needs to run direct REST API checks with the xq-octopus CLI, inspect an API with simple HTTP calls, validate status or JSON responses, or smoke-test an OpenAPI-backed service without using the MCP server.
---

# xq-octopus

Use this skill for the `xq-octopus` CLI:

```bash
xq-octopus
```

Inside this monorepo, run it from the module with:

```bash
cd modules/xq-octopus
node dist/cli/main.js --help
```

Prefer `xq-octopus` when the task is a direct REST API check: load a runtime
config, call one or more endpoints, validate status codes, validate JSON fields,
and return structured evidence. Use `xq-domain-test-mcp` instead when the user
needs MCP tool calls or scenario-driven automation through an MCP server.

## Mental Model

The agent owns the test intent and maps it to explicit CLI calls:

```text
xq.json + API knowledge -> xq-octopus command -> structured JSON result
```

`xq-octopus` does not parse business scenario Markdown and does not infer API
operations from OpenAPI yet. If the project has OpenAPI, read or search the spec
yourself, then call the matching endpoint with `get`, `post`, `put`, `patch`, or
`delete`.

## Setup

Build before running subprocess or dist-backed tests:

```bash
./scripts/module build xq-octopus
```

For local CLI use inside `modules/xq-octopus`:

```bash
npm install
npm run build
node dist/cli/main.js commands --json
```

If module install or build fails in a sandboxed environment because dependencies
cannot be fetched, rerun the module command with the normal approval path rather
than changing package-manager settings.

## xq.json

Runtime connection details live in `xq.json`. Keep environment-specific URLs,
tokens, and headers out of command lines when possible.

Recommended shape:

```json
{
  "environments": {
    "testbed": {
      "apiBaseUrl": "http://127.0.0.1:18765",
      "apiToken": "testbed-token",
      "headers": {
        "X-App": "local"
      }
    },
    "dev": {
      "apiBaseUrl": "https://api.example.test",
      "apiToken": null
    }
  }
}
```

Rules:

- `apiBaseUrl` is required and cannot be blank.
- `apiToken` is optional; when present it is sent as `Authorization: Bearer ...`.
- `headers` is optional; keys and values must be strings.
- Never print or paste real token values in reports or logs.
- Use `--config path/to/xq.json` when the config is not in the current working
  directory.

Before running API calls, verify config loading and redaction:

```bash
node dist/cli/main.js config --env testbed --config xq.json
```

Expected output is JSON with `apiBaseUrl` and `hasApiToken`, never `apiToken`.

## Command Discovery

Start with the command catalog instead of guessing flags:

```bash
node dist/cli/main.js commands --json
node dist/cli/main.js get --help
node dist/cli/main.js post --help
```

Use the catalog as the stable machine-readable interface for agents. Use
`--help` for human-readable command details.

## REST Calls

Read-only smoke check:

```bash
node dist/cli/main.js get /health \
  --env testbed \
  --config xq.json \
  --expect-status 200 \
  --expect-json /ok=true
```

POST with inline JSON:

```bash
node dist/cli/main.js post /users \
  --env testbed \
  --config xq.json \
  --body '{"name":"Ada"}' \
  --expect-status 201 \
  --expect-json /name=Ada
```

PUT or PATCH with a body file:

```bash
node dist/cli/main.js patch /users/123 \
  --env testbed \
  --config xq.json \
  --body-file payload.json \
  --expect-status 200
```

DELETE:

```bash
node dist/cli/main.js delete /users/123 \
  --env testbed \
  --config xq.json \
  --expect-status 204
```

## Validation

Use `--expect-status` for HTTP status checks.

Use `--expect-json <json-pointer=value>` for response JSON checks:

```bash
--expect-json /data/id=123
--expect-json /ok=true
--expect-json /items/0/name=Ada
```

The expected value parser understands JSON-looking scalars and objects:

```bash
--expect-json /count=3
--expect-json /enabled=true
--expect-json /meta/nullValue=null
```

For JSON Pointer paths:

- `/a/b/0` reads `response.a.b[0]`.
- Use `~1` for literal `/` in a key.
- Use `~0` for literal `~` in a key.

## Output And Exit Codes

Default output is structured JSON. Parse it rather than scraping text.

Successful validation returns:

- `ok: true`
- `exitCode: 0`
- `evidence` with URL, method, status, headers, response JSON/text, duration
- `validations` with status and JSON-pointer results

Exit codes:

- `0` means command succeeded and validations passed.
- `1` means the HTTP call completed but validations failed.
- `2` means config or input was invalid.
- `3` means transport or unexpected failure.

When reporting results to a user, summarize:

- command run
- environment name, not secret values
- status code
- failed validation messages, if any
- whether `exitCode` was `0`, `1`, `2`, or `3`

## OpenAPI Workflow

`xq-octopus` can fetch an OpenAPI document like any other endpoint:

```bash
node dist/cli/main.js get /openapi.json \
  --env testbed \
  --config xq.json \
  --expect-status 200 \
  --expect-json /openapi=3.1.0
```

It does not yet generate CLI calls from OpenAPI. For now:

1. Locate the OpenAPI document or endpoint.
2. Identify the operation, path, required headers, body, and expected response.
3. Put environment wiring in `xq.json`.
4. Run the matching `get`, `post`, `put`, `patch`, or `delete` command.
5. Add status and JSON-pointer expectations for the behavior that matters.

## Guardrails

- Do not use live production APIs unless the user explicitly asks and confirms
  the target environment.
- Do not commit real `xq.json` files containing secrets.
- Prefer local testbeds, dev, or staging environments for exploratory calls.
- Do not hide validation failures; exit code `1` is useful evidence.
- Do not add Jest, curl wrappers, or ad-hoc HTTP scripts when `xq-octopus`
  already covers the needed REST check.
