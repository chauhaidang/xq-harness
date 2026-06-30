# xq-domain-test-mcp

Node 26 TypeScript MCP server for REST API test automation tools.

The agent reads scenario Markdown, maps each scenario to MCP tool calls, and
calls this server. The server does not parse scenario Markdown in the MVP.

## Module Shape

- Project and MCP server name: `xq-domain-test-mcp`
- Runtime: Node.js 26
- Source: TypeScript
- MCP protocol seam: `@modelcontextprotocol/sdk`
- Tool input/output schemas: Zod
- CLI entry point: `xq-domain-test-mcp`

Each tool is one class implementing the shared `McpTool<Input, Output>`
interface. Tool classes own their explicit TypeScript input/output types and
Zod schemas. The registry adapts those classes to the MCP SDK.

## Runtime Config Flow

1. Agent reads **`xq-config.json`** and resolves the scenario's `environment` key.
2. Agent passes `environment`, `api_base_url`, and `api_token` to
   `configure_environment`.
3. Agent maps scenario Markdown to action tools such as `call_rest_api`.
4. Agent may call `clear_environment` between sessions or when switching
   environments.

Connection details belong in **`xq-config.json`**, not in scenario Markdown.
Secret values are never returned from status tools; responses expose only
booleans such as `has_api_token`.

## Tools

Initial REST-focused tools:

- `configure_environment`
- `get_environment`
- `clear_environment`
- `call_rest_api`

Tool schemas are exposed through MCP.

## Development

Use the module runner from the repo root:

```bash
./scripts/module install xq-domain-test-mcp
./scripts/module build xq-domain-test-mcp
./scripts/module test xq-domain-test-mcp
```

Inside this module:

```bash
yarn install --immutable
yarn build
yarn test
```

Run the MCP server locally:

```bash
yarn build
node dist/src/bin/xq-domain-test-mcp.js
```

## Testbed

The `testbed/` directory holds a mock learning API, sample business scenarios,
and JSON mappings for automated e2e runs. See [testbed/README.md](testbed/README.md).

```bash
# Terminal 1 - mock API for agent/manual runs
cd modules/xq-domain-test-mcp
node testbed/mock-api/server.mjs --port 18765

# Terminal 2 - build and run tests
./scripts/module test xq-domain-test-mcp
```

In an MCP client, open `testbed/scenarios/create-exercises.md` and ask the
agent to run the scenario via the `xq-domain-test-mcp` MCP tools, mapping REST
calls using `testbed/api-catalog.json`.

## Distribution

The package is published to GitHub Packages as
`@chauhaidang/xq-harness-domain-test-mcp`. It exposes a CLI bin named
`xq-domain-test-mcp`; MCP clients launch that command as a stdio subprocess.

Local development install:

```bash
cd modules/xq-domain-test-mcp
yarn install --immutable
yarn build
npm install --global .
command -v xq-domain-test-mcp
```

Tagged releases publish one package:

- `@chauhaidang/xq-harness-domain-test-mcp@<version>` to GitHub Packages

GitHub Packages requires an npm auth token with package read access.

## Deliverable Skill

The agent skill is shipped inside the npm package:

```text
skills/xq-domain-test-mcp/SKILL.md
```

This is intentional. In the Node/MCP ecosystem, the normal distribution unit is
the npm package: it carries the executable `bin`, compiled server code, README,
and any companion prompts, templates, or agent instructions as package files.
There is no separate standard registry for MCP skills.

When the package is installed as a dependency in a consumer project,
`xq-scripts/scripts/install-skills.js` discovers this shape automatically:

```text
node_modules/@chauhaidang/xq-harness-domain-test-mcp/skills/xq-domain-test-mcp/SKILL.md
```

Run the existing consumer script from the project root after installing
dependencies:

```bash
node path/to/xq-scripts/scripts/install-skills.js
```

The script scans installed `node_modules/@chauhaidang/*/skills/` directories and
copies each skill into `.agents/skills/`. For `npx`-only MCP usage, the server
can run without installing this skill locally first; run `install-skills.js` when
the agent runtime needs local skill files.

### Option A: install globally

```bash
npm config set @chauhaidang:registry https://npm.pkg.github.com
npm install --global @chauhaidang/xq-harness-domain-test-mcp@<version>
```

Configure an MCP client:

```json
{
  "mcpServers": {
    "xq-domain-test-mcp": {
      "command": "xq-domain-test-mcp",
      "args": []
    }
  }
}
```

### Option B: run with npx

This avoids a separate global install. The npm registry config and auth token
must still be available to the MCP host process.

```json
{
  "mcpServers": {
    "xq-domain-test-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@chauhaidang/xq-harness-domain-test-mcp@<version>"
      ]
    }
  }
}
```

Agent-side scenario mapping, `xq-config.json`, and tool usage are documented in
the shipped skill at [`skills/xq-domain-test-mcp/SKILL.md`](skills/xq-domain-test-mcp/SKILL.md).
