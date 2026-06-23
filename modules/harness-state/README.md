# xq-harness-state

`harness-state` is an installable Python CLI that records project context over
time so future agents and engineers can understand what requirements existed,
which decisions were made, which specs described intended behavior, which
solutions were proposed, which tasks were created, and what the workspace looked
like at important moments.

## Design

The CLI is the public seam. It calls a single deep module, `HarnessState`, which
owns the full state transition for every mutation:

1. create an event
2. insert the event into the local SQLite `events` table
3. append the event to the git-friendly JSONL journal
4. apply the event to projection tables

SQLite is a **local, rebuildable projection** and is not committed to git. The
durable, shared project memory is:

- append-only JSONL events under `.harness/events/`
- generated Markdown under `docs/context/`

The database can be deleted and rebuilt from the JSONL events at any time with
`harness-state rebuild`.

## Install (development)

```bash
cd modules/harness-state
uv sync
uv run harness-state --help
```

Editable install into the active environment:

```bash
cd modules/harness-state
uv pip install -e .
harness-state --help
```

## Usage

```bash
harness-state init
harness-state requirement add "Capture project timeline" --body "..."
harness-state decision record "Use SQLite as local projection" --rationale "..."
harness-state spec add "State timeline CLI" --body "..."
harness-state solution propose "Append-only event store" --body "..."
harness-state task add "Implement harness-state v1"
harness-state task status TASK-1234ABCD done
harness-state workspace observe
harness-state timeline
harness-state show requirement REQ-1234ABCD
harness-state export
harness-state rebuild
```

## Layout

```txt
.harness/
  state.db              # local, gitignored
  events/2026-06.jsonl  # git-friendly event journal
  artifacts/            # large logs/reports, gitignored
docs/context/           # generated Markdown context (committed)
```

## Development

```bash
cd modules/harness-state
uv sync
uv run pytest
uv build
```
