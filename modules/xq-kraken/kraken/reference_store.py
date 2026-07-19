"""Durable, context-bound operation and response references.

The store deliberately exposes records and lifecycle results rather than its
SQLite schema.  CLI orchestration can therefore inspect and recover state
without depending on persistence details.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import time
from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from pathlib import Path
from typing import Any, cast


DEFAULT_MAX_BYTES = 50 * 1024 * 1024
RESPONSE_TTL_SECONDS = 24 * 60 * 60
_SCHEMA_VERSION = 1
_REFERENCE_PATTERN = re.compile(r"^@([or])([1-9][0-9]*)$")


class ReferenceKind(StrEnum):
    OPERATION = "operation"
    RESPONSE = "response"


class ReferenceStatus(StrEnum):
    ACTIVE = "active"
    TOMBSTONE = "tombstone"
    EXPIRED = "expired"


@dataclass(frozen=True, slots=True)
class ParsedReference:
    kind: ReferenceKind
    ordinal: int

    @property
    def value(self) -> str:
        prefix = "o" if self.kind is ReferenceKind.OPERATION else "r"
        return f"@{prefix}{self.ordinal}"


@dataclass(frozen=True, slots=True)
class ReferenceRecord:
    ref: str
    kind: ReferenceKind
    status: ReferenceStatus
    context: str
    api: str
    operation_id: str
    status_code: int | None = None
    data: Any | None = None
    operation_ref: str | None = None
    created_at: float = 0
    expires_at: float | None = None
    removed_reason: str | None = None


@dataclass(frozen=True, slots=True)
class ResponseAllocation:
    ref: str | None
    persisted: bool
    reason: str | None
    max_bytes: int


@dataclass(frozen=True, slots=True)
class ReferenceStoreStatus:
    session: str
    context: str
    active_operations: int
    active_responses: int
    tombstones: int
    response_bytes: int
    max_bytes: int
    next_operation: int
    next_response: int


@dataclass(frozen=True, slots=True)
class GcResult:
    expired_responses: int
    response_bytes: int


@dataclass(frozen=True, slots=True)
class ClearResult:
    operations: int
    responses: int


class ReferenceStoreError(RuntimeError):
    """A stable reference failure suitable for mapping at the CLI boundary."""

    def __init__(self, kind: str, message: str, *, reference: str | None = None) -> None:
        super().__init__(f"{kind}: {message}")
        self.kind = kind
        self.reference = reference


def parse_reference(value: str) -> ParsedReference:
    match = _REFERENCE_PATTERN.fullmatch(value)
    if match is None:
        raise ValueError(f"malformed reference: {value!r}")
    kind = ReferenceKind.OPERATION if match.group(1) == "o" else ReferenceKind.RESPONSE
    return ParsedReference(kind=kind, ordinal=int(match.group(2)))


def canonical_context(
    config_path: str | os.PathLike[str],
    *,
    spec_override: str | os.PathLike[str] | None = None,
    base_url_override: str | None = None,
) -> str:
    """Return a stable identity for all inputs that affect reference meaning."""

    document = {
        "base_url_override": base_url_override,
        "config_path": str(Path(config_path).expanduser().resolve(strict=False)),
        "spec_override": (
            str(Path(spec_override).expanduser().resolve(strict=False))
            if spec_override is not None
            else None
        ),
    }
    encoded = _canonical_json(document).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def default_session_name(config_path: str | os.PathLike[str]) -> str:
    canonical_path = str(Path(config_path).expanduser().resolve(strict=False)).encode("utf-8")
    return f"config-{hashlib.sha256(canonical_path).hexdigest()[:24]}"


def reference_store_path(
    session: str,
    *,
    state_home: str | os.PathLike[str] | None = None,
    environ: Mapping[str, str] | None = None,
) -> Path:
    """Locate a session database without allowing session names to form paths."""

    if not session:
        raise ValueError("reference session must not be empty")
    environment = os.environ if environ is None else environ
    if state_home is None:
        configured = environment.get("XDG_STATE_HOME")
        root = Path(configured).expanduser() if configured else Path.home() / ".local" / "state"
    else:
        root = Path(state_home).expanduser()
    digest = hashlib.sha256(session.encode("utf-8")).hexdigest()
    return root / "kraken" / "references" / f"{digest}.sqlite3"


class ReferenceStore:
    """SQLite service for one named, canonical reference session."""

    def __init__(
        self,
        path: str | os.PathLike[str],
        session: str,
        context: str,
        *,
        clock: Callable[[], float | datetime] = time.time,
        max_bytes: int = DEFAULT_MAX_BYTES,
        busy_timeout: float = 5.0,
    ) -> None:
        if not session:
            raise ValueError("reference session must not be empty")
        if not context:
            raise ValueError("reference context must not be empty")
        if max_bytes < 0:
            raise ValueError("max_bytes must not be negative")
        if busy_timeout < 0:
            raise ValueError("busy_timeout must not be negative")
        self.path = Path(path)
        self.session = session
        self.context = context
        self._clock = clock
        self.max_bytes = max_bytes
        self.busy_timeout = busy_timeout

    def allocate_operation(self, api: str, operation_id: str) -> str:
        _require_identity(api, operation_id)
        now = self._now()
        with self._connection() as connection:
            try:
                connection.execute("BEGIN IMMEDIATE")
                existing = connection.execute(
                    "SELECT ordinal FROM operations WHERE context = ? AND api = ? "
                    "AND operation_id = ? AND status = 'active'",
                    (self.context, api, operation_id),
                ).fetchone()
                if existing is not None:
                    connection.commit()
                    return f"@o{int(existing['ordinal'])}"
                ordinal = self._take_ordinal(connection, ReferenceKind.OPERATION)
                connection.execute(
                    "INSERT INTO operations "
                    "(ordinal, context, api, operation_id, status, created_at) "
                    "VALUES (?, ?, ?, ?, 'active', ?)",
                    (ordinal, self.context, api, operation_id, now),
                )
                connection.commit()
                return f"@o{ordinal}"
            except BaseException:
                if connection.in_transaction:
                    connection.rollback()
                raise

    def allocate_response(
        self,
        api: str,
        operation_id: str,
        data: Any,
        *,
        status_code: int,
        operation_ref: str | None = None,
    ) -> ResponseAllocation:
        _require_identity(api, operation_id)
        if not 100 <= status_code <= 599:
            raise ValueError("status_code must be between 100 and 599")
        if operation_ref is not None and parse_reference(operation_ref).kind is not ReferenceKind.OPERATION:
            raise ValueError("operation_ref must be an operation reference")
        serialized = _canonical_json(data)
        retained_snapshot = _canonical_json(
            {
                "api": api,
                "data": data,
                "operation_id": operation_id,
                "status_code": status_code,
            }
        )
        encoded_size = len(retained_snapshot.encode("utf-8"))
        if encoded_size > self.max_bytes:
            # Do not open or mutate the store for an outcome that cannot be retained.
            return ResponseAllocation(None, False, "response_too_large", self.max_bytes)

        now = self._now()
        with self._connection() as connection:
            try:
                connection.execute("BEGIN IMMEDIATE")
                self._expire(connection, now)
                current_size = self._response_bytes(connection)
                while current_size + encoded_size > self.max_bytes:
                    oldest = connection.execute(
                        "SELECT ordinal, byte_size FROM responses "
                        "WHERE status = 'active' ORDER BY created_at, ordinal LIMIT 1"
                    ).fetchone()
                    if oldest is None:
                        break
                    connection.execute(
                        "UPDATE responses SET status = 'tombstone', removed_reason = 'evicted', "
                        "data_json = NULL, byte_size = 0 WHERE ordinal = ?",
                        (int(oldest["ordinal"]),),
                    )
                    current_size -= int(oldest["byte_size"])
                ordinal = self._take_ordinal(connection, ReferenceKind.RESPONSE)
                connection.execute(
                    "INSERT INTO responses "
                    "(ordinal, context, api, operation_id, status_code, operation_ref, status, data_json, "
                    "byte_size, created_at, expires_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)",
                    (
                        ordinal,
                        self.context,
                        api,
                        operation_id,
                        status_code,
                        operation_ref,
                        serialized,
                        encoded_size,
                        now,
                        now + RESPONSE_TTL_SECONDS,
                    ),
                )
                connection.commit()
                return ResponseAllocation(f"@r{ordinal}", True, None, self.max_bytes)
            except BaseException:
                if connection.in_transaction:
                    connection.rollback()
                raise

    def resolve(
        self,
        reference: str,
        *,
        expected_kind: ReferenceKind | str | None = None,
    ) -> ReferenceRecord:
        parsed = parse_reference(reference)
        if expected_kind is not None:
            expected = ReferenceKind(expected_kind)
            if parsed.kind is not expected:
                raise ReferenceStoreError(
                    "reference_kind_mismatch",
                    f"{reference} is not a {expected.value} reference",
                    reference=reference,
                )
        with self._connection() as connection:
            table = "operations" if parsed.kind is ReferenceKind.OPERATION else "responses"
            row = connection.execute(
                f"SELECT * FROM {table} WHERE ordinal = ?",  # noqa: S608 - fixed table names
                (parsed.ordinal,),
            ).fetchone()
            if row is None:
                raise ReferenceStoreError(
                    "unknown_reference", f"reference {reference} does not exist", reference=reference
                )
            if str(row["context"]) != self.context:
                raise ReferenceStoreError(
                    "reference_context_mismatch",
                    f"reference {reference} belongs to another configuration context",
                    reference=reference,
                )
            if parsed.kind is ReferenceKind.RESPONSE and str(row["status"]) == "active":
                expires_at = float(row["expires_at"])
                if expires_at <= self._now():
                    connection.execute("BEGIN IMMEDIATE")
                    connection.execute(
                        "UPDATE responses SET status = 'expired', removed_reason = 'expired', "
                        "data_json = NULL, byte_size = 0 "
                        "WHERE ordinal = ? AND status = 'active'",
                        (parsed.ordinal,),
                    )
                    connection.commit()
                    raise ReferenceStoreError(
                        "expired_reference", f"reference {reference} has expired", reference=reference
                    )
            status = ReferenceStatus(str(row["status"]))
            if status is not ReferenceStatus.ACTIVE:
                kind = "expired_reference" if status is ReferenceStatus.EXPIRED else "reference_target_removed"
                raise ReferenceStoreError(kind, f"reference {reference} is no longer active", reference=reference)
            return self._record(parsed.kind, row)

    def list(
        self,
        *,
        kind: ReferenceKind | str | None = None,
        include_tombstones: bool = True,
    ) -> list[ReferenceRecord]:
        selected = ReferenceKind(kind) if kind is not None else None
        with self._connection() as connection:
            self._expire_in_transaction(connection, self._now())
            records: list[ReferenceRecord] = []
            kinds = (selected,) if selected is not None else (ReferenceKind.OPERATION, ReferenceKind.RESPONSE)
            for record_kind in kinds:
                table = "operations" if record_kind is ReferenceKind.OPERATION else "responses"
                clause = "" if include_tombstones else " AND status = 'active'"
                rows = connection.execute(
                    f"SELECT * FROM {table} WHERE context = ?{clause} ORDER BY ordinal",  # noqa: S608
                    (self.context,),
                ).fetchall()
                records.extend(self._record(record_kind, row) for row in rows)
            return records

    def status(self) -> ReferenceStoreStatus:
        with self._connection() as connection:
            self._expire_in_transaction(connection, self._now())
            active_operations = self._count(connection, "operations", "active")
            active_responses = self._count(connection, "responses", "active")
            tombstones = (
                self._count_not_active(connection, "operations")
                + self._count_not_active(connection, "responses")
            )
            return ReferenceStoreStatus(
                session=self.session,
                context=self.context,
                active_operations=active_operations,
                active_responses=active_responses,
                tombstones=tombstones,
                response_bytes=self._response_bytes(connection),
                max_bytes=self.max_bytes,
                next_operation=self._peek_ordinal(connection, ReferenceKind.OPERATION),
                next_response=self._peek_ordinal(connection, ReferenceKind.RESPONSE),
            )

    def gc(self) -> GcResult:
        with self._connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            expired = self._expire(connection, self._now())
            response_bytes = self._response_bytes(connection)
            connection.commit()
            return GcResult(expired_responses=expired, response_bytes=response_bytes)

    def clear(self, *, kind: ReferenceKind | str | None = None) -> ClearResult:
        selected = ReferenceKind(kind) if kind is not None else None
        operations = 0
        responses = 0
        with self._connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            if selected in (None, ReferenceKind.OPERATION):
                cursor = connection.execute(
                    "UPDATE operations SET status = 'tombstone', removed_reason = 'cleared' "
                    "WHERE context = ? AND status = 'active'",
                    (self.context,),
                )
                operations = cursor.rowcount
            if selected in (None, ReferenceKind.RESPONSE):
                cursor = connection.execute(
                    "UPDATE responses SET status = 'tombstone', removed_reason = 'cleared', "
                    "data_json = NULL, byte_size = 0 WHERE context = ? AND status = 'active'",
                    (self.context,),
                )
                responses = cursor.rowcount
            connection.commit()
        return ClearResult(operations=operations, responses=responses)

    def mark_operation_removed(
        self,
        reference: str,
        *,
        reason: str = "removed",
    ) -> ReferenceRecord:
        parsed = parse_reference(reference)
        if parsed.kind is not ReferenceKind.OPERATION:
            raise ReferenceStoreError(
                "reference_kind_mismatch", f"{reference} is not an operation reference", reference=reference
            )
        if reason not in {"removed", "disallowed"}:
            raise ValueError("operation tombstone reason must be removed or disallowed")
        record = self.resolve(reference)
        with self._connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "UPDATE operations SET status = 'tombstone', removed_reason = ? "
                "WHERE ordinal = ? AND status = 'active'",
                (reason, parsed.ordinal),
            )
            connection.commit()
        return ReferenceRecord(
            ref=record.ref,
            kind=record.kind,
            status=ReferenceStatus.TOMBSTONE,
            context=record.context,
            api=record.api,
            operation_id=record.operation_id,
            created_at=record.created_at,
            removed_reason=reason,
        )

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            os.chmod(self.path.parent, 0o700)
            connection = sqlite3.connect(
                self.path,
                timeout=self.busy_timeout,
                isolation_level=None,
            )
            try:
                connection.row_factory = sqlite3.Row
                connection.execute("PRAGMA foreign_keys = ON")
                connection.execute("PRAGMA secure_delete = ON")
                self._initialize(connection)
                os.chmod(self.path, 0o600)
                if self._stored_session(connection) != self.session:
                    raise ReferenceStoreError(
                        "reference_context_mismatch",
                        "reference store belongs to another session",
                    )
                yield connection
            finally:
                connection.close()
        except ReferenceStoreError:
            raise
        except sqlite3.Error as error:
            message = str(error).lower()
            kind = (
                "reference_store_busy"
                if "locked" in message or "busy" in message
                else "reference_store_corrupt"
            )
            raise ReferenceStoreError(kind, "reference store is busy" if kind.endswith("busy") else "reference store is corrupt") from error

    def _initialize(self, connection: sqlite3.Connection) -> None:
        version = int(connection.execute("PRAGMA user_version").fetchone()[0])
        if version > _SCHEMA_VERSION:
            raise ReferenceStoreError("reference_store_corrupt", "unsupported reference store schema")
        if version == _SCHEMA_VERSION:
            return
        try:
            # Serializing the version check and migration avoids first-open schema
            # races across independent CLI processes without application retries.
            connection.execute("BEGIN IMMEDIATE")
            version = int(connection.execute("PRAGMA user_version").fetchone()[0])
            if version == _SCHEMA_VERSION:
                connection.commit()
                return
            if version > _SCHEMA_VERSION:
                raise ReferenceStoreError("reference_store_corrupt", "unsupported reference store schema")
            statements = (
                """CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )""",
                """CREATE TABLE IF NOT EXISTS counters (
                kind TEXT PRIMARY KEY,
                next_ordinal INTEGER NOT NULL CHECK(next_ordinal > 0)
            )""",
                """CREATE TABLE IF NOT EXISTS operations (
                ordinal INTEGER PRIMARY KEY,
                context TEXT NOT NULL,
                api TEXT NOT NULL,
                operation_id TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('active', 'tombstone')),
                created_at REAL NOT NULL,
                removed_reason TEXT
            )""",
                """CREATE UNIQUE INDEX IF NOT EXISTS active_operation_identity
                ON operations(context, api, operation_id) WHERE status = 'active'""",
                """CREATE TABLE IF NOT EXISTS responses (
                ordinal INTEGER PRIMARY KEY,
                context TEXT NOT NULL,
                api TEXT NOT NULL,
                operation_id TEXT NOT NULL,
                status_code INTEGER NOT NULL CHECK(status_code BETWEEN 100 AND 599),
                operation_ref TEXT,
                status TEXT NOT NULL CHECK(status IN ('active', 'tombstone', 'expired')),
                data_json TEXT,
                byte_size INTEGER NOT NULL CHECK(byte_size >= 0),
                created_at REAL NOT NULL,
                expires_at REAL NOT NULL,
                removed_reason TEXT
            )""",
            )
            for statement in statements:
                connection.execute(statement)
            connection.execute("INSERT OR IGNORE INTO counters VALUES ('operation', 1)")
            connection.execute("INSERT OR IGNORE INTO counters VALUES ('response', 1)")
            session_row = connection.execute("SELECT value FROM metadata WHERE key = 'session'").fetchone()
            if session_row is None:
                connection.execute("INSERT INTO metadata VALUES ('session', ?)", (self.session,))
            connection.execute(f"PRAGMA user_version = {_SCHEMA_VERSION}")
            connection.commit()
        except BaseException:
            if connection.in_transaction:
                connection.rollback()
            raise

    @staticmethod
    def _stored_session(connection: sqlite3.Connection) -> str:
        row = connection.execute("SELECT value FROM metadata WHERE key = 'session'").fetchone()
        if row is None:
            raise ReferenceStoreError("reference_store_corrupt", "reference store session is missing")
        return str(row["value"])

    def _now(self) -> float:
        value = self._clock()
        return value.timestamp() if isinstance(value, datetime) else float(value)

    @staticmethod
    def _take_ordinal(connection: sqlite3.Connection, kind: ReferenceKind) -> int:
        row = connection.execute(
            "UPDATE counters SET next_ordinal = next_ordinal + 1 WHERE kind = ? RETURNING next_ordinal - 1",
            (kind.value,),
        ).fetchone()
        if row is None:
            raise ReferenceStoreError("reference_store_corrupt", "reference counter is missing")
        return int(row[0])

    @staticmethod
    def _peek_ordinal(connection: sqlite3.Connection, kind: ReferenceKind) -> int:
        row = connection.execute("SELECT next_ordinal FROM counters WHERE kind = ?", (kind.value,)).fetchone()
        if row is None:
            raise ReferenceStoreError("reference_store_corrupt", "reference counter is missing")
        return int(row[0])

    @staticmethod
    def _expire(connection: sqlite3.Connection, now: float) -> int:
        cursor = connection.execute(
            "UPDATE responses SET status = 'expired', removed_reason = 'expired', "
            "data_json = NULL, byte_size = 0 WHERE status = 'active' AND expires_at <= ?",
            (now,),
        )
        return cursor.rowcount

    def _expire_in_transaction(self, connection: sqlite3.Connection, now: float) -> int:
        connection.execute("BEGIN IMMEDIATE")
        expired = self._expire(connection, now)
        connection.commit()
        return expired

    @staticmethod
    def _response_bytes(connection: sqlite3.Connection) -> int:
        row = connection.execute(
            "SELECT COALESCE(SUM(byte_size), 0) FROM responses WHERE status = 'active'"
        ).fetchone()
        return int(row[0])

    def _count(self, connection: sqlite3.Connection, table: str, status: str) -> int:
        row = connection.execute(
            f"SELECT COUNT(*) FROM {table} WHERE context = ? AND status = ?",  # noqa: S608
            (self.context, status),
        ).fetchone()
        return int(row[0])

    def _count_not_active(self, connection: sqlite3.Connection, table: str) -> int:
        row = connection.execute(
            f"SELECT COUNT(*) FROM {table} WHERE context = ? AND status != 'active'",  # noqa: S608
            (self.context,),
        ).fetchone()
        return int(row[0])

    @staticmethod
    def _record(kind: ReferenceKind, row: sqlite3.Row) -> ReferenceRecord:
        ordinal = int(row["ordinal"])
        prefix = "o" if kind is ReferenceKind.OPERATION else "r"
        data: Any | None = None
        operation_ref: str | None = None
        expires_at: float | None = None
        if kind is ReferenceKind.RESPONSE:
            serialized = cast(str | None, row["data_json"])
            data = json.loads(serialized) if serialized is not None else None
            raw_operation_ref = row["operation_ref"]
            operation_ref = str(raw_operation_ref) if raw_operation_ref is not None else None
            expires_at = float(row["expires_at"])
        raw_reason = row["removed_reason"]
        return ReferenceRecord(
            ref=f"@{prefix}{ordinal}",
            kind=kind,
            status=ReferenceStatus(str(row["status"])),
            context=str(row["context"]),
            api=str(row["api"]),
            operation_id=str(row["operation_id"]),
            status_code=int(row["status_code"]) if kind is ReferenceKind.RESPONSE else None,
            data=data,
            operation_ref=operation_ref,
            created_at=float(row["created_at"]),
            expires_at=expires_at,
            removed_reason=str(raw_reason) if raw_reason is not None else None,
        )


def _canonical_json(value: Any) -> str:
    try:
        return json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        )
    except (TypeError, ValueError) as error:
        raise ValueError("response data must be canonical JSON") from error


def _require_identity(api: str, operation_id: str) -> None:
    if not api or not operation_id:
        raise ValueError("api and operation_id must not be empty")
