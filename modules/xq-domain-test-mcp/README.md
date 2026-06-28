# xq-domain-test-mcp

Python MCP server for REST API test automation tools.

The agent reads scenario Markdown, maps each scenario to an MCP tool call, and
calls this server. The server does not parse scenario Markdown in the MVP.

## Module Shape

- Project and MCP server name: `xq-domain-test-mcp`
- Python package: `xq_mcp`
- Runtime config: configured through MCP tools and stored in memory
- Tool focus: REST API testing
- Parked for later: generated Python API client / domain API tool integration

## Runtime Config Flow

1. Agent calls `configure_environment`.
2. Agent maps scenario Markdown to `call_rest_api`.
3. Tools read runtime config from memory.
4. Agent may call `clear_environment` between sessions.

Secret values are never returned from status tools; responses expose only
booleans such as `has_api_token`.

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

Run the MCP server:

```bash
uv run xq-domain-test-mcp
```
