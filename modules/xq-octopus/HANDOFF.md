# xq-octopus Handoff

## Situation

`xq-octopus` is planned as a new Node.js/TypeScript CLI module for direct
backend REST API testing. It should be simple and agent-friendly, following
Vibium's codebase shape at a smaller scale: a thin command adapter over a
reusable REST testing core.

The CLI must also satisfy the CLI-as-skill requirement: an agent should be able
to discover what commands exist, understand when to call each command, and parse
the command output without relying on hidden docs or commands outside this
module.

The current source of truth is documentation. If implementation files already
exist locally, reconcile them toward the target Node/TypeScript shape here
rather than preserving the previous Python direction.

## Primary Reference

Read this first:

- [`xq-octopus-dev-guide.md`](xq-octopus-dev-guide.md)

That guide is the implementation brief for a junior developer. It defines the
goal, project setup flow, module skeleton, `xq.json` contract, CLI commands,
validation behavior, tests, and out-of-scope boundaries.

Alternative implementation track:

- [`xq-octopus-dev-guide-go.md`](xq-octopus-dev-guide-go.md)

Use the Go guide if `xq-octopus` should follow Vibium's Cobra-based,
single-binary delivery model instead of the Node/TypeScript package workflow.

## Target Product

Build a CLI named `xq-octopus` that lets an agent or developer run commands
like:

```bash
xq-octopus config --env dev
xq-octopus get /health --env dev --expect-status 200
xq-octopus post /users --env dev --body '{"name":"Ada"}' --expect-status 201
```

The CLI should:

- Load API test configuration from `xq.json`.
- Require `--env`.
- Call REST APIs.
- Validate responses.
- Emit JSON evidence by default.
- Support a small `--pretty` human-readable mode.
- Explain itself through `--help`, per-command help, and `commands --json`.

## Stack Decision

Use the same general stack as the existing Node modules in this harness repo:

- Node.js `>=18`
- pnpm `10`
- TypeScript
- Commander for CLI command routing
- Jest for tests
- ESLint for linting
- Built-in Node `fetch` and `AbortController` for HTTP

Do not implement this module with Python, `uv`, Typer, Rich, pytest, or
basedpyright.

## Non-Goals

Do not add these in v1:

- Scenario Markdown parsing.
- MCP server or MCP tools.
- OpenAPI loading.
- API catalog loading.
- Domain-specific command inference.
- Generated API clients.
- Any implementation inside `xq-domain-test-mcp`.

Scenario interpretation remains agent reasoning work. The CLI is only the tool
surface the agent calls after deciding which REST action is needed.

## Suggested Skills

Use these repo skills in order:

1. `implement` - for building the module from the guide.
2. `tdd` - for writing the config, validation, REST, and CLI tests first.
3. `harness-state` - for recording any requirement, decision, spec, or solution
   that changes the documented plan.

If the implementation starts drifting toward interface shape debates, use
`codebase-design` before changing the public CLI or execution contract.

## Expected Module Shape

The intended module shape has two big main components: `app/` and `test/`.
Inside `app/`, keep the five areas requested by the project owner:
`config`, `cli`, `core`, `model`, and `tools`.

The design should still keep one deep execution module behind thin adapters.
Avoid splitting every operation into tiny pass-through files.

```text
modules/xq-octopus/
  README.md
  package.json
  tsconfig.json
  jest.config.cjs
  xq.json.example
  app/
    config/
      loader.ts            # xq.json loading and validation
    cli/
      main.ts              # Commander command adapter only
      output.ts            # JSON and --pretty rendering
    core/
      engine.ts            # deep interface: execute Command objects
    model/
      config.ts            # RuntimeConfig and redaction helpers
      command.ts           # shared Command contract plus RestCommand
      result.ts            # response, validation, and command result models
    tools/
      factory.ts           # creates and caches command tools
      rest-tool.ts         # REST execution and REST validation workflow
      validation.ts        # reusable status and JSON-pointer checks
      catalog.ts           # CLI-as-skill command catalog data
  test/
    config.test.ts
    engine.test.ts
    tool-factory.test.ts
    rest-tool.test.ts
    catalog.test.ts
    output.test.ts
    validation.test.ts
    cli.test.ts
```

Primary interface:

```ts
const engine = new ExecutionEngine(config, { tools: toolFactory });
const result = await engine.execute(command);
```

`command` must implement the shared `Command` contract, including a required
`execute(context)` method that contains the command's actual run logic.
`RestCommand` is the first concrete command, but future commands must satisfy
the same `Command` interface instead of inventing separate engine entrypoints.

`ExecutionEngine.execute(command)` should prepare shared execution context,
call `command.execute(context)`, and normalize any uncaught errors into a
`CommandResult`.

`ExecutionContext` should expose runtime config and a `ToolFactory`, not raw
HTTP transport. Commands should query the factory for the tool they need:
`RestCommand.execute(context)` asks for `context.tools.rest()` and calls a
method-specific REST operation such as `callGet()`, `callPost()`, `callPut()`,
`callPatch()`, or `callDelete()`. Do not model `RestTool` as a generic
`execute(command, config)` dispatcher.

The CLI, tests, and any future adapter should exercise this interface instead
of reaching through to transport or validation internals.

This module-local handoff does not require commands outside
`modules/xq-octopus`. If repo-level registration is needed later, handle it
from a separate repo-root task.

## Configuration Contract

Default config path: `./xq.json`

Override flag: `--config path/to/xq.json`

Required environment selector: `--env <name>`

Supported config shape:

```json
{
  "environments": {
    "dev": {
      "api_base_url": "https://api.example.test",
      "api_token": null,
      "headers": {
        "X-App": "local"
      }
    }
  }
}
```

Rules:

- `api_base_url` is required.
- `api_token` is optional.
- `headers` is optional.
- Never print token values in output, errors, tests, or logs.

## CLI Contract

Commands:

```bash
xq-octopus --help
xq-octopus commands --json
xq-octopus config --env dev
xq-octopus get /health --env dev --expect-status 200
xq-octopus post /users --env dev --body '{"name":"Ada"}' --expect-status 201
xq-octopus put /users/123 --env dev --body-file payload.json
xq-octopus patch /users/123 --env dev --body '{"active":true}'
xq-octopus delete /users/123 --env dev --expect-status 204
```

Shared flags:

- `--env`
- `--config`
- `--expect-status`
- `--expect-json`
- `--timeout`
- `--pretty`

CLI-as-skill commands:

- `xq-octopus --help` explains the tool purpose, command list, config model,
  output model, and exit codes.
- `xq-octopus <command> --help` explains command intent, required inputs,
  validation flags, examples, output shape, and exit codes.
- `xq-octopus commands --json` emits a stable machine-readable catalog of
  commands, arguments, options, required config, output shape, and examples.

Exit codes:

- `0` request completed and validations passed.
- `1` validation failed.
- `2` config or input error.
- `3` transport error.

## Testing Requirements

Build tests before or alongside implementation:

- Config loading and token redaction.
- Status and JSON-pointer validation.
- REST request construction, headers, body, JSON/text response parsing, timeout,
  and HTTP error evidence.
- `RestTool` exposes method-specific calls: `callGet()`, `callPost()`,
  `callPut()`, `callPatch()`, and `callDelete()`.
- Engine delegates to `Command.execute(context)` and does not call `RestTool`
  directly.
- CLI exit codes and JSON output.
- `--help` includes useful command descriptions.
- `commands --json` returns a stable command catalog.

Use a local in-process HTTP server for tests. Do not require a real backend or
network access.

## Validation Commands

Run these commands while standing inside `modules/xq-octopus`:

```bash
pnpm install
pnpm install --frozen-lockfile
pnpm run build
pnpm test
node dist/cli/main.js --help
```

Use `pnpm install` for first-time setup so the root workspace lockfile can be updated.
After the lockfile exists, use `pnpm install --frozen-lockfile` for normal validation.
The module should keep its package metadata aligned with the root pnpm workspace.

## Current Workspace Notes

- Treat this handoff and `xq-octopus-dev-guide.md` as the source of truth for
  the CLI contract.
- If Python implementation files already exist locally, replace the direction
  with the target Node/TypeScript shape instead of layering around them.
- `docs/modules/SUBAGENT-HANDOFF-TEMPLATE.md` and
  `docs/modules/subagent-handoff.md` are unrelated pre-existing untracked files.
