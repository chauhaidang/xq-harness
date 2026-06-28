# xq-domain-test-mcp

Python MCP server for REST API test automation tools.

The agent reads scenario Markdown, maps each scenario to an MCP tool call, and
calls this server. The server does not parse scenario Markdown in the MVP.

## Module Shape

- Project and MCP server name: `xq-domain-test-mcp`
- Python package: `xq_mcp`
- `server.py` — entry point; `build_server(state=...)` wires tools to runtime
- `runtime.py` — in-memory session config (`RuntimeState`)
- `tools/` — one module per tool category; each exposes a `*Tools` class with `register(mcp)`:
  - `runtime_config.py` — `RuntimeConfigTools`
  - `rest_api.py` — `RestApiTools`
- Tool focus: REST API testing
- Parked for later: generated Python API client / domain API tool integration

## Runtime Config Flow

1. Agent reads **`xq-config.json`** and resolves the scenario's `environment` key.
2. Agent passes `environment`, `api_base_url`, and `api_token` to the session
   setup tool (for example `configure_environment`).
3. Agent maps scenario Markdown to action tools (for example REST calls).
4. Agent may call a teardown tool between sessions or when switching environments.

Connection details belong in **`xq-config.json`**, not in scenario Markdown.
Secret values are never returned from status tools; responses expose only
booleans such as `has_api_token`.

## Shipped artifacts

This module ships two consumer artifacts alongside the Python wheel:

| Artifact | Location | Purpose |
| --- | --- | --- |
| MCP server CLI | `xq-domain-test-mcp` | stdio MCP process |
| Agent skill | [`skills/xq-domain-test-mcp/`](skills/xq-domain-test-mcp/) | How agents use the server, `xq-config.json`, and scenario mapping |

Install the skill into your agent environment (for example copy or link
`skills/xq-domain-test-mcp/` to `.agents/skills/xq-domain-test-mcp/`). The
monorepo keeps a synced copy at
[`.agents/skills/xq-domain-test-mcp/`](../../.agents/skills/xq-domain-test-mcp/).

The skill is the canonical consumer contract. The MCP server exposes tool
schemas; the skill explains `xq-config.json`, discovery, and scenario mapping.

## Testbed

The `testbed/` directory holds a mock learning API, sample business scenarios,
and JSON mappings for automated e2e runs. See [testbed/README.md](testbed/README.md).

```bash
# Terminal 1 — mock API for agent/manual runs
cd modules/xq-domain-test-mcp
uv run python -m testbed.mock_api.server --port 18765

# Terminal 2 — ensure MCP is installed and Cursor loads .cursor/mcp.json
command -v xq-domain-test-mcp

# Run all tests including testbed e2e
uv run pytest
```

In Cursor chat, open `testbed/scenarios/create-exercises.md` and ask the agent to
run the scenario via the `xq-domain-test-mcp` MCP tools (mapping REST calls using
`testbed/api-catalog.json`).

## Development

Use the module runner from the repo root:

```bash
./scripts/module install xq-domain-test-mcp
./scripts/module build xq-domain-test-mcp
./scripts/module test xq-domain-test-mcp
```

The behavior tests can also run directly inside this module:

```bash
uv run pytest
```

Run the MCP server locally (module venv, not the global install):

```bash
uv run xq-domain-test-mcp
```

## Global install

Consumers run the MCP server through a globally installed CLI named
`xq-domain-test-mcp`. Distribution is a Python wheel installed with
[`uv tool`](https://docs.astral.sh/uv/concepts/tools/) (not npm or PyPI).

### Build the wheel

From the repo root:

```bash
./scripts/module ci xq-domain-test-mcp
```

Or inside this module:

```bash
cd modules/xq-domain-test-mcp
uv sync --locked
uv run basedpyright
uv run pytest
uv build
```

The wheel lands in `dist/`:

```txt
dist/xq_domain_test_mcp-<version>-py3-none-any.whl
```

### Install or upgrade globally

From the built wheel:

```bash
cd modules/xq-domain-test-mcp
uv tool install --force dist/xq_domain_test_mcp-*.whl
```

Or install directly from the module source tree (useful while developing):

```bash
cd modules/xq-domain-test-mcp
uv tool install --force .
```

Ensure `uv`'s tool bin directory is on your `PATH`:

```bash
export PATH="$(uv tool dir --bin):${PATH}"
```

Verify the command is available:

```bash
command -v xq-domain-test-mcp
```

Re-run `uv tool install --force …` after rebuilding whenever you change the
server and want agents to pick up the new version.

### Configure an MCP client

Point your agent at the globally installed stdio command:

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

Agent-side scenario mapping, `xq-config.json`, and tool usage are documented in
the shipped skill at [`skills/xq-domain-test-mcp/SKILL.md`](skills/xq-domain-test-mcp/SKILL.md).

### GitHub Release install (when published)

When a release workflow publishes wheels to GitHub Releases (same pattern as
`harness-state`), install a pinned version with:

```bash
uv tool install --force \
  https://github.com/<OWNER>/<REPO>/releases/download/xq-domain-test-mcp-v<version>/xq_domain_test_mcp-<version>-py3-none-any.whl
```

Push tag `xq-domain-test-mcp-v<version>` (must match `pyproject.toml`) to trigger
`.github/workflows/xq-domain-test-mcp-release.yml`. Until then, use the local wheel
or `uv tool install --force .`.
