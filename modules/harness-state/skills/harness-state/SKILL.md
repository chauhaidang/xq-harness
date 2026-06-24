---
name: harness-state
description: Record and query durable project context with the `harness-state` CLI — requirements, decisions, specs, solutions, tasks, and workspace snapshots, stored as an append-only event timeline. Use when starting work in this repo, when a requirement/decision/spec/solution/task emerges, before/after significant changes, or when the user asks "what was decided", "why", "what's the history", "record this decision", or wants project memory captured for future agents.
---

# harness-state

`harness-state` is an installable CLI that records project context over time so
future agents and engineers can reconstruct what happened and why. Every
mutation is captured as an append-only event with git context (branch, commit,
working-tree hash). SQLite is a local, rebuildable projection; the durable
shared memory is JSONL events (`.harness/events/`) and Markdown (`docs/context/`).

**Use this tool to leave a trail.** When you make or learn something that future
work depends on — a requirement, a decision and its rationale, a spec, a chosen
approach, a task, or a notable workspace moment — record it. Do not store
secrets or large logs in events; reference artifact paths instead.

## Setup (once per environment)

```bash
cd modules/harness-state
uv sync                      # dev: run via `uv run harness-state ...`
# or install the executable into the active environment:
uv pip install -e .          # then `harness-state ...` directly
harness-state --help
```

If `harness-state` is not on PATH, prefix every command with `uv run` from
`modules/harness-state`. All commands below assume the executable is available.

## First step in any repo session

```bash
harness-state init          # idempotent; creates .harness/ + docs/context/
```

Run `init` before any other command. Without it, commands fail with a clear
"not initialized" error. `init` is safe to run repeatedly.

## When to record what

| You observe / decide… | Command |
|---|---|
| A need the system must satisfy | `requirement add` |
| A choice + why it was made | `decision record` (always include `--rationale`) |
| Intended behavior / contract | `spec add` (link with `--requirement REQ-…`) |
| A chosen implementation direction | `solution propose` (link with `--spec SPEC-…`) |
| A unit of work to do | `task add`; later `task status <id> done` |
| A meaningful repo state moment | `workspace observe` |

Record decisions the moment they're made — including ones you make autonomously
(naming, approach, trade-offs). The rationale is the most valuable part for
future readers.

## Command reference

```bash
harness-state requirement add "Title" --body "..." --source user
harness-state decision record "Title" --body "..." --rationale "Why"
harness-state spec add "Title" --body "..." --requirement REQ-1234ABCD
harness-state solution propose "Title" --body "..." --spec SPEC-1234ABCD
harness-state task add "Title" --body "..." --priority high
harness-state task status TASK-1234ABCD done
harness-state workspace observe

harness-state timeline [--limit N]      # ordered event history
harness-state show requirement REQ-…    # current state of one entity
harness-state export                    # write docs/context/*.md
harness-state rebuild                   # rebuild local DB from JSONL events
```

Each create command prints the new ID (e.g. `Created requirement REQ-447B2D07`).
Capture that ID to link related entities. `show` accepts entity types:
`requirement`, `decision`, `spec`, `solution`, `task`.

## Reading context (do this before changing things)

To understand prior context at the start of a task:

```bash
harness-state timeline --limit 100      # what happened, in order
harness-state show decision DEC-…        # full rationale for a past decision
```

Also read `docs/context/*.md` (e.g. `current.md`, `decisions.md`) — these are
the human-reviewable, git-committed projection of the same data.

## Recommended workflow

```
Task Progress:
- [ ] harness-state init
- [ ] Read prior context: timeline + docs/context/*.md
- [ ] Record the requirement(s) driving this work
- [ ] Record decisions WITH rationale as you make them
- [ ] Add a spec / propose a solution; link them by ID
- [ ] Create tasks; mark task status done as you finish
- [ ] workspace observe at notable checkpoints
- [ ] harness-state export   (refresh docs/context for review)
```

## Rules for agents

- **Init first.** Always `harness-state init` before recording or querying.
- **Decisions need rationale.** A decision without `--rationale` loses its main value.
- **Link by ID.** Use the printed IDs to connect spec→requirement and solution→spec.
- **Keep payloads small.** Never paste secrets or large logs into `--body`. Put
  big outputs under `.harness/artifacts/` and reference the path.
- **Don't hand-edit storage.** Never edit `.harness/events/*.jsonl`,
  `.harness/state.db`, or `docs/context/*.md` by hand. Events are append-only;
  the only way to change state is to record a new event via the CLI.
- **SQLite is disposable.** If the DB looks stale or corrupt, run
  `harness-state rebuild` to regenerate it from the JSONL events.
- **Export before review/commit.** Run `harness-state export` so reviewers see
  up-to-date `docs/context/*.md` in the diff.

## What is committed vs local

- Committed (shared project memory): `.harness/events/*.jsonl`, `docs/context/*.md`
- Local only (gitignored, rebuildable): `.harness/state.db*`, `.harness/artifacts/`

## v1 scope

Only creation events plus task status changes exist:
`requirement.created`, `decision.recorded`, `spec.created`, `solution.proposed`,
`task.created`, `task.status_changed`, `workspace.observed`, `artifact.created`.
There are no update/supersede/accept commands yet — to change something, record
a new event. Do not assume edit/delete commands exist.
