# Agent Workflow

This harness is designed to keep startup context bounded.

## Startup tiers

### Tier 1: always-on metadata

- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `node scripts/harness-context.mjs summary`

### Tier 2: targeted process context

Load one of:

- `node scripts/harness-context.mjs topic agent-workflow`
- `node scripts/harness-context.mjs topic module-workflow`
- `node scripts/harness-context.mjs module <module-name>`

### Tier 3: heavy resources

Only after Tier 2 points there:

- `docs/decisions/*`
- `docs/product/*`
- `docs/stories/*`
- deep module trees and large READMEs

## Session rules

- Restate STAR before edits
- Keep one active feature
- Record evidence in `feature_list.json` and `progress.md`
- Update `session-handoff.md` before ending
- Re-run relevant verification before claiming done

## Why this harness exists

The failure mode to avoid is broad up-front context loading. The agent should
query for the current context instead of assuming it needs the whole repo state.
