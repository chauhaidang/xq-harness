---
name: xq-domain-test-mcp
description: Use when a user asks an AI agent to run business-readable API test scenarios through the xq-domain-test-mcp MCP server. Trigger on xq-config.json, scenario Markdown, MCP tool discovery, REST API test execution, or environment setup for this server.
---

# xq-domain-test-mcp

Use this skill when the user wants to validate an API workflow from a scenario,
acceptance criterion, bug report, or business-readable test description.

The MCP server is a guarded execution layer. The AI agent does the reasoning:
read the user's goal, inspect local test/API context, discover the server's live
tools, map intent to tool calls, execute the calls, and report evidence.

## Required Context

Before running a scenario, gather:

- The user's goal or scenario text.
- `xq-config.json`, usually at the project root.
- API knowledge needed to map business intent to concrete calls, such as OpenAPI
  specs, API catalog files, docs, examples, or existing tests.
- The live MCP tool list and schemas from the connected `xq-domain-test-mcp`
  server.

Do not assume fixed tool arguments from memory. Use the MCP-discovered schemas as
the source of truth.

## Environment Config

`xq-config.json` stores connection details by environment:

```json
{
  "environments": {
    "testbed": {
      "api_base_url": "http://127.0.0.1:18765",
      "api_token": "testbed-token"
    }
  }
}
```

Rules:

- Treat scenario `environment` values as selector keys into `xq-config.json`.
- Pass the selected `api_base_url`, `api_token`, and environment name to the
  server's runtime configuration tool before calling environment-dependent tools.
- Never write secrets into scenario Markdown or final reports.
- Do not print token values. It is fine to report whether a token was configured.

## Scenario Mapping

Scenarios should describe business behavior, not raw HTTP details:

```markdown
---
id: create-exercises
environment: testbed
domain: learning
capability: exercise-authoring
---

# Teacher creates vocabulary exercises

Given lesson "lesson-a" exists
When the teacher creates 5 vocabulary exercises for the lesson
Then the exercises should be available for review
```

Map the scenario like this:

1. Resolve `environment` from frontmatter or user context.
2. Configure the MCP runtime from `xq-config.json`.
3. Use domain/API context to translate business steps into tool inputs.
4. Execute action tools.
5. Execute verification tools or follow-up reads for each expected outcome.
6. Clear or reconfigure runtime state when switching environments.

If the API mapping is ambiguous:

- In an interactive chat, ask for the missing endpoint, schema, fixture, or
  expected result instead of guessing.
- In CI or any non-interactive run, record a detailed mapping error for that
  scenario or step, mark it as blocked/skipped, and continue with the remaining
  executable scenarios when possible. Do not fail the entire execution just
  because one scenario is missing API knowledge.

## Execution Rules

- Prefer the smallest tool sequence that proves the user's requested behavior.
- Use setup calls once per session unless the environment changes.
- Validate `Then` outcomes with concrete evidence: status code, response fields,
  IDs created, counts, or follow-up reads.
- Preserve useful response details in the final report, but redact secrets.
- If a tool returns a structured error, report the tool, inputs at a safe level,
  and the error message. Do not retry blindly with invented arguments.
- Do not replace MCP tools with shell commands for API execution unless the user
  explicitly asks and the MCP server cannot express the required action.

## MCP Client Config

Global install:

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

No global install, with pre-authenticated npm:

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

For GitHub Packages, npm must already be configured for the `@chauhaidang`
scope and have a token with package read access.

## Final Report

When done, tell the user:

- Which environment was used.
- Which scenario or user goal was executed.
- Which MCP tools were called, at a business-readable level.
- What evidence proves pass/fail.
- Any missing API knowledge, ambiguous mapping, or follow-up needed.
