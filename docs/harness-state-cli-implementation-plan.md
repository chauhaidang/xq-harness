# Harness State CLI Implementation Plan

## Purpose

Build an installable Python CLI app named `harness-state`.

The app records project context over time so future agents and engineers can understand:

- what requirements existed
- which decisions were made
- which specs described the intended behavior
- which solutions were proposed or accepted
- which tasks were created or completed
- what the workspace looked like at important moments
- which commands, tests, reports, and artifacts were produced

The app must be consumable as an executable command:

```bash
harness-state init
harness-state requirement add "Capture project timeline"
harness-state decision record "Use SQLite as local projection"
harness-state timeline
harness-state export
```

Consumers must not need to run internal Python module paths such as:

```bash
python -m tools.harness_state ...
```

That form can exist for development, but it is not the consumer interface.

## Core Design

The `harness-state` CLI should be a deep module.

The interface should be small:

```bash
harness-state init
harness-state requirement add ...
harness-state decision record ...
harness-state spec add ...
harness-state solution propose ...
harness-state task add ...
harness-state workspace observe
harness-state timeline
harness-state show ...
harness-state export
harness-state rebuild
```

The implementation should hide:

- SQLite schema details
- event sequencing
- Git metadata capture
- JSONL journal writing
- Markdown rendering
- projection-table updates
- rebuild logic

The CLI is the seam. The concrete SQLite/JSONL/Markdown code is implementation detail.

### Why this design matters

The harness will be used by humans, agents, scripts, and future automation. Those consumers should not need to understand the storage layout, SQL tables, Git commands, JSONL file naming, or Markdown export rules. They should only need to learn a small interface.

That is why the executable command is the public seam:

```bash
harness-state ...
```

Everything behind that seam is implementation detail.

This gives three benefits:

- **Leverage:** one command records a complete, consistent event instead of making callers remember several file and database writes.
- **Locality:** if storage changes later, changes stay inside the `harness_state` implementation.
- **Testability:** tests can call the `HarnessState` module interface and verify behavior without shelling out for every case.

Do not let the CLI become a shallow wrapper around scattered helper scripts. The CLI should call one deep module that owns the full state transition.

## Storage Decision

Use SQLite as local operational state.

Do not commit SQLite to git.

Commit git-friendly project memory instead:

- append-only JSONL events under `.harness/events/`
- generated or curated Markdown under `docs/context/`

The database must be rebuildable from tracked JSONL events.

Runtime files:

```txt
.harness/
  state.db              # local, gitignored
  state.db-wal          # local, gitignored
  state.db-shm          # local, gitignored
  events/
    2026-06.jsonl       # git-friendly event journal
  artifacts/            # large logs/reports, gitignored by default
```

Generated shared docs:

```txt
docs/context/
  current.md
  timeline.md
  requirements.md
  decisions.md
  specs.md
  solutions.md
```

### Why SQLite is local only

SQLite is a good implementation detail because it gives:

- transactions
- fast local queries
- simple setup
- no external server
- good enough concurrency for local agent workflows when WAL is enabled

SQLite is a poor shared git artifact because it is:

- binary
- hard to review
- hard to merge
- noisy when changed
- vulnerable to lock/WAL file confusion

So the database should be treated as a local projection. It is allowed to be deleted and rebuilt.

The durable project memory should be stored in formats that git handles well:

- JSONL for machine-readable append-only events
- Markdown for human-readable context

This split prevents the implementation from coupling shared project state to one local database file.

## Target Package Layout

Create a standalone Python package under `modules/harness-state/`.

```txt
modules/
  harness-state/
    pyproject.toml
    README.md
    skills/
      harness-state/
        SKILL.md
    src/
      harness_state/
        __init__.py
        __main__.py
        cli.py
        config.py
        db.py
        schema.py
        events.py
        projections.py
        git_context.py
        export.py
        render.py
        ids.py
        errors.py
    tests/
      test_init.py
      test_events.py
      test_requirements.py
      test_decisions.py
      test_rebuild.py
      test_export.py
```

The `skills/` directory is part of the release surface.

Expected v1 skill layout:

```txt
modules/
  harness-state/
    skills/
      harness-state/
        SKILL.md
```

Optional future skill layout:

```txt
modules/
  harness-state/
    skills/
      harness-state/
        SKILL.md
      harness-state-release/
        SKILL.md
      harness-state-architecture/
        SKILL.md
```

Each skill directory must contain a `SKILL.md` with frontmatter:

```md
---
name: harness-state
description: Use the harness-state CLI to record and inspect project context timeline state.
---
```

### Why this package layout

This project is a monorepo with multiple modules. `harness-state` should behave like a real product module, not a loose script.

Putting it under `modules/harness-state/` gives:

- a clear module owner
- an installable package
- isolated tests
- a future publishing path
- a clean executable interface
- a versioned agent skill bundle

Using `src/harness_state/` avoids accidental imports from the working directory during tests. This catches packaging mistakes earlier.

Keeping skills under `modules/harness-state/skills/` makes the agent-facing instructions version with the CLI implementation. If the CLI interface changes, the skill instructions can change in the same release.

## Packaging

Create `modules/harness-state/pyproject.toml`.

Use `uv` as the Python project/build tool.

Use this starting point:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "xq-harness-state"
version = "0.1.0"
description = "Project context timeline and state management CLI"
requires-python = ">=3.14"
dependencies = []

[project.scripts]
harness-state = "harness_state.cli:main"

[tool.uv]
package = true

[tool.hatch.build.targets.wheel]
packages = ["src/harness_state"]
```

After this exists, local development install should work:

```bash
cd modules/harness-state
uv sync
uv run harness-state --help
```

Editable install into the active environment should work with:

```bash
cd modules/harness-state
uv pip install -e .
harness-state --help
```

### Why use a console script entry point

The intended consumer experience is:

```bash
harness-state init
```

not:

```bash
python -m harness_state init
```

and not:

```bash
python path/to/some/script.py init
```

The console script makes the tool feel like an executable app. It also decouples consumers from the Python source layout. The internal package can move files around later without breaking users, as long as the `harness-state` command remains stable.

### Why use `uv`

Use `uv` because it gives one consistent tool for:

- creating the virtual environment
- resolving dependencies
- syncing the project
- running the executable
- building the package
- installing the local editable package

This avoids mixing `pip`, `venv`, and ad hoc shell setup instructions.

For v1, the expected commands are:

```bash
cd modules/harness-state
uv sync
uv run harness-state --help
uv run pytest
uv build
```

If a consumer wants the command installed into an existing environment:

```bash
cd modules/harness-state
uv pip install -e .
harness-state --help
```

## Release Plan

The v1 release target has two artifacts:

1. an installable Python package that exposes the executable command:

```bash
harness-state
```

2. an agent skill bundle sourced from:

```txt
modules/harness-state/skills/
```

Aim for Level 3 only.

The release strategy is defined in:

```txt
docs/harness-state-cli-release-strategy.md
```

Important constraint: GitHub Packages does not currently provide a Python/PyPI package registry. Therefore the GitHub-targeted Level 3 release uses:

- GitHub Releases for Python wheel/sdist artifacts
- GitHub Releases for `harness-state-skills-<version>.tar.gz`

Do not document or promise `uv pip install ... --index-url <github-packages>` for this Python package unless GitHub adds PyPI-compatible package support or the project chooses a different Python registry.

### Release commands

From the package directory:

```bash
cd modules/harness-state
uv sync
uv run pytest
SOURCE_DATE_EPOCH=0 uv build
test -d skills
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
tar -czf dist/harness-state-skills-0.1.0.tar.gz -C skills .
```

Expected build outputs:

```txt
modules/harness-state/dist/
  xq_harness_state-0.1.0-py3-none-any.whl
  xq_harness_state-0.1.0.tar.gz
  harness-state-skills-0.1.0.tar.gz
```

Consumer install from a GitHub Release wheel:

```bash
uv tool install https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
```

Alternative install into the current environment from GitHub Release:

```bash
uv pip install https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
```

Agent skill install from GitHub Release:

```bash
curl -L \
  https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/harness-state-skills-0.1.0.tar.gz \
  -o /tmp/harness-state-skills-0.1.0.tar.gz
mkdir -p .agents/skills
tar -xzf /tmp/harness-state-skills-0.1.0.tar.gz -C .agents/skills
```

### Release validation checklist

Before cutting a release, validate:

```bash
cd modules/harness-state
uv sync
uv run pytest
uv run harness-state --help
uv run harness-state --version
SOURCE_DATE_EPOCH=0 uv build
test -d skills
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
tar -czf dist/harness-state-skills-0.1.0.tar.gz -C skills .
```

Then validate the built wheel in a clean temporary environment:

```bash
uv tool install --force dist/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
harness-state --version
```

If the executable command does not work from the built wheel, the release is not valid.

Then validate the skill bundle:

```bash
tar -tzf dist/harness-state-skills-0.1.0.tar.gz
mkdir -p /tmp/harness-state-skills-smoke/.agents/skills
tar -xzf dist/harness-state-skills-0.1.0.tar.gz \
  -C /tmp/harness-state-skills-smoke/.agents/skills
find /tmp/harness-state-skills-smoke/.agents/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

If the skill bundle does not extract into usable skill directories with `SKILL.md` files, the release is not valid.

### Versioning

Use semantic versioning:

```txt
MAJOR.MINOR.PATCH
```

For v1 development:

```txt
0.1.0
```

Patch release examples:

- `0.1.1`: bug fix, no CLI behavior change
- `0.1.2`: packaging fix, no state model change

Minor release examples:

- `0.2.0`: add `requirement update`
- `0.3.0`: add command wrapping with `harness-state run -- ...`
- `0.4.0`: add richer links between requirements, specs, solutions, and tasks

Breaking change example:

- `1.0.0`: stable CLI contract and migration support

Do not change event payload shapes casually. Event shapes are part of the storage contract because rebuild depends on them.

### Release notes

Every release should include short release notes:

```md
# xq-harness-state 0.1.0

## Added

- Installable `harness-state` CLI.
- Local SQLite state database.
- Append-only JSONL event journal.
- Requirement, decision, spec, solution, task, and workspace events.
- Markdown export under `docs/context`.
- Rebuild from JSONL events.
- Agent skill bundle from `modules/harness-state/skills`.

## Validation

- `uv run pytest`
- `uv build`
- installed wheel and verified `harness-state --help`
- created and extracted `harness-state-skills-0.1.0.tar.gz`
```

### Recommended CI release job

Add a release workflow later under:

```txt
.github/workflows/harness-state-release.yml
```

Suggested trigger:

```yaml
on:
  push:
    tags:
      - "harness-state-v*"
```

Suggested job behavior:

1. checkout repo
2. install Python 3.14
3. install `uv`
4. run tests
5. build package
6. verify wheel installation
7. validate skill files
8. build `harness-state-skills-<version>.tar.gz`
9. create `SHA256SUMS`
10. create GitHub Release for `harness-state-v*`
11. upload wheel, sdist, skill bundle, and checksums to GitHub Release

Do not claim GitHub Packages PyPI support. The Python package artifact goes to GitHub Releases.

### Why release planning belongs in v1

The CLI is only useful if consumers can install and run it consistently.

A source-only script is not enough because each consumer would need to know:

- where the source file lives
- how to configure Python paths
- how to install dependencies
- which Python version is required
- how to expose the executable command

Packaging and release define the real consumer interface. They also protect the module seam: consumers depend on `harness-state`, not on internal files.

## Gitignore Rules

Update the root `.gitignore`:

```gitignore
.harness/state.db
.harness/state.db-*
.harness/artifacts/
```

Do not ignore:

```txt
.harness/events/
docs/context/
```

The DB is local state. JSONL and Markdown are shared project memory.

### Why these gitignore rules

The gitignore rules enforce the storage decision.

Commit these:

- `.harness/events/*.jsonl`
- `docs/context/*.md`

Ignore these:

- `.harness/state.db`
- `.harness/state.db-wal`
- `.harness/state.db-shm`
- `.harness/artifacts/`

This makes code review useful. Reviewers can inspect timeline events and Markdown context without opening a binary DB. It also prevents accidental DB merge conflicts.

## Data Model

Use one append-only timeline table plus projection tables.

The `events` table is the canonical local timeline.

Projection tables are current-state views for easy querying.

Every mutation must:

1. create an event
2. insert the event into `events`
3. append the event to JSONL
4. apply the event to projection tables

Projection tables are rebuildable. Events are append-only.

### Why append-only events plus projections

The harness is managing project history, not just current state.

If a requirement changes, future agents need to know:

- what the old requirement was
- when it changed
- why it changed
- which decision/spec/solution was affected
- what Git state existed at that time

A normal CRUD table loses that timeline unless extra audit logic is added everywhere. Append-only events make the timeline the default.

Projection tables exist because reading the latest state directly from events is inconvenient. For example, a user should be able to quickly ask:

```bash
harness-state show requirement REQ-1234ABCD
```

The projection table answers that quickly.

So the model is:

```txt
events = historical truth
projection tables = current query shape
Markdown = human-readable export
JSONL = git-friendly machine-readable export
SQLite DB = local operational implementation
```

This gives both history and usability.

## SQLite Schema

Create `src/harness_state/schema.py`.

Expose:

```python
def create_schema_sql() -> str:
    ...
```

Use this schema:

```sql
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  git_commit TEXT,
  git_branch TEXT,
  working_tree_hash TEXT,
  actor TEXT,
  causation_id TEXT,
  correlation_id TEXT
);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT NOT NULL,
  supersedes_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS specs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  requirement_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  spec_id TEXT,
  decision_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  from_type TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  sha256 TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_sequence ON events(sequence);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
```

### Why these tables exist

The schema separates historical facts from current state.

`events` records what happened. It should be append-only.

The projection tables answer current-state questions:

- `requirements`: what the system needs to satisfy
- `decisions`: choices and rationale
- `specs`: expected behavior
- `solutions`: proposed or accepted implementation direction
- `tasks`: execution state
- `links`: relationships between entities
- `artifacts`: external files such as logs, reports, or generated outputs

This avoids hiding major project context inside opaque event payloads only. Requirements, decisions, specs, and solutions are first-class project state and should be queryable directly.

The event table still remains the source of truth. Projection tables are allowed to be rebuilt.

## Public Python Module Interface

Create `src/harness_state/__init__.py`.

Expose a `HarnessState` class.

The CLI should call this class. Tests should also call this class.

```python
class HarnessState:
    def init(self) -> None:
        ...

    def record_requirement(
        self,
        title: str,
        body: str = "",
        source: str | None = None,
    ) -> str:
        ...

    def record_decision(
        self,
        title: str,
        body: str,
        rationale: str = "",
    ) -> str:
        ...

    def record_spec(
        self,
        title: str,
        body: str,
        requirement_id: str | None = None,
    ) -> str:
        ...

    def propose_solution(
        self,
        title: str,
        body: str,
        spec_id: str | None = None,
    ) -> str:
        ...

    def create_task(
        self,
        title: str,
        body: str = "",
        priority: str | None = None,
    ) -> str:
        ...

    def change_task_status(self, task_id: str, status: str) -> None:
        ...

    def observe_workspace(self) -> str:
        ...

    def timeline(self, limit: int = 50) -> list[dict]:
        ...

    def show(self, entity_type: str, entity_id: str) -> dict:
        ...

    def export_markdown(self) -> None:
        ...

    def rebuild(self) -> None:
        ...
```

Keep this interface stable. Most implementation changes should happen behind it.

### Why expose `HarnessState`

The `HarnessState` class is the Python module interface behind the CLI seam.

It exists so:

- the CLI stays thin
- tests can exercise behavior without running subprocesses
- future integrations can call Python directly if needed
- storage complexity remains local to one implementation

The CLI should parse user input, call `HarnessState`, and print results. It should not know how to write SQL, generate IDs, append JSONL, or render Markdown.

This makes the module deeper: a small interface controls a large amount of behavior.

## Step-by-Step Implementation

### Step 1: Create Package Skeleton

Create:

```txt
modules/harness-state/pyproject.toml
modules/harness-state/README.md
modules/harness-state/src/harness_state/__init__.py
modules/harness-state/src/harness_state/__main__.py
modules/harness-state/src/harness_state/cli.py
```

`__main__.py`:

```python
from .cli import main

if __name__ == "__main__":
    main()
```

Initial `cli.py`:

```python
import argparse


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="harness-state")
    parser.add_argument("--version", action="version", version="harness-state 0.1.0")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    parser.parse_args(argv)
    return 0
```

Acceptance check:

```bash
cd modules/harness-state
uv sync
uv run harness-state --version
```

Expected:

```txt
harness-state 0.1.0
```

Why this step comes first:

Before implementing storage, prove the executable app shape works. If packaging is wrong, consumers cannot use the tool even if the internals work.

### Step 2: Add Path Configuration

Create `src/harness_state/config.py`.

Responsibilities:

- find repo root
- define `.harness` paths
- define `docs/context` paths

Implementation:

```python
from pathlib import Path


def find_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()

    for path in [current, *current.parents]:
        if (path / ".git").exists():
            return path

    return current


class HarnessPaths:
    def __init__(self, root: Path | None = None):
        self.root = root or find_repo_root()
        self.harness_dir = self.root / ".harness"
        self.db_path = self.harness_dir / "state.db"
        self.events_dir = self.harness_dir / "events"
        self.artifacts_dir = self.harness_dir / "artifacts"
        self.context_dir = self.root / "docs" / "context"

    def ensure_runtime_dirs(self) -> None:
        self.harness_dir.mkdir(parents=True, exist_ok=True)
        self.events_dir.mkdir(parents=True, exist_ok=True)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.context_dir.mkdir(parents=True, exist_ok=True)
```

Why this exists:

Path rules should live in one place. If every module computes `.harness`, `docs/context`, or the repo root separately, the implementation becomes fragile.

Central path configuration gives locality. If the runtime layout changes later, update `HarnessPaths` instead of hunting through the codebase.

### Step 3: Add Database Connection

Create `src/harness_state/db.py`.

Responsibilities:

- open SQLite connection
- use row dictionaries
- enable WAL
- enable foreign keys
- initialize schema

Implementation:

```python
import sqlite3
from pathlib import Path

from .schema import create_schema_sql


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    return conn


def initialize_database(conn: sqlite3.Connection) -> None:
    conn.executescript(create_schema_sql())
    conn.execute(
        "INSERT OR REPLACE INTO metadata(key, value) VALUES (?, ?)",
        ("schema_version", "1"),
    )
    conn.commit()
```

Why this exists:

SQLite setup details should not leak into event recording, projections, or CLI code.

`db.py` owns connection behavior:

- where the DB file lives
- row formatting
- WAL mode
- foreign key behavior
- schema initialization

WAL mode matters because local agents or scripts may read while another process writes. It does not make SQLite a distributed database, but it improves local read/write behavior.

### Step 4: Add ID Generation

Create `src/harness_state/ids.py`.

Implementation:

```python
import uuid


PREFIXES = {
    "requirement": "REQ",
    "decision": "DEC",
    "spec": "SPEC",
    "solution": "SOL",
    "task": "TASK",
    "artifact": "ART",
    "event": "EVT",
    "workspace": "WS",
}


def new_id(entity_type: str) -> str:
    prefix = PREFIXES.get(entity_type, entity_type.upper())
    short = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{short}"
```

Do not use SQLite auto-increment IDs for public IDs.

Why this exists:

Public entity IDs should survive rebuilds and exports.

If public IDs came from SQLite auto-increment rows, rebuilding from JSONL could accidentally change IDs or make external references unstable.

IDs like `REQ-1234ABCD` are better for humans, Markdown, JSONL, and future issue/PR references.

### Step 5: Add Git Context Capture

Create `src/harness_state/git_context.py`.

Implementation:

```python
import hashlib
import subprocess
from pathlib import Path


def run_git(root: Path, args: list[str]) -> str | None:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except FileNotFoundError:
        return None

    if result.returncode != 0:
        return None

    return result.stdout.strip()


def current_branch(root: Path) -> str | None:
    return run_git(root, ["branch", "--show-current"])


def current_commit(root: Path) -> str | None:
    return run_git(root, ["rev-parse", "HEAD"])


def working_tree_status(root: Path) -> str:
    return run_git(root, ["status", "--short"]) or ""


def working_tree_hash(root: Path) -> str:
    status = working_tree_status(root)
    return hashlib.sha256(status.encode("utf-8")).hexdigest()
```

Git failures should not crash normal usage.

Why this exists:

Project state without Git context is incomplete.

When an event is recorded, future readers need to know:

- which branch existed
- which commit was checked out
- whether the worktree was dirty
- which workspace state the decision or requirement came from

Git capture should be automatic because users and agents will forget to include it manually.

Git failures should not crash usage because the tool may be run outside git during tests or early experiments.

### Step 6: Add Projection Logic

Create `src/harness_state/projections.py`.

Responsibilities:

- apply one event to projection tables
- contain all direct writes to projection tables
- avoid creating new events

Skeleton:

```python
import json
import sqlite3


def event_payload(event: dict) -> dict:
    payload = event.get("payload")
    if payload is not None:
        return payload
    return json.loads(event["payload_json"])


def apply_event(conn: sqlite3.Connection, event: dict) -> None:
    event_type = event["event_type"]

    if event_type == "requirement.created":
        apply_requirement_created(conn, event)
    elif event_type == "decision.recorded":
        apply_decision_recorded(conn, event)
    elif event_type == "spec.created":
        apply_spec_created(conn, event)
    elif event_type == "solution.proposed":
        apply_solution_proposed(conn, event)
    elif event_type == "task.created":
        apply_task_created(conn, event)
    elif event_type == "task.status_changed":
        apply_task_status_changed(conn, event)
    elif event_type == "artifact.created":
        apply_artifact_created(conn, event)


def apply_requirement_created(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        """
        INSERT INTO requirements(id, title, body, status, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["entity_id"],
            payload["title"],
            payload.get("body", ""),
            payload.get("status", "active"),
            payload.get("source"),
            event["timestamp"],
            event["timestamp"],
        ),
    )
```

Implement the remaining projection functions using the same pattern.

Why this exists:

Projection logic is where historical events become current state.

Keeping projection updates in one module prevents direct writes from spreading across the implementation. That matters because if projections are written from many places, rebuild behavior will drift from normal write behavior.

The rule is:

```txt
normal write path applies events through projections
rebuild path applies events through the same projections
```

This ensures rebuild tests validate the actual state transition logic.

### Step 7: Add Event Recording

Create `src/harness_state/events.py`.

Responsibilities:

- assign event ID
- assign sequence
- assign timestamp
- attach Git context
- insert into SQLite
- apply projection
- append JSONL

Implementation outline:

```python
import json
import sqlite3
from datetime import datetime, timezone

from .git_context import current_branch, current_commit, working_tree_hash
from .ids import new_id
from .projections import apply_event


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def next_sequence(conn: sqlite3.Connection) -> int:
    row = conn.execute("SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM events").fetchone()
    return int(row["sequence"])


def event_journal_path(paths, timestamp: str):
    year_month = timestamp[:7]
    return paths.events_dir / f"{year_month}.jsonl"


def append_jsonl(paths, event: dict) -> None:
    paths.events_dir.mkdir(parents=True, exist_ok=True)
    path = event_journal_path(paths, event["timestamp"])
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(event, sort_keys=True) + "\n")


def record_event(
    conn: sqlite3.Connection,
    paths,
    event_type: str,
    entity_type: str,
    entity_id: str,
    payload: dict,
    actor: str = "local",
    causation_id: str | None = None,
    correlation_id: str | None = None,
) -> dict:
    timestamp = utc_now()
    event = {
        "id": new_id("event"),
        "sequence": next_sequence(conn),
        "timestamp": timestamp,
        "event_type": event_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "payload": payload,
        "git_commit": current_commit(paths.root),
        "git_branch": current_branch(paths.root),
        "working_tree_hash": working_tree_hash(paths.root),
        "actor": actor,
        "causation_id": causation_id,
        "correlation_id": correlation_id,
    }

    with conn:
        conn.execute(
            """
            INSERT INTO events(
              id, sequence, timestamp, event_type, entity_type, entity_id,
              payload_json, git_commit, git_branch, working_tree_hash,
              actor, causation_id, correlation_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event["id"],
                event["sequence"],
                event["timestamp"],
                event["event_type"],
                event["entity_type"],
                event["entity_id"],
                json.dumps(payload, sort_keys=True),
                event["git_commit"],
                event["git_branch"],
                event["working_tree_hash"],
                event["actor"],
                event["causation_id"],
                event["correlation_id"],
            ),
        )
        apply_event(conn, event)

    append_jsonl(paths, event)
    return event
```

Important v1 limitation: if SQLite commit succeeds and JSONL append fails, the DB and JSONL can diverge. For v1, raise the error clearly. For v2, add a repair command.

Why this exists:

`record_event` is the core state transition.

Every mutation should pass through this one function so the system consistently:

- creates an event ID
- assigns a sequence
- captures timestamp
- captures Git state
- writes the SQLite event
- updates projections
- appends JSONL

Without this function, each command would need to remember the full write protocol. That would produce shallow code: many call sites with repeated knowledge and inconsistent behavior.

One deep `record_event` function gives leverage and locality.

### Step 8: Implement `HarnessState`

Create or update `src/harness_state/__init__.py`.

Implementation outline:

```python
from pathlib import Path

from .config import HarnessPaths
from .db import connect, initialize_database
from .events import record_event
from .ids import new_id


class HarnessState:
    def __init__(self, root: Path | None = None):
        self.paths = HarnessPaths(root)

    def init(self) -> None:
        self.paths.ensure_runtime_dirs()
        conn = connect(self.paths.db_path)
        try:
            initialize_database(conn)
        finally:
            conn.close()

    def _conn(self):
        return connect(self.paths.db_path)

    def record_requirement(self, title: str, body: str = "", source: str | None = None) -> str:
        entity_id = new_id("requirement")
        conn = self._conn()
        try:
            record_event(
                conn=conn,
                paths=self.paths,
                event_type="requirement.created",
                entity_type="requirement",
                entity_id=entity_id,
                payload={
                    "title": title,
                    "body": body,
                    "source": source,
                    "status": "active",
                },
            )
            return entity_id
        finally:
            conn.close()
```

Then implement:

- `record_decision`
- `record_spec`
- `propose_solution`
- `create_task`
- `change_task_status`
- `observe_workspace`
- `timeline`
- `show`
- `export_markdown`
- `rebuild`

Why this exists:

`HarnessState` is the application-facing module. It converts useful domain operations like “record a decision” into lower-level event records.

Callers should not need to know that a decision is stored through:

- ID generation
- event creation
- projection update
- JSONL export
- Git context capture

They should call:

```python
state.record_decision(...)
```

The implementation handles the rest.

### Step 9: Implement CLI Commands

Create real subcommands in `src/harness_state/cli.py`.

Required commands:

```bash
harness-state init
harness-state requirement add "Title" --body "Body"
harness-state decision record "Title" --body "Body" --rationale "Rationale"
harness-state spec add "Title" --body "Body" --requirement REQ-...
harness-state solution propose "Title" --body "Body" --spec SPEC-...
harness-state task add "Title" --body "Body"
harness-state task status TASK-... done
harness-state workspace observe
harness-state timeline
harness-state show requirement REQ-...
harness-state export
harness-state rebuild
```

Rules:

- `cli.py` parses args.
- `cli.py` calls `HarnessState`.
- `cli.py` prints short human-readable output.
- `cli.py` must not contain SQL.
- `cli.py` must not directly write JSONL.
- `cli.py` must not directly render Markdown.

Example command output:

```txt
Created requirement REQ-1234ABCD
Recorded decision DEC-1234ABCD
Created spec SPEC-1234ABCD
Proposed solution SOL-1234ABCD
```

Why this exists:

The CLI is for consumers. It should be predictable, short, and scriptable.

Avoid printing giant JSON by default because humans will use this interactively. Structured export can come later behind a `--json` option.

The CLI should also avoid knowing implementation details. If `cli.py` starts writing SQL or files directly, the seam has moved to the wrong place and the module becomes shallow.

### Step 10: Implement `timeline`

Inside `HarnessState.timeline()`:

```sql
SELECT *
FROM events
ORDER BY sequence ASC
LIMIT ?
```

Return a list of dictionaries.

CLI display format:

```txt
0001 2026-06-23T10:30:00+00:00 requirement.created REQ-1234ABCD Capture project timeline
0002 2026-06-23T10:31:00+00:00 decision.recorded DEC-1234ABCD Use SQLite projection
```

The title should come from `payload_json.title` when available.

Why this exists:

The timeline is the main value of the harness. It lets future engineers and agents reconstruct what happened in order.

Sequence numbers are included because timestamps alone are not enough. Multiple events can happen inside the same second, and ordering must still be deterministic.

### Step 11: Implement `show`

Inside `HarnessState.show(entity_type, entity_id)` use a fixed table map:

```python
TABLES = {
    "requirement": "requirements",
    "decision": "decisions",
    "spec": "specs",
    "solution": "solutions",
    "task": "tasks",
}
```

Do not use arbitrary user input as a table name.

Query the matching table by ID.

If not found, raise a clear error.

Why this exists:

`show` is the simple current-state query path.

The fixed table map is important for safety. Never concatenate arbitrary user input into SQL table names.

This also keeps the interface small: users learn one `show` command instead of separate commands for every entity type.

### Step 12: Implement Markdown Rendering

Create `src/harness_state/render.py`.

Rendering functions should accept rows and return Markdown strings.

Example:

```python
def render_requirements(rows: list[dict]) -> str:
    lines = ["# Requirements", ""]

    for row in rows:
        lines.append(f"## {row['id']} — {row['title']}")
        lines.append("")
        lines.append(f"Status: `{row['status']}`")
        lines.append("")
        lines.append(row["body"] or "_No body provided._")
        lines.append("")

    return "\n".join(lines)
```

Create renderers for:

- requirements
- decisions
- specs
- solutions
- timeline
- current summary

Why this exists:

Markdown is for human review and git history.

Rendering belongs in a separate module because formatting will change more often than storage. Keeping render logic separate prevents Markdown details from leaking into event recording or projection logic.

### Step 13: Implement Export

Create `src/harness_state/export.py`.

Responsibilities:

- query projection tables
- query events
- call `render.py`
- write files to `docs/context`

Files to write:

```txt
docs/context/current.md
docs/context/timeline.md
docs/context/requirements.md
docs/context/decisions.md
docs/context/specs.md
docs/context/solutions.md
```

Acceptance check:

```bash
harness-state export
ls docs/context
```

Why this exists:

Export converts local state into shared project memory.

This is the bridge between local operational state and team-readable context. Agents can use SQLite locally, but humans should be able to review Markdown in normal git diffs.

### Step 14: Implement Rebuild

`harness-state rebuild` proves that the DB is not the source of truth.

Behavior:

1. Open the DB.
2. Drop all tables.
3. Recreate schema.
4. Read `.harness/events/*.jsonl` sorted by filename.
5. For each line:
   - parse JSON
   - insert the event into `events`
   - apply projection
6. Regenerate Markdown export.

Rules:

- Do not generate new event IDs during rebuild.
- Do not append events to JSONL during rebuild.
- Preserve original event sequence numbers.

Why this exists:

Rebuild is the design integrity check.

If rebuild works, the team knows:

- SQLite is not the only copy of important project state
- JSONL events are complete enough to restore current state
- projection logic is deterministic
- future machines or agents can reconstruct the same context

If rebuild does not work, the system is lying about SQLite being a projection. Treat rebuild as a required v1 feature, not an optional maintenance tool.

## Event Types for v1

Implement these first:

```txt
requirement.created
decision.recorded
spec.created
solution.proposed
task.created
task.status_changed
workspace.observed
artifact.created
```

Do not implement updates until v1 creation flow is reliable.

### Why keep v1 event types small

Creation flow proves the architecture.

Updates, superseding, acceptance, implementation tracking, and richer linking are useful, but they increase the number of state transitions. Add them only after the basic event-record-projection-export-rebuild loop is reliable.

The first milestone should validate the full vertical slice.

## Payload Shapes

### `requirement.created`

```json
{
  "title": "Capture project timeline",
  "body": "The harness must persist project context.",
  "source": "user",
  "status": "active"
}
```

### `decision.recorded`

```json
{
  "title": "Do not commit SQLite DB",
  "body": "Use SQLite as local projection only.",
  "rationale": "Binary DB files are hard to review and merge.",
  "status": "accepted"
}
```

### `spec.created`

```json
{
  "title": "State timeline CLI",
  "body": "Provide commands to record and inspect project context.",
  "requirement_id": "REQ-1234ABCD",
  "status": "draft"
}
```

### `solution.proposed`

```json
{
  "title": "Append-only event store with SQLite projections",
  "body": "Record every mutation as an event, then update query tables.",
  "spec_id": "SPEC-1234ABCD",
  "status": "proposed"
}
```

### `task.created`

```json
{
  "title": "Implement harness-state v1",
  "body": "Create installable CLI package.",
  "priority": "normal",
  "status": "open"
}
```

### `task.status_changed`

```json
{
  "status": "done"
}
```

### `workspace.observed`

```json
{
  "branch": "main",
  "commit": "abc123",
  "status": " M file.py\n?? new-file.py",
  "working_tree_hash": "..."
}
```

## Testing Requirements

Use `pytest`.

Tests should mostly call `HarnessState`, not shell out to the executable.

Add a small number of CLI smoke tests later.

### Test: init creates runtime files

```python
def test_init_creates_state_directories(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    assert (tmp_path / ".harness").exists()
    assert (tmp_path / ".harness" / "events").exists()
    assert (tmp_path / ".harness" / "artifacts").exists()
    assert (tmp_path / "docs" / "context").exists()
    assert (tmp_path / ".harness" / "state.db").exists()
```

### Test: requirement creates event and projection

```python
def test_requirement_add_creates_event_and_projection(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    req_id = state.record_requirement("Track project context", "Need durable state")

    row = state.show("requirement", req_id)
    assert row["title"] == "Track project context"
    assert row["status"] == "active"

    events = state.timeline()
    assert len(events) == 1
    assert events[0]["event_type"] == "requirement.created"
```

### Test: decision is persisted

```python
def test_decision_recorded(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    dec_id = state.record_decision(
        title="Use SQLite projection",
        body="SQLite is local state.",
        rationale="Do not commit binary DB to git.",
    )

    row = state.show("decision", dec_id)
    assert row["rationale"] == "Do not commit binary DB to git."
```

### Test: rebuild works

```python
def test_rebuild_from_jsonl(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    req_id = state.record_requirement("Requirement A")
    state.rebuild()

    row = state.show("requirement", req_id)
    assert row["title"] == "Requirement A"
```

### Test: export writes Markdown

```python
def test_export_writes_markdown(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    state.record_requirement("Requirement A")
    state.export_markdown()

    assert (tmp_path / "docs" / "context" / "requirements.md").exists()
```

## Definition of Done for v1

The following flow must work after installation:

```bash
cd modules/harness-state
uv sync

uv run harness-state init

uv run harness-state requirement add "Capture project timeline" \
  --body "The harness must persist requirements, decisions, specs, solutions, tasks, and verification history."

uv run harness-state decision record "Do not commit SQLite DB" \
  --body "Use SQLite as local projection only." \
  --rationale "Binary DB files are hard to review and merge."

uv run harness-state spec add "State timeline CLI" \
  --body "Provide commands to record and inspect project context."

uv run harness-state solution propose "Append-only event store with SQLite projections" \
  --body "Record every mutation as an event, then update query tables."

uv run harness-state task add "Implement harness-state v1"

uv run harness-state workspace observe

uv run harness-state timeline

uv run harness-state export

uv run harness-state rebuild
```

Expected result:

- `harness-state` is available as an executable command.
- `.harness/state.db` exists locally.
- `.harness/events/YYYY-MM.jsonl` exists.
- `docs/context/*.md` exists.
- `harness-state timeline` shows ordered events.
- `harness-state show requirement REQ-...` shows requirement details.
- `harness-state rebuild` restores projections from JSONL events.

## Junior Engineer Coding Rules

### Keep the CLI Thin

Allowed in `cli.py`:

- `argparse`
- call `HarnessState`
- print concise output

Not allowed in `cli.py`:

- SQL
- direct SQLite writes
- Git subprocess calls
- Markdown rendering
- JSONL writing

### Every Mutation Creates an Event

Correct:

```python
record_event("requirement.created", ...)
```

Incorrect:

```python
conn.execute("INSERT INTO requirements ...")
```

Only projection code writes directly to projection tables.

### Do Not Edit Old Events

Events are append-only.

If something changes, add a new event.

Future v2 examples:

```txt
requirement.updated
decision.superseded
solution.accepted
solution.implemented
```

### Keep Payloads Small

Do not store large logs in SQLite or JSONL.

Store large output under `.harness/artifacts/`, then reference the path and hash.

Good:

```json
{
  "artifact_path": ".harness/artifacts/runs/test-output.txt",
  "sha256": "..."
}
```

Bad:

```json
{
  "full_test_output": "500KB of logs..."
}
```

### Treat SQLite as Rebuildable

Projection tables and the local DB can be deleted and rebuilt.

The durable shared state is:

- JSONL event files
- Markdown context files

### Avoid Premature Adapters

Do not add abstract storage adapters in v1.

Use SQLite directly inside the implementation.

If a second real storage implementation appears later, then introduce a seam.

For now, one adapter would be hypothetical.

## V2 Ideas

Do not implement these in v1 unless explicitly requested:

- update commands
- decision superseding
- requirement-to-spec links
- solution acceptance
- command wrapper: `harness-state run -- pytest`
- artifact hashing helpers
- HTML timeline report
- GitHub issue integration
- PR/commit association
- multi-agent session IDs
- schema migrations
- repair command for DB/JSONL divergence
