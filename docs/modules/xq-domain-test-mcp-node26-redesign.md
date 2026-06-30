# xq-domain-test-mcp Node 26 redesign

## Situation

`xq-domain-test-mcp` started as a Python FastMCP module. That implementation
proved the product shape: an agent reads business scenario Markdown and
`xq-config.json`, maps intent to MCP tool calls, and the MCP server executes
guarded REST API testing tools.

The next design direction is to make the module lighter, more polyglot, and
more explicit at its external seams:

- use Node.js 26;
- use TypeScript for module source;
- use Node.js standard library primitives as much as practical;
- use the TypeScript MCP SDK at the MCP protocol seam;
- use Node's built-in test runner;
- make every externally exposed surface contract-backed;
- expose tool schemas through MCP discovery instead of shipping separate JSON
  contract files.

## Node 26 status

As of 2026-06-29, Node.js 26 is a supported `Current` release line. The Node.js
Release Working Group schedule lists:

- initial release: 2026-05-05;
- Active LTS start: 2026-10-28;
- maintenance start: 2027-10-20;
- end-of-life: 2029-04-30.

GitHub Actions can target this line with `actions/setup-node`:

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: 26
```

`actions/setup-node` accepts Semantic Versioning inputs, including major
versions such as `26`, and resolves matching Node distributions.

## Design intent

The module should be deep at the MCP process seam: callers learn a small,
contracted tool interface while implementation details stay local.

External interface:

- CLI executable: `xq-domain-test-mcp`;
- MCP stdio JSON-RPC process behavior;
- MCP tool names, inputs, outputs, and errors;
- `xq-config.json` shape;
- scenario mapping support artifacts;
- npm package metadata and agent skill instructions.

Internal implementation:

- MCP stdio transport;
- MCP protocol dispatch;
- runtime environment state;
- REST request execution;
- contract validation;
- testbed runner;
- release packaging.

## Module layout

```text
modules/xq-domain-test-mcp/
  package.json
  tsconfig.json
  src/
    bin/xq-domain-test-mcp.ts
    mcp/stdio-server.ts
    rest/rest-client.ts
    runtime/runtime-state.ts
    tools/rest-api.ts
    tools/runtime-config.ts
    tools/tool-registry.ts
  test/
    rest-api.test.ts
    runtime-config.test.ts
    testbed-scenario.test.ts
  testbed/
    api-catalog.json
    mappings/
    scenarios/
    xq-config.json
  skills/xq-domain-test-mcp/SKILL.md
```

## Standard library first

Use Node standard library and built-in runtime features unless a dependency
earns its place at a real seam.

The TypeScript MCP SDK is an allowed dependency at the MCP protocol seam. Use
`@modelcontextprotocol/sdk` for MCP server wiring, stdio transport integration,
and protocol compatibility. Keep XQ-specific tool contracts, runtime state,
REST execution, validation, and testbed logic in local modules.

TypeScript is the implementation language. The published runtime still executes
compiled JavaScript on Node.js 26. Use TypeScript for local type safety, module
interfaces, and SDK integration; do not treat TypeScript-only types as the full
external interface.

| Concern | Preferred implementation |
| --- | --- |
| CLI | `package.json` `bin` pointing at compiled JavaScript |
| MCP protocol and stdio transport | `@modelcontextprotocol/sdk` |
| HTTP | global `fetch`, `Request`, `Response`, `AbortSignal.timeout` |
| File IO | `node:fs/promises` |
| URLs | `node:url`, `URL` |
| Tests | `node:test` |
| Assertions | `node:assert/strict` |
| Child process smoke tests | `node:child_process` |
| Type checking and emit | `typescript` |
| Tool input/output schemas | `zod` |

Avoid additional framework dependencies in the first Node version. Add another
dependency only when maintaining the standard-library implementation becomes
more complex than the dependency's interface.

## Contract policy

Every externally exposed surface needs a contract.

Tool contracts are authored in TypeScript with Zod because the TypeScript MCP
SDK expects Zod schemas for tool `inputSchema` and `outputSchema`, and Zod gives
runtime validation plus inferred TypeScript types at the tool handler seam.

Published contract surface:

- tool schemas are exposed through MCP tool discovery;
- runtime validation happens at the MCP tool seam;
- TypeScript input/output types live beside each tool class.

Node-facing convenience:

- TypeScript declaration files may be generated or maintained for Node
  consumers;
- declaration files mirror the Zod/tool contracts.

Contract consistency rule:

Zod schemas, TypeScript input/output types, and MCP-exposed tool schemas must
describe the same external interface. Do not ship separate JSON Schema files
unless a real consumer needs offline schema artifacts outside MCP discovery.

## Tool contract typing approach

Each tool is one class. All tool classes implement the same small interface.
The interface is the local abstraction; the MCP SDK adapter sits outside it.

```text
src/tools/mcp-tool.ts            # shared interface
src/tools/call-rest-api.tool.ts  # one class, one tool
```

Keep the abstraction plain:

```ts
import { z } from "zod/v4";

type ToolCategory = "runtime_config" | "rest_api";

export interface McpTool<Input, Output> {
  readonly name: string;
  category: ToolCategory;
  title: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };

  execute(input: Input): Promise<Output> | Output;
}
```

Input and output types live with the tool:

```ts
export type CallRestApiInput = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  expected_status?: number;
  timeout_seconds?: number;
};

export type CallRestApiOutput = {
  tool: "call_rest_api";
  category: "rest_api";
  method: string;
  url: string;
  statusCode: number;
  json?: unknown;
  assertion?: {
    expected_status: number;
    actual_status: number;
    passed: boolean;
  };
};
```

The tool class provides metadata, schemas, and implementation:

```ts
export class CallRestApiTool implements McpTool<CallRestApiInput, CallRestApiOutput> {
  readonly name = "call_rest_api";
  readonly category = "rest_api";
  readonly title = "Call REST API";
  readonly description = "Call a REST endpoint using the configured runtime environment.";

  readonly inputSchema = z.object({
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: z.string().min(1),
    body: z.unknown().optional(),
    expected_status: z.number().int().min(100).max(599).optional(),
    timeout_seconds: z.number().positive().optional()
  }) satisfies z.ZodType<CallRestApiInput>;

  readonly outputSchema = z.object({
    tool: z.literal("call_rest_api"),
    category: z.literal("rest_api"),
    method: z.string(),
    url: z.string().url(),
    statusCode: z.number().int(),
    json: z.unknown().optional(),
    assertion: z.object({
      expected_status: z.number().int(),
      actual_status: z.number().int(),
      passed: z.boolean()
    }).optional()
  }) satisfies z.ZodType<CallRestApiOutput>;

  constructor(
    private readonly runtime: RuntimeState,
    private readonly restClient: RestClient
  ) {}

  async execute(input: CallRestApiInput): Promise<CallRestApiOutput> {
    const config = this.runtime.requireEnvironment();
    return this.restClient.call(config, input);
  }
}
```

The registry owns MCP SDK adaptation and accepts only `McpTool<unknown, unknown>`
instances:

- register the tool with `tool.inputSchema` and `tool.outputSchema`;
- parse and validate input before calling `tool.execute`;
- validate handler output before returning it;
- convert domain output into MCP `structuredContent`;
- convert known failures into contract-backed MCP error results.

Tool classes should not import MCP SDK types. This keeps the MCP SDK as an
adapter at the protocol seam and keeps tool implementations testable through
their contracts.

```ts
class ToolRegistry {
  constructor(private readonly tools: readonly McpTool<unknown, unknown>[]) {}

  registerAll(server: McpServer): void {
    for (const tool of this.tools) {
      server.registerTool(tool.name, {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        annotations: tool.annotations
      }, async (rawInput) => {
        const input = tool.inputSchema.parse(rawInput);
        const output = await tool.execute(input);
        const structuredContent = tool.outputSchema.parse(output);

        return {
          content: [{ type: "text", text: JSON.stringify(structuredContent) }],
          structuredContent
        };
      });
    }
  }
}
```

New tool rule:

Any new tool must add one class that implements `McpTool<Input, Output>`, export
its input/output types, define Zod schemas for those types, and have registry
coverage. Keep one class equal to one tool.

Tool discovery is generated by the MCP SDK from the tool registry:

```text
src/tools/index.ts            # exports all tool classes
```

This gives three aligned views of the same interface:

- Zod schemas for MCP SDK registration and runtime validation;
- explicit TypeScript input/output types for implementation and Node consumers;
- MCP tool schemas for agents and other MCP clients.

## MCP tool interface

Initial tool surface remains the REST-focused MVP:

- `configure_environment`;
- `get_environment`;
- `clear_environment`;
- `call_rest_api`.

Tool contracts should define:

- name;
- category;
- description;
- input schema;
- output schema;
- error schema;
- redaction rules;
- ordering constraints.

Ordering constraint:

`call_rest_api` requires an environment configured by
`configure_environment`. If missing, it returns a structured contract-backed
error.

Secret handling:

`get_environment` must never return token values. It can return
`has_api_token: true`.

## Testing

The test surface is the module interface:

- validate tool input/output schemas with `node:test`;
- test runtime config through tool handlers;
- test REST calls through a local mock HTTP server built with `node:http`;
- test MCP stdio behavior with child process smoke tests;
- replay `testbed/mappings/*.json` through the public tool registry.

`modules.yaml` should run tests through Node:

```yaml
commands:
  install: yarn install --immutable
  build: yarn build
  test: yarn test
```

The module uses Yarn 4 and keeps its own `yarn.lock`, matching the repo's other
Node modules.

## CI/CD

CI should use Node 26:

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: 26
```

Release output should include:

- `@chauhaidang/xq-harness-domain-test-mcp` published to GitHub Packages;
- executable `xq-domain-test-mcp` CLI;
- `skills/xq-domain-test-mcp/` included in the npm package.

The skill is package data, not a second release artifact. This follows the repo
pattern used by `xq-scripts/scripts/install-skills.js`: npm packages ship skills
under `skills/<skill-name>/`, and consumer projects run the script to copy
installed `node_modules/@chauhaidang/*/skills/` directories into
`.agents/skills/`.

The release should prove:

- `node --test` passes;
- `yarn npm publish` publishes the package to GitHub Packages;
- the CLI starts and responds to an MCP initialization smoke test through the
  TypeScript MCP SDK stdio transport;
- the package includes `skills/xq-domain-test-mcp/SKILL.md`.

## Migration slices

1. Add Node package scaffold and shared tool interface.
2. Implement Zod input/output validation.
3. Wire the TypeScript MCP SDK stdio server and tool registry.
4. Port runtime configuration tools.
5. Port REST API tool using Node `fetch`.
6. Port testbed and scenario mapping replay to `node:test`.
7. Update `modules.yaml`, GitHub Actions, README, and skill instructions.
8. Remove Python package metadata once Node parity is complete.

## Implementation decisions

The first Node implementation uses:

- package metadata published to GitHub Packages with Yarn;
- `yarn install --immutable`, `yarn build`, and `yarn test` in `modules.yaml`;
- compiled tests under `dist-test/`, executed by Node's built-in test runner;
- version `1.0.0`, preserving the current module version while changing the
  runtime implementation;
- removal of the old Python source after Node parity passed locally.

## Deferred

Generated domain API clients remain out of the MVP. Reintroduce domain-level
tools only after the REST primitive workflow has real consumer feedback and a
repeated contract shape.
