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
