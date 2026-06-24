import json
import sqlite3


def event_payload(event: dict) -> dict:
    payload = event.get("payload")
    if payload is not None:
        return payload
    return json.loads(event["payload_json"])


def apply_event(conn: sqlite3.Connection, event: dict) -> None:
    handler = _HANDLERS.get(event["event_type"])
    if handler is not None:
        handler(conn, event)


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


def apply_decision_recorded(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        """
        INSERT INTO decisions(
          id, title, body, rationale, status, supersedes_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["entity_id"],
            payload["title"],
            payload.get("body", ""),
            payload.get("rationale", ""),
            payload.get("status", "accepted"),
            payload.get("supersedes_id"),
            event["timestamp"],
            event["timestamp"],
        ),
    )


def apply_spec_created(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        """
        INSERT INTO specs(id, title, body, status, requirement_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["entity_id"],
            payload["title"],
            payload.get("body", ""),
            payload.get("status", "draft"),
            payload.get("requirement_id"),
            event["timestamp"],
            event["timestamp"],
        ),
    )


def apply_solution_proposed(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        """
        INSERT INTO solutions(
          id, title, body, status, spec_id, decision_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["entity_id"],
            payload["title"],
            payload.get("body", ""),
            payload.get("status", "proposed"),
            payload.get("spec_id"),
            payload.get("decision_id"),
            event["timestamp"],
            event["timestamp"],
        ),
    )


def apply_task_created(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        """
        INSERT INTO tasks(id, title, body, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["entity_id"],
            payload["title"],
            payload.get("body", ""),
            payload.get("status", "open"),
            payload.get("priority"),
            event["timestamp"],
            event["timestamp"],
        ),
    )


def apply_task_status_changed(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?",
        (payload["status"], event["timestamp"], event["entity_id"]),
    )


def apply_artifact_created(conn: sqlite3.Connection, event: dict) -> None:
    payload = event_payload(event)
    conn.execute(
        """
        INSERT INTO artifacts(id, kind, path, sha256, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            event["entity_id"],
            payload.get("kind", "file"),
            payload["path"],
            payload.get("sha256"),
            event["timestamp"],
        ),
    )


_HANDLERS = {
    "requirement.created": apply_requirement_created,
    "decision.recorded": apply_decision_recorded,
    "spec.created": apply_spec_created,
    "solution.proposed": apply_solution_proposed,
    "task.created": apply_task_created,
    "task.status_changed": apply_task_status_changed,
    "artifact.created": apply_artifact_created,
}
