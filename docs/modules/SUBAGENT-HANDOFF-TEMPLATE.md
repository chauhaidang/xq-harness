# Subagent handoff — `<module-name>`

> Copy to `modules/<module-name>/docs/subagent-handoff.md` and replace all
> `<placeholders>`. Update the **Current work** and **Last verified** sections
> at the end of every session.

**Status:** `<planned | in-progress | blocked | idle>`  
**Last updated:** `<YYYY-MM-DD>`  
**Monorepo:** `xq-harness` / `modules/<module-name>/`

---

## Situation (30 seconds)

`<What this module is, who consumes it, one paragraph.>`

## Architecture snapshot

```text
<ASCII diagram or bullet layout — package name, entry points, key dirs>
```

**Invariants (do not break without an ADR):**

- `<invariant 1>`
- `<invariant 2>`

## Active roadmap / phase

| Item | Location |
| --- | --- |
| Roadmap | `<path or "none">` |
| Current phase | `<e.g. Track A Day 1>` |
| Active plan | `<path to docs/plans/...>` |
| Active task ID | `<TASK-… from harness-state, or "none">` |

## Current work

**Goal:** `<one sentence for this session>`

**Next steps:**

1. `<step>`
2. `<step>`

**Out of scope right now:**

- `<item>`

## Commands

### Module-only workspace (this folder is the Cursor root)

```bash
cd <module-relative-path>   # usually .
uv sync --locked
uv run pytest
uv run basedpyright         # if applicable
uv build                    # if applicable
```

### Monorepo workspace (xq-harness root open)

```bash
./scripts/module ci <module-name>
```

## Key files

| Path | Role |
| --- | --- |
| `<path>` | `<role>` |

## Skills & deep docs

| Doc | Use when |
| --- | --- |
| `skills/<name>/SKILL.md` | `<when>` |
| `<other doc>` | `<when>` |

## Recent decisions (module-relevant)

| ID | Summary |
| --- | --- |
| `<DEC-…>` | `<one line>` |

Full history: monorepo `docs/context/decisions.md` (if root is available).

## Pitfalls

- `<pitfall>`

## Last verified

```text
<date> — <command> — <pass/fail> — <commit or "local">`
```

## Open questions

- `<question or "none">`

## Session log (module-only harness-state fallback)

Append-only; sync to harness-state when monorepo root is available.

| Date | Agent | Summary |
| --- | --- | --- |
| `<YYYY-MM-DD>` | `<cursor/subagent>` | `<what was done>` |
