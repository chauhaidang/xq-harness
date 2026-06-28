---
name: xq-domain-test-mcp
description: Use when a consumer agent needs to connect to and use the globally installed xq-domain-test-mcp MCP server for scenario-driven API testing. Trigger for MCP server setup, xq-config.json, discovering xq-domain-test-mcp tools, or mapping business scenario Markdown to MCP tool calls.
---

# xq-domain-test-mcp

Use this skill for the globally installed MCP server:

```bash
xq-domain-test-mcp
```

## Mental Model

The agent owns scenario interpretation and runtime wiring:

```text
xq-config.json + scenario Markdown -> agent maps intent -> MCP tool call(s) -> structured result
```

The MCP server exposes callable tools with typed arguments and returns structured
evidence. It does not parse scenario Markdown or read `xq-config.json` — the
agent reads both and passes the correct arguments to MCP tools.

## xq-config.json

Runtime connection details live in a repo-local **`xq-config.json`**. Do not
repeat `api_base_url`, tokens, or other environment wiring in every scenario
Markdown file.

Recommended shape:

```json
{
  "environments": {
    "testbed": {
      "api_base_url": "http://127.0.0.1:18765",
      "api_token": "testbed-token"
    },
    "dev": {
      "api_base_url": "https://api.example.test",
      "api_token": null
    }
  }
}
```

Agent rules:

1. **Locate** `xq-config.json` in the consumer project (repo root or an agreed
   path such as `testbed/xq-config.json`).
2. **Read** the named environment entry before running scenarios.
3. **Pass values to session setup tools** — map the entry to the runtime config
   tool schema (for example `environment`, `api_base_url`, `api_token`).
4. **Never commit production secrets** — use env-specific files, gitignored
   overrides, or local-only entries; tokens stay out of scenario Markdown.

Scenario frontmatter uses **`environment`** only as a **selector key** into
`xq-config.json` (for example `environment: testbed`), not as a place to embed
URLs or credentials.

## Discovering tools

Do not rely on a fixed tool list in this skill. The catalog grows by category
(runtime config, REST API, and future domain tools).

Before executing a scenario:

1. **Read `xq-config.json`** and resolve the scenario's `environment` key.
2. **List tools** exposed by the connected `xq-domain-test-mcp` server.
3. **Read each tool's schema** (name, description, required arguments, types).
4. **Pick tools by role**, not by memorized names:
   - **Session setup** — apply the resolved `xq-config.json` entry via the
     runtime config tool.
   - **Actions** — perform the API or domain steps implied by the scenario.
   - **Session teardown** — clear runtime state when switching environments.

Use the tool descriptions and schemas as the source of truth. If a scenario needs
a capability that no listed tool covers, ask for clarification or missing API
documentation — do not invent tools or arguments.

## Scenario Mapping Pattern

Write scenarios in business language. The scenario should describe user intent,
business entities, inputs, and expected outcomes — not HTTP details or runtime
connection settings.

Use this shape:

````markdown
---
id: create-exercises
environment: testbed
domain: learning
capability: exercise-authoring
---

# Teacher creates vocabulary exercises

Given lesson "lesson-a" exists
And the teacher wants beginner vocabulary practice
When the teacher creates 5 vocabulary exercises for the lesson
Then the exercises should be available for review
````

Agent mapping rules:

- Resolve **`environment`** from frontmatter against **`xq-config.json`**, then
  call the session setup tool once per MCP session (or after `clear_environment`).
- Use **`domain`**, **`capability`**, title, and steps to choose action tools
  and arguments.
- Resolve concrete API arguments from **project API knowledge** (OpenAPI,
  internal docs, or a repo-local API catalog). The MCP server does not ship
  domain endpoint maps for consumer systems.
- Use `Then` clauses for expected outcomes — status checks, follow-up reads, or
  assertions supported by the tools you invoke.
- If required mapping details are missing, ask for clarification instead of
  guessing.

Illustrative flow for the scenario above:

1. Read `xq-config.json` → `environments.testbed`.
2. Session setup tool → pass `environment: "testbed"`, `api_base_url`, and
   `api_token` from that entry.
3. Action tool(s) → create exercises, then verify they are listed for the lesson.
4. Optional teardown tool → clear session before the next scenario.

Exact tool names and argument objects must match the live MCP tool schemas.

## Agent MCP Config

Use the globally installed command:

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

Verify the command is available before configuring the agent:

```bash
command -v xq-domain-test-mcp
```

## Usage Guardrails

- Use this MCP server for guarded API test automation only.
- Do not substitute broad shell execution for MCP tools.
- Do not expect secrets in environment status responses.
- Keep runtime config in memory only; configure once from `xq-config.json`, then
  run scenario actions.
- Clear or reconfigure runtime state when switching `environment` keys.
