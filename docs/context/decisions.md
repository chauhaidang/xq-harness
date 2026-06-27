# Decisions

## DEC-5B67B144 — AGENTS.md structure

Status: `accepted`

Root AGENTS.md is the single entry point for agents: session start, skills routing (.agents/ + module skills), harness-state obligations, key docs, module runner, conventions, STAR.

**Rationale:** Previous AGENTS.md was placeholder text. A structured entry doc reduces agent improvisation and aligns with harness-state + Matt Pocock skill workflows already in the repo.

## DEC-4895574E — Use a dedicated poc module for exploratory initiatives

Status: `accepted`

Add modules/poc as a registered mixed-language module for prototypes, learning spikes, and short-lived initiatives. Keep it out of test-all and give it no-op module runner commands until a POC graduates into a durable module.

**Rationale:** Exploratory work like MCP learning should be discoverable through the same module registry as the rest of the repo, but should not create package, release, or CI obligations before the idea has proven useful.
