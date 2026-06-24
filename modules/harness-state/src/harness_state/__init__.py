import json
import sqlite3
from pathlib import Path

from .config import HarnessPaths
from .db import connect, initialize_database
from .errors import (
    EntityNotFoundError,
    HarnessStateError,
    NotInitializedError,
    UnknownEntityTypeError,
)
from .events import insert_event_row, record_event
from .export import export_markdown
from .git_context import current_branch, current_commit, working_tree_hash, working_tree_status
from .ids import new_id
from .projections import apply_event
from .schema import PROJECTION_TABLES, create_schema_sql

__all__ = [
    "HarnessState",
    "HarnessStateError",
    "NotInitializedError",
    "EntityNotFoundError",
    "UnknownEntityTypeError",
]

# Map a user-facing entity type to its projection table. Used by `show`.
# Never interpolate raw user input into SQL table names.
_SHOW_TABLES = {
    "requirement": "requirements",
    "decision": "decisions",
    "spec": "specs",
    "solution": "solutions",
    "task": "tasks",
}


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

    def _conn(self) -> sqlite3.Connection:
        if not self.paths.db_path.exists():
            raise NotInitializedError(
                "harness-state is not initialized in this repo. Run `harness-state init` first."
            )
        return connect(self.paths.db_path)

    def record_requirement(
        self, title: str, body: str = "", source: str | None = None
    ) -> str:
        entity_id = new_id("requirement")
        self._record(
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

    def record_decision(self, title: str, body: str, rationale: str = "") -> str:
        entity_id = new_id("decision")
        self._record(
            event_type="decision.recorded",
            entity_type="decision",
            entity_id=entity_id,
            payload={
                "title": title,
                "body": body,
                "rationale": rationale,
                "status": "accepted",
            },
        )
        return entity_id

    def record_spec(
        self, title: str, body: str, requirement_id: str | None = None
    ) -> str:
        entity_id = new_id("spec")
        self._record(
            event_type="spec.created",
            entity_type="spec",
            entity_id=entity_id,
            payload={
                "title": title,
                "body": body,
                "requirement_id": requirement_id,
                "status": "draft",
            },
        )
        return entity_id

    def propose_solution(
        self, title: str, body: str, spec_id: str | None = None
    ) -> str:
        entity_id = new_id("solution")
        self._record(
            event_type="solution.proposed",
            entity_type="solution",
            entity_id=entity_id,
            payload={
                "title": title,
                "body": body,
                "spec_id": spec_id,
                "status": "proposed",
            },
        )
        return entity_id

    def create_task(
        self, title: str, body: str = "", priority: str | None = None
    ) -> str:
        entity_id = new_id("task")
        self._record(
            event_type="task.created",
            entity_type="task",
            entity_id=entity_id,
            payload={
                "title": title,
                "body": body,
                "priority": priority,
                "status": "open",
            },
        )
        return entity_id

    def change_task_status(self, task_id: str, status: str) -> None:
        conn = self._conn()
        try:
            row = conn.execute(
                "SELECT id FROM tasks WHERE id = ?", (task_id,)
            ).fetchone()
            if row is None:
                raise EntityNotFoundError(f"No task found with id {task_id}")
            record_event(
                conn=conn,
                paths=self.paths,
                event_type="task.status_changed",
                entity_type="task",
                entity_id=task_id,
                payload={"status": status},
            )
        finally:
            conn.close()

    def observe_workspace(self) -> str:
        entity_id = new_id("workspace")
        root = self.paths.root
        self._record(
            event_type="workspace.observed",
            entity_type="workspace",
            entity_id=entity_id,
            payload={
                "branch": current_branch(root),
                "commit": current_commit(root),
                "status": working_tree_status(root),
                "working_tree_hash": working_tree_hash(root),
            },
        )
        return entity_id

    def timeline(self, limit: int = 50) -> list[dict]:
        conn = self._conn()
        try:
            rows = conn.execute(
                "SELECT * FROM events ORDER BY sequence ASC LIMIT ?", (limit,)
            ).fetchall()
            events = []
            for row in rows:
                event = dict(row)
                try:
                    payload = json.loads(event["payload_json"])
                except (json.JSONDecodeError, TypeError):
                    payload = {}
                event["title"] = payload.get("title", "")
                events.append(event)
            return events
        finally:
            conn.close()

    def show(self, entity_type: str, entity_id: str) -> dict:
        table = _SHOW_TABLES.get(entity_type)
        if table is None:
            raise UnknownEntityTypeError(
                f"Unknown entity type '{entity_type}'. "
                f"Expected one of: {', '.join(sorted(_SHOW_TABLES))}."
            )
        conn = self._conn()
        try:
            row = conn.execute(
                f"SELECT * FROM {table} WHERE id = ?", (entity_id,)
            ).fetchone()
            if row is None:
                raise EntityNotFoundError(
                    f"No {entity_type} found with id {entity_id}"
                )
            return dict(row)
        finally:
            conn.close()

    def export_markdown(self) -> None:
        self.paths.ensure_runtime_dirs()
        conn = self._conn()
        try:
            export_markdown(conn, self.paths)
        finally:
            conn.close()

    def rebuild(self) -> None:
        conn = self._conn()
        try:
            with conn:
                for table in PROJECTION_TABLES:
                    conn.execute(f"DROP TABLE IF EXISTS {table}")
                conn.execute("DROP TABLE IF EXISTS events")
                conn.executescript(create_schema_sql())

                for event in self._read_journal_events():
                    insert_event_row(conn, event)
                    apply_event(conn, event)
            export_markdown(conn, self.paths)
        finally:
            conn.close()

    def _record(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        payload: dict,
    ) -> None:
        conn = self._conn()
        try:
            record_event(
                conn=conn,
                paths=self.paths,
                event_type=event_type,
                entity_type=entity_type,
                entity_id=entity_id,
                payload=payload,
            )
        finally:
            conn.close()

    def _read_journal_events(self):
        events: list[dict] = []
        for journal in sorted(self.paths.events_dir.glob("*.jsonl")):
            with journal.open("r", encoding="utf-8") as file:
                for line in file:
                    line = line.strip()
                    if not line:
                        continue
                    events.append(json.loads(line))
        events.sort(key=lambda event: event["sequence"])
        return events
