# Module subagent handoffs

When you open **only a module folder** in Cursor (not the monorepo root), the
agent loses repo-level `AGENTS.md`, `./scripts/module`, and `.agents/skills/`
unless you wire them back in. Each module that agents work on
should ship a **self-contained handoff** so a fresh session — or a subagent
scoped to that folder — can execute without re-discovering the monorepo.

## Files per module

| File | Audience | Purpose |
| --- | --- | --- |
| `AGENTS.md` (module root) | Cursor when workspace = module folder | Always-on instructions: commands, layout, invariants |
| `docs/subagent-handoff.md` | Root agent → subagent; session resume | Compact **current** context: active phase, task, decisions, pitfalls |
| `skills/<name>/SKILL.md` | Consumer / runtime agents | How to *use* the shipped artifact (CLI, MCP, library) |
| `docs/plans/*.md` | Implementers | Day-sized implementation plans with TDD steps |

**Division of labor:**

- `AGENTS.md` — stable module conventions (changes rarely).
- `docs/subagent-handoff.md` — **living** document; update at end of every
  meaningful session (current task, blockers, last green CI).
- Feature-specific docs (e.g. `openapi-catalog-builder-handoff.md`) stay as
  deep references; the subagent handoff links to them instead of duplicating.

## Root agent → subagent delegation

When delegating work inside a module, the root agent should:

1. Point the subagent at the **module folder** as workspace (or pass paths).
2. In the task prompt, require reading **in order**:
   - `AGENTS.md`
   - `docs/subagent-handoff.md`
   - The active plan under `docs/plans/` if one exists
3. Paste only **delta** context not already in the handoff (user intent, PR link,
   branch name).
4. Ask the subagent to **update `docs/subagent-handoff.md`** before finishing
   (Current work, Last verified, Open questions).

### Delegation prompt template

```text
Workspace: modules/<module-name>/ (module-only; monorepo root may be unavailable)

Before any edits, read:
1. AGENTS.md
2. docs/subagent-handoff.md
3. docs/plans/<active-plan>.md (if listed in handoff)

Task: <one sentence>

Constraints: <bullets>

Before you finish:
- Run the module CI commands from AGENTS.md
- Update docs/subagent-handoff.md (Current work, Last verified, Open questions)
```

## Monorepo context when the monorepo is not open

Shared repo docs live at the **repo root**. In a module-only workspace:

- **Preferred:** open the `xq-harness` root when you need shared docs, module
  registry context, or sibling-module references.
- **Module-only fallback:** append session outcomes to
  `docs/subagent-handoff.md` § *Session log* so the next agent can resume cleanly.

## Adding a handoff to a new module

1. Copy [SUBAGENT-HANDOFF-TEMPLATE.md](./SUBAGENT-HANDOFF-TEMPLATE.md) to
   `modules/<name>/docs/subagent-handoff.md` and fill every section.
2. Add `modules/<name>/AGENTS.md` (copy structure from
   `modules/xq-domain-test-mcp/AGENTS.md`).
3. Link both from the module `README.md`.

## Reference implementation

`modules/xq-domain-test-mcp/` — first module with full `AGENTS.md` +
`docs/subagent-handoff.md` + uplift roadmap and day plans.
