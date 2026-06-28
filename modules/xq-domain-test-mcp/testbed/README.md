# xq-domain-test-mcp testbed

Local fixtures for end-to-end MCP REST API testing: a mock learning API,
business-readable scenarios, and machine-readable tool-call mappings.

## Layout

```txt
testbed/
  xq-config.json        # runtime environments (agent reads, passes to MCP tools)
  api-catalog.json      # REST endpoints agents map scenarios onto
  mock_api/             # in-memory learning API server
  scenarios/            # business scenario Markdown (human/agent authored)
  mappings/             # expected MCP tool sequences for automated e2e
```

## Mental model

```text
xq-config.json + scenario Markdown -> agent maps using api-catalog.json -> MCP tools -> mock API
```

The MCP server executes tool calls only. It does not read `xq-config.json` or
scenario Markdown — the agent reads both and passes arguments to MCP tools.

## Run the mock API

From the module root:

```bash
cd modules/xq-domain-test-mcp
uv run python -m testbed.mock_api.server --port 18765
```

Defaults for the `testbed` entry in `xq-config.json`:

- Base URL: `http://127.0.0.1:18765`
- Token: `testbed-token`

Endpoints:

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | no | Liveness |
| POST | `/exercises` | Bearer | Create exercises for a lesson |
| GET | `/exercises?lesson_id=` | Bearer | List exercises for a lesson |

## Manual agent run

1. Start the mock API (above).
2. Enable the MCP server in Cursor — project config is [`.cursor/mcp.json`](../../.cursor/mcp.json).
3. Install the consumer skill from [`../skills/xq-domain-test-mcp/`](../skills/xq-domain-test-mcp/).
4. Open `scenarios/create-exercises.md` and ask the agent to execute it using
   `xq-config.json`, `api-catalog.json`, and discovered MCP tool schemas.
5. Expected flow:
   - Read `xq-config.json` → `environments.testbed`
   - Session setup tool → pass `environment`, `api_base_url`, `api_token` from that entry
   - Action tools → create exercises, verify listing
   - Optional teardown tool when done

## Automated e2e

Pytest starts the mock API on an ephemeral port and replays `mappings/*.json`
through the real MCP tool handlers:

```bash
./scripts/module test xq-domain-test-mcp
# or
uv run pytest tests/e2e -v
```

Mappings substitute `{{mock_api_base_url}}` with the ephemeral server URL.
Configure step values otherwise mirror `xq-config.json`.
