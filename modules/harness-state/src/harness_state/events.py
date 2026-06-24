import json
import sqlite3
from datetime import datetime, timezone

from .config import HarnessPaths
from .git_context import current_branch, current_commit, working_tree_hash
from .ids import new_id
from .projections import apply_event

_INSERT_EVENT_SQL = """
INSERT INTO events(
  id, sequence, timestamp, event_type, entity_type, entity_id,
  payload_json, git_commit, git_branch, working_tree_hash,
  actor, causation_id, correlation_id
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def next_sequence(conn: sqlite3.Connection) -> int:
    row = conn.execute(
        "SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM events"
    ).fetchone()
    return int(row["sequence"])


def event_journal_path(paths: HarnessPaths, timestamp: str):
    year_month = timestamp[:7]
    return paths.events_dir / f"{year_month}.jsonl"


def append_jsonl(paths: HarnessPaths, event: dict) -> None:
    paths.events_dir.mkdir(parents=True, exist_ok=True)
    path = event_journal_path(paths, event["timestamp"])
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(event, sort_keys=True) + "\n")


def _event_insert_params(event: dict) -> tuple:
    payload_json = event.get("payload_json")
    if payload_json is None:
        payload_json = json.dumps(event.get("payload", {}), sort_keys=True)
    return (
        event["id"],
        event["sequence"],
        event["timestamp"],
        event["event_type"],
        event["entity_type"],
        event["entity_id"],
        payload_json,
        event.get("git_commit"),
        event.get("git_branch"),
        event.get("working_tree_hash"),
        event.get("actor"),
        event.get("causation_id"),
        event.get("correlation_id"),
    )


def insert_event_row(conn: sqlite3.Connection, event: dict) -> None:
    """Insert a fully-formed event into the events table without side effects.

    Used by the rebuild path, which must preserve original IDs, sequences, and
    timestamps and must not append to the JSONL journal.
    """
    conn.execute(_INSERT_EVENT_SQL, _event_insert_params(event))


def record_event(
    conn: sqlite3.Connection,
    paths: HarnessPaths,
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
        insert_event_row(conn, event)
        apply_event(conn, event)

    append_jsonl(paths, event)
    return event
