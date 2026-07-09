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

## Required Change Checkpoints

For any code or config change, capture these checkpoints explicitly:

- **Before state**
  - Current behavior
  - Files or module in scope
  - Active feature and known blockers
- **After state**
  - Intended delivered behavior
  - Actual files changed
  - Remaining blockers or follow-up
- **Regression test results**
  - Commands run
  - Pass/fail result
  - Unrun but expected checks
- **PR ready**
  - Diff is scoped to one task or feature
  - User-facing or repo-facing docs updated if needed
  - No known partial edits hidden in the change
- **CI ready**
  - Relevant local verification already ran
  - Required generated files or lockfiles are present
  - No known environment-only breakage left unrecorded

If any checkpoint is not satisfied, record it as `no` or `blocked` with the
reason rather than silently omitting it.

## Why this harness exists

The failure mode to avoid is broad up-front context loading. The agent should
query for the current context instead of assuming it needs the whole repo state.
