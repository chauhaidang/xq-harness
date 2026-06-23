import json
import sqlite3

from .config import HarnessPaths
from . import render


def _rows(conn: sqlite3.Connection, sql: str) -> list[dict]:
    return [dict(row) for row in conn.execute(sql).fetchall()]


def _count(conn: sqlite3.Connection, table: str) -> int:
    row = conn.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()
    return int(row["n"])


def _timeline_events(conn: sqlite3.Connection) -> list[dict]:
    events = _rows(conn, "SELECT * FROM events ORDER BY sequence ASC")
    for event in events:
        try:
            payload = json.loads(event["payload_json"])
        except (json.JSONDecodeError, TypeError):
            payload = {}
        event["title"] = payload.get("title", "")
    return events


def export_markdown(conn: sqlite3.Connection, paths: HarnessPaths) -> None:
    paths.context_dir.mkdir(parents=True, exist_ok=True)

    requirements = _rows(conn, "SELECT * FROM requirements ORDER BY created_at ASC")
    decisions = _rows(conn, "SELECT * FROM decisions ORDER BY created_at ASC")
    specs = _rows(conn, "SELECT * FROM specs ORDER BY created_at ASC")
    solutions = _rows(conn, "SELECT * FROM solutions ORDER BY created_at ASC")
    events = _timeline_events(conn)

    summary = {
        "requirements": len(requirements),
        "decisions": len(decisions),
        "specs": len(specs),
        "solutions": len(solutions),
        "tasks": _count(conn, "tasks"),
        "events": len(events),
    }

    outputs = {
        "current.md": render.render_current(summary),
        "timeline.md": render.render_timeline(events),
        "requirements.md": render.render_requirements(requirements),
        "decisions.md": render.render_decisions(decisions),
        "specs.md": render.render_specs(specs),
        "solutions.md": render.render_solutions(solutions),
    }

    for filename, content in outputs.items():
        (paths.context_dir / filename).write_text(content, encoding="utf-8")
