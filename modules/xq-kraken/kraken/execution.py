"""Execution-scoped state for Kraken CLI workflows."""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import time
from collections.abc import Callable, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Any, Iterator, Literal, cast

from .matching import MISSING, resolve_json_pointer

DEFAULT_MAX_BYTES = 50 * 1024 * 1024
RESPONSE_TTL_SECONDS = 24 * 60 * 60
EXECUTION_TTL_SECONDS = 24 * 60 * 60
_SCHEMA_VERSION = 2
_ALIAS_PATTERN = re.compile(r"^@([sor])([1-9][0-9]*)$")


class ReferenceKind(StrEnum):
    OPERATION = "operation"
    RESPONSE = "response"


class ReferenceStatus(StrEnum):
    ACTIVE = "active"
    TOMBSTONE = "tombstone"
    EXPIRED = "expired"


class ExecutionError(RuntimeError):
    def __init__(self, kind: str, message: str, *, reference: str | None = None) -> None:
        super().__init__(f"{kind}: {message}")
        self.kind = kind
        self.reference = reference


@dataclass(frozen=True, slots=True)
class ScenarioSelection:
    ordinal: int

    @property
    def value(self) -> str:
        return f"@s{self.ordinal}"


@dataclass(frozen=True, slots=True)
class ParsedReference:
    kind: ReferenceKind
    ordinal: int

    @property
    def value(self) -> str:
        prefix = "o" if self.kind is ReferenceKind.OPERATION else "r"
        return f"@{prefix}{self.ordinal}"


ParsedAlias = ScenarioSelection | ParsedReference


@dataclass(frozen=True, slots=True)
class ExecutionFingerprint:
    config_hash: str
    spec_hashes: Mapping[str, str]

    def canonical_json(self) -> str:
        return _canonical_json(
            {"config_hash": self.config_hash, "spec_hashes": dict(sorted(self.spec_hashes.items()))}
        )


@dataclass(frozen=True, slots=True)
class ExecutionRecord:
    config_path: Path
    fingerprint: ExecutionFingerprint
    started_at: float
    last_active_at: float
    stale_after: float
    stale: bool = False


@dataclass(frozen=True, slots=True)
class ScenarioRecord:
    ref: str
    ordinal: int
    name: str | None
    status: Literal["open", "closed"]
    created_at: float
    closed_at: float | None = None


@dataclass(frozen=True, slots=True)
class ReferenceRecord:
    ref: str
    kind: ReferenceKind
    status: ReferenceStatus
    scenario_ref: str
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
    scenario: str
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


def parse_alias(value: str) -> ParsedAlias:
    match = _ALIAS_PATTERN.fullmatch(value)
    if match is None:
        raise ValueError(f"malformed_alias: {value!r}")
    ordinal = int(match.group(2))
    prefix = match.group(1)
    if prefix == "s":
        return ScenarioSelection(ordinal)
    return ParsedReference(
        kind=ReferenceKind.OPERATION if prefix == "o" else ReferenceKind.RESPONSE,
        ordinal=ordinal,
    )


def parse_reference(value: str) -> ParsedReference:
    parsed = parse_alias(value)
    if isinstance(parsed, ScenarioSelection):
        raise ValueError(f"malformed_alias: {value!r}")
    return parsed


def execution_store_path(config_path: str | os.PathLike[str]) -> Path:
    return Path(config_path).expanduser().resolve(strict=False).parent / ".kraken" / "execution.sqlite"


class ExecutionFingerprinter:
    @staticmethod
    def from_values(*, config: Any, specs: Mapping[str, Any]) -> ExecutionFingerprint:
        return ExecutionFingerprint(
            config_hash=_hash_json(config),
            spec_hashes={name: _hash_json(value) for name, value in sorted(specs.items())},
        )

    @staticmethod
    def from_files(
        config_path: str | os.PathLike[str],
        spec_paths: Mapping[str, str | os.PathLike[str]],
    ) -> ExecutionFingerprint:
        config = Path(config_path).read_bytes()
        specs = {name: Path(path).read_bytes() for name, path in sorted(spec_paths.items())}
        return ExecutionFingerprint(
            config_hash=hashlib.sha256(config).hexdigest(),
            spec_hashes={name: hashlib.sha256(value).hexdigest() for name, value in specs.items()},
        )


class ExecutionRuntime:
    def __init__(
        self,
        config_path: str | os.PathLike[str],
        *,
        clock: Callable[[], float] = time.time,
        max_bytes: int = DEFAULT_MAX_BYTES,
        busy_timeout: float = 5.0,
        ttl_seconds: float = EXECUTION_TTL_SECONDS,
    ) -> None:
        self.config_path = Path(config_path).expanduser().resolve(strict=False)
        self.store_path = execution_store_path(self.config_path)
        self._clock = clock
        self.max_bytes = max_bytes
        self.busy_timeout = busy_timeout
        self.ttl_seconds = ttl_seconds

    def start(self, fingerprint: ExecutionFingerprint) -> ActiveExecution:
        if self.store_path.exists():
            existing = self.active()
            if existing is not None and existing.record.stale_after <= self._now():
                raise ExecutionError("execution_stale", "execution state is stale; run cleanup")
            raise ExecutionError("execution_already_active", "an execution is already active")
        now = self._now()
        with self._connection(create=True) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "INSERT INTO execution "
                "(config_path, fingerprint_json, started_at, last_active_at, stale_after, stale) "
                "VALUES (?, ?, ?, ?, ?, 0)",
                (str(self.config_path), fingerprint.canonical_json(), now, now, now + self.ttl_seconds),
            )
            connection.commit()
        active = self.active(fingerprint)
        if active is None:
            raise ExecutionError("execution_required", "execution did not start")
        return active

    def active(self, fingerprint: ExecutionFingerprint | None = None) -> ActiveExecution | None:
        if not self.store_path.exists():
            return None
        with self._connection(create=False) as connection:
            row = connection.execute("SELECT * FROM execution LIMIT 1").fetchone()
            if row is None:
                raise ExecutionError("execution_store_corrupt", "active execution metadata is missing")
            record = _execution_record(row)
            if record.stale or record.stale_after <= self._now():
                raise ExecutionError("execution_stale", "execution state is stale; run cleanup")
            if fingerprint is not None and record.fingerprint != fingerprint:
                raise ExecutionError("execution_config_changed", "execution inputs changed during execution")
            connection.execute("BEGIN IMMEDIATE")
            now = self._now()
            connection.execute(
                "UPDATE execution SET last_active_at = ?, stale_after = ?",
                (now, now + self.ttl_seconds),
            )
            connection.commit()
            return ActiveExecution(self, record)

    def cleanup_stale(self) -> None:
        self.cleanup()

    def cleanup(self) -> None:
        try:
            self.store_path.unlink()
        except FileNotFoundError:
            pass

    def finish(self) -> None:
        self.cleanup()

    @contextmanager
    def _connection(self, *, create: bool) -> Iterator[sqlite3.Connection]:
        try:
            if create:
                self.store_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                os.chmod(self.store_path.parent, 0o700)
            connection = sqlite3.connect(self.store_path, timeout=self.busy_timeout, isolation_level=None)
            try:
                connection.row_factory = sqlite3.Row
                connection.execute("PRAGMA foreign_keys = ON")
                connection.execute("PRAGMA secure_delete = ON")
                self._initialize(connection)
                os.chmod(self.store_path, 0o600)
                yield connection
            finally:
                connection.close()
        except ExecutionError:
            raise
        except sqlite3.Error as error:
            message = str(error).lower()
            kind = "execution_store_busy" if "locked" in message or "busy" in message else "execution_store_corrupt"
            raise ExecutionError(kind, "execution store is busy" if kind.endswith("busy") else "execution store is corrupt") from error

    @staticmethod
    def _initialize(connection: sqlite3.Connection) -> None:
        version = int(connection.execute("PRAGMA user_version").fetchone()[0])
        if version > _SCHEMA_VERSION:
            raise ExecutionError("execution_store_corrupt", "unsupported execution store schema")
        if version == _SCHEMA_VERSION:
            return
        connection.execute("BEGIN IMMEDIATE")
        statements = (
            """CREATE TABLE IF NOT EXISTS execution (
                id INTEGER PRIMARY KEY CHECK(id = 1),
                config_path TEXT NOT NULL,
                fingerprint_json TEXT NOT NULL,
                started_at REAL NOT NULL,
                last_active_at REAL NOT NULL,
                stale_after REAL NOT NULL,
                stale INTEGER NOT NULL CHECK(stale IN (0, 1))
            )""",
            """CREATE TABLE IF NOT EXISTS counters (
                scenario_ordinal INTEGER NOT NULL CHECK(scenario_ordinal > 0)
            )""",
            """CREATE TABLE IF NOT EXISTS scenario_counters (
                scenario_ordinal INTEGER NOT NULL,
                kind TEXT NOT NULL,
                next_ordinal INTEGER NOT NULL CHECK(next_ordinal > 0),
                PRIMARY KEY(scenario_ordinal, kind)
            )""",
            """CREATE TABLE IF NOT EXISTS scenarios (
                ordinal INTEGER PRIMARY KEY,
                name TEXT,
                status TEXT NOT NULL CHECK(status IN ('open', 'closed')),
                created_at REAL NOT NULL,
                closed_at REAL
            )""",
            """CREATE TABLE IF NOT EXISTS operations (
                scenario_ordinal INTEGER NOT NULL,
                ordinal INTEGER NOT NULL,
                api TEXT NOT NULL,
                operation_id TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('active', 'tombstone')),
                created_at REAL NOT NULL,
                removed_reason TEXT,
                PRIMARY KEY(scenario_ordinal, ordinal)
            )""",
            """CREATE UNIQUE INDEX IF NOT EXISTS active_operation_identity
                ON operations(scenario_ordinal, api, operation_id) WHERE status = 'active'""",
            """CREATE TABLE IF NOT EXISTS responses (
                scenario_ordinal INTEGER NOT NULL,
                ordinal INTEGER NOT NULL,
                api TEXT NOT NULL,
                operation_id TEXT NOT NULL,
                status_code INTEGER NOT NULL CHECK(status_code BETWEEN 100 AND 599),
                operation_ref TEXT,
                status TEXT NOT NULL CHECK(status IN ('active', 'tombstone', 'expired')),
                data_json TEXT,
                byte_size INTEGER NOT NULL CHECK(byte_size >= 0),
                created_at REAL NOT NULL,
                expires_at REAL NOT NULL,
                removed_reason TEXT,
                PRIMARY KEY(scenario_ordinal, ordinal)
            )""",
        )
        try:
            for statement in statements:
                connection.execute(statement)
            connection.execute("INSERT INTO counters VALUES (1)")
            connection.execute(f"PRAGMA user_version = {_SCHEMA_VERSION}")
            connection.commit()
        except BaseException:
            if connection.in_transaction:
                connection.rollback()
            raise

    def _now(self) -> float:
        return float(self._clock())


class ActiveExecution:
    def __init__(self, runtime: ExecutionRuntime, record: ExecutionRecord) -> None:
        self._runtime = runtime
        self.record = record

    def open_scenario(self, name: str | None = None) -> ScenarioHandle:
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "UPDATE counters SET scenario_ordinal = scenario_ordinal + 1 RETURNING scenario_ordinal - 1"
            ).fetchone()
            if row is None:
                raise ExecutionError("execution_store_corrupt", "scenario counter is missing")
            ordinal = int(row[0])
            connection.execute(
                "INSERT INTO scenarios (ordinal, name, status, created_at) VALUES (?, ?, 'open', ?)",
                (ordinal, name, self._runtime._now()),
            )
            connection.execute("INSERT INTO scenario_counters VALUES (?, 'operation', 1)", (ordinal,))
            connection.execute("INSERT INTO scenario_counters VALUES (?, 'response', 1)", (ordinal,))
            connection.commit()
        return self.select(f"@s{ordinal}")

    def select(self, scenario: str | None = None) -> ScenarioHandle:
        if scenario is None:
            with self._runtime._connection(create=False) as connection:
                rows = connection.execute(
                    "SELECT * FROM scenarios WHERE status = 'open' ORDER BY ordinal"
                ).fetchall()
            if not rows:
                raise ExecutionError("scenario_required", "a scenario is required")
            if len(rows) > 1:
                raise ExecutionError("scenario_ambiguous", "multiple scenarios are open")
            return ScenarioHandle(self._runtime, _scenario_record(rows[0]))
        parsed = parse_alias(scenario)
        if not isinstance(parsed, ScenarioSelection):
            raise ValueError(f"malformed_alias: {scenario!r}")
        with self._runtime._connection(create=False) as connection:
            row = connection.execute("SELECT * FROM scenarios WHERE ordinal = ?", (parsed.ordinal,)).fetchone()
        if row is None:
            raise ExecutionError("unknown_scenario", f"scenario {scenario} does not exist")
        record = _scenario_record(row)
        if record.status != "open":
            raise ExecutionError("scenario_closed", f"scenario {scenario} is closed")
        return ScenarioHandle(self._runtime, record)

    def scenario_count(self) -> int:
        with self._runtime._connection(create=False) as connection:
            row = connection.execute("SELECT COUNT(*) FROM scenarios").fetchone()
        return int(row[0])

    def status(self) -> dict[str, Any]:
        with self._runtime._connection(create=False) as connection:
            rows = connection.execute("SELECT * FROM scenarios ORDER BY ordinal").fetchall()
        return {
            "config_path": str(self.record.config_path),
            "scenarios": [_scenario_payload(_scenario_record(row)) for row in rows],
        }

    def finish(self) -> None:
        self._runtime.finish()


class ScenarioHandle:
    def __init__(self, runtime: ExecutionRuntime, record: ScenarioRecord) -> None:
        self._runtime = runtime
        self.record = record

    @property
    def ref(self) -> str:
        return self.record.ref

    def close(self) -> None:
        self._ensure_open()
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "UPDATE scenarios SET status = 'closed', closed_at = ? WHERE ordinal = ?",
                (self._runtime._now(), self.record.ordinal),
            )
            connection.commit()
        self.record = ScenarioRecord(
            ref=self.record.ref,
            ordinal=self.record.ordinal,
            name=self.record.name,
            status="closed",
            created_at=self.record.created_at,
            closed_at=self._runtime._now(),
        )

    def bind_operation(self, summary: str, api: str, operation_id: str) -> str:
        del summary
        self._ensure_open()
        _require_identity(api, operation_id)
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute(
                "SELECT ordinal FROM operations WHERE scenario_ordinal = ? AND api = ? "
                "AND operation_id = ? AND status = 'active'",
                (self.record.ordinal, api, operation_id),
            ).fetchone()
            if existing is not None:
                connection.commit()
                return f"@o{int(existing['ordinal'])}"
            ordinal = _take_ordinal(connection, self.record.ordinal, ReferenceKind.OPERATION)
            connection.execute(
                "INSERT INTO operations VALUES (?, ?, ?, ?, 'active', ?, NULL)",
                (self.record.ordinal, ordinal, api, operation_id, self._runtime._now()),
            )
            connection.commit()
            return f"@o{ordinal}"

    def allocate_operation(self, api: str, operation_id: str) -> str:
        return self.bind_operation("", api, operation_id)

    def bind_response(
        self,
        summary: str,
        data: Any,
        *,
        status_code: int,
        operation_ref: str | None = None,
        api: str = "",
        operation_id: str = "",
    ) -> str:
        del summary
        allocation = self.allocate_response(api, operation_id, data, status_code=status_code, operation_ref=operation_ref)
        if allocation.ref is None:
            raise ExecutionError("response_too_large", "response snapshot is too large")
        return allocation.ref

    def allocate_response(
        self,
        api: str,
        operation_id: str,
        data: Any,
        *,
        status_code: int,
        operation_ref: str | None = None,
    ) -> ResponseAllocation:
        self._ensure_open()
        if not 100 <= status_code <= 599:
            raise ValueError("status_code must be between 100 and 599")
        if operation_ref is not None and parse_reference(operation_ref).kind is not ReferenceKind.OPERATION:
            raise ValueError("operation_ref must be an operation reference")
        data_json = _canonical_json(data)
        retained = _canonical_json(
            {"api": api, "data": data, "operation_id": operation_id, "status_code": status_code}
        )
        encoded_size = len(retained.encode("utf-8"))
        if encoded_size > self._runtime.max_bytes:
            return ResponseAllocation(None, False, "response_too_large", self._runtime.max_bytes)
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            _expire(connection, self.record.ordinal, self._runtime._now())
            current_size = _response_bytes(connection, self.record.ordinal)
            while current_size + encoded_size > self._runtime.max_bytes:
                oldest = connection.execute(
                    "SELECT ordinal, byte_size FROM responses WHERE scenario_ordinal = ? "
                    "AND status = 'active' ORDER BY created_at, ordinal LIMIT 1",
                    (self.record.ordinal,),
                ).fetchone()
                if oldest is None:
                    break
                connection.execute(
                    "UPDATE responses SET status = 'tombstone', removed_reason = 'evicted', "
                    "data_json = NULL, byte_size = 0 WHERE scenario_ordinal = ? AND ordinal = ?",
                    (self.record.ordinal, int(oldest["ordinal"])),
                )
                current_size -= int(oldest["byte_size"])
            ordinal = _take_ordinal(connection, self.record.ordinal, ReferenceKind.RESPONSE)
            connection.execute(
                "INSERT INTO responses VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, NULL)",
                (
                    self.record.ordinal,
                    ordinal,
                    api,
                    operation_id,
                    status_code,
                    operation_ref,
                    data_json,
                    encoded_size,
                    self._runtime._now(),
                    self._runtime._now() + RESPONSE_TTL_SECONDS,
                ),
            )
            connection.commit()
            return ResponseAllocation(f"@r{ordinal}", True, None, self._runtime.max_bytes)

    def resolve_operation(self, reference: str) -> ReferenceRecord:
        return self.resolve(reference, expected_kind=ReferenceKind.OPERATION)

    def resolve_response(self, reference: str, *, pointer: str | None = None) -> Any:
        record = self.resolve(reference, expected_kind=ReferenceKind.RESPONSE)
        if pointer is None:
            return record
        selected = resolve_json_pointer(cast(Any, record.data), pointer)
        if selected is MISSING:
            raise ExecutionError("invalid_reference_pointer", "response pointer does not exist", reference=reference)
        return selected

    def resolve(
        self,
        reference: str,
        *,
        expected_kind: ReferenceKind | str | None = None,
    ) -> ReferenceRecord:
        self._ensure_open()
        parsed = parse_reference(reference)
        if expected_kind is not None:
            expected = ReferenceKind(expected_kind)
            if parsed.kind is not expected:
                raise ExecutionError("reference_kind_mismatch", f"{reference} is not a {expected.value} reference", reference=reference)
        table = "operations" if parsed.kind is ReferenceKind.OPERATION else "responses"
        with self._runtime._connection(create=False) as connection:
            row = connection.execute(
                f"SELECT * FROM {table} WHERE scenario_ordinal = ? AND ordinal = ?",
                (self.record.ordinal, parsed.ordinal),
            ).fetchone()
            if row is None:
                raise ExecutionError("unknown_reference", f"reference {reference} does not exist", reference=reference)
            if parsed.kind is ReferenceKind.RESPONSE and str(row["status"]) == "active":
                expires_at = float(row["expires_at"])
                if expires_at <= self._runtime._now():
                    connection.execute("BEGIN IMMEDIATE")
                    connection.execute(
                        "UPDATE responses SET status = 'expired', removed_reason = 'expired', data_json = NULL, "
                        "byte_size = 0 WHERE scenario_ordinal = ? AND ordinal = ? AND status = 'active'",
                        (self.record.ordinal, parsed.ordinal),
                    )
                    connection.commit()
                    raise ExecutionError("expired_reference", f"reference {reference} has expired", reference=reference)
            status = ReferenceStatus(str(row["status"]))
            if status is not ReferenceStatus.ACTIVE:
                kind = "expired_reference" if status is ReferenceStatus.EXPIRED else "reference_target_removed"
                raise ExecutionError(kind, f"reference {reference} is no longer active", reference=reference)
            return _reference_record(parsed.kind, self.record.ref, row)

    def list(
        self,
        *,
        kind: ReferenceKind | str | None = None,
        include_tombstones: bool = True,
    ) -> list[ReferenceRecord]:
        self._ensure_open()
        selected = ReferenceKind(kind) if kind is not None else None
        with self._runtime._connection(create=False) as connection:
            _expire_in_transaction(connection, self.record.ordinal, self._runtime._now())
            records: list[ReferenceRecord] = []
            kinds = (selected,) if selected is not None else (ReferenceKind.OPERATION, ReferenceKind.RESPONSE)
            for record_kind in kinds:
                table = "operations" if record_kind is ReferenceKind.OPERATION else "responses"
                clause = "" if include_tombstones else " AND status = 'active'"
                rows = connection.execute(
                    f"SELECT * FROM {table} WHERE scenario_ordinal = ?{clause} ORDER BY ordinal",
                    (self.record.ordinal,),
                ).fetchall()
                records.extend(_reference_record(record_kind, self.record.ref, row) for row in rows)
            return records

    def status(self) -> ReferenceStoreStatus:
        self._ensure_open()
        with self._runtime._connection(create=False) as connection:
            _expire_in_transaction(connection, self.record.ordinal, self._runtime._now())
            return ReferenceStoreStatus(
                scenario=self.record.ref,
                active_operations=_count(connection, self.record.ordinal, "operations", "active"),
                active_responses=_count(connection, self.record.ordinal, "responses", "active"),
                tombstones=_count_not_active(connection, self.record.ordinal, "operations")
                + _count_not_active(connection, self.record.ordinal, "responses"),
                response_bytes=_response_bytes(connection, self.record.ordinal),
                max_bytes=self._runtime.max_bytes,
                next_operation=_peek_ordinal(connection, self.record.ordinal, ReferenceKind.OPERATION),
                next_response=_peek_ordinal(connection, self.record.ordinal, ReferenceKind.RESPONSE),
            )

    def gc(self) -> GcResult:
        self._ensure_open()
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            expired = _expire(connection, self.record.ordinal, self._runtime._now())
            bytes_used = _response_bytes(connection, self.record.ordinal)
            connection.commit()
            return GcResult(expired_responses=expired, response_bytes=bytes_used)

    def clear(self, *, kind: ReferenceKind | str | None = None) -> ClearResult:
        self._ensure_open()
        selected = ReferenceKind(kind) if kind is not None else None
        operations = 0
        responses = 0
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            if selected in (None, ReferenceKind.OPERATION):
                cursor = connection.execute(
                    "UPDATE operations SET status = 'tombstone', removed_reason = 'cleared' "
                    "WHERE scenario_ordinal = ? AND status = 'active'",
                    (self.record.ordinal,),
                )
                operations = cursor.rowcount
            if selected in (None, ReferenceKind.RESPONSE):
                cursor = connection.execute(
                    "UPDATE responses SET status = 'tombstone', removed_reason = 'cleared', data_json = NULL, "
                    "byte_size = 0 WHERE scenario_ordinal = ? AND status = 'active'",
                    (self.record.ordinal,),
                )
                responses = cursor.rowcount
            connection.commit()
        return ClearResult(operations=operations, responses=responses)

    def mark_operation_removed(self, reference: str, *, reason: str = "removed") -> ReferenceRecord:
        if reason not in {"removed", "disallowed"}:
            raise ValueError("operation tombstone reason must be removed or disallowed")
        record = self.resolve(reference, expected_kind=ReferenceKind.OPERATION)
        parsed = parse_reference(reference)
        with self._runtime._connection(create=False) as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "UPDATE operations SET status = 'tombstone', removed_reason = ? "
                "WHERE scenario_ordinal = ? AND ordinal = ? AND status = 'active'",
                (reason, self.record.ordinal, parsed.ordinal),
            )
            connection.commit()
        return ReferenceRecord(
            ref=record.ref,
            kind=record.kind,
            status=ReferenceStatus.TOMBSTONE,
            scenario_ref=record.scenario_ref,
            api=record.api,
            operation_id=record.operation_id,
            created_at=record.created_at,
            removed_reason=reason,
        )

    def _ensure_open(self) -> None:
        if self.record.status != "open":
            raise ExecutionError("scenario_closed", f"scenario {self.record.ref} is closed")
        with self._runtime._connection(create=False) as connection:
            row = connection.execute("SELECT status FROM scenarios WHERE ordinal = ?", (self.record.ordinal,)).fetchone()
        if row is None:
            raise ExecutionError("unknown_scenario", f"scenario {self.record.ref} does not exist")
        if str(row["status"]) != "open":
            raise ExecutionError("scenario_closed", f"scenario {self.record.ref} is closed")


def _execution_record(row: sqlite3.Row) -> ExecutionRecord:
    decoded = json.loads(str(row["fingerprint_json"]))
    return ExecutionRecord(
        config_path=Path(str(row["config_path"])),
        fingerprint=ExecutionFingerprint(
            config_hash=str(decoded["config_hash"]),
            spec_hashes={str(key): str(value) for key, value in dict(decoded["spec_hashes"]).items()},
        ),
        started_at=float(row["started_at"]),
        last_active_at=float(row["last_active_at"]),
        stale_after=float(row["stale_after"]),
        stale=bool(row["stale"]),
    )


def _scenario_record(row: sqlite3.Row) -> ScenarioRecord:
    ordinal = int(row["ordinal"])
    raw_name = row["name"]
    raw_closed = row["closed_at"]
    return ScenarioRecord(
        ref=f"@s{ordinal}",
        ordinal=ordinal,
        name=str(raw_name) if raw_name is not None else None,
        status=cast(Literal["open", "closed"], str(row["status"])),
        created_at=float(row["created_at"]),
        closed_at=float(raw_closed) if raw_closed is not None else None,
    )


def _scenario_payload(record: ScenarioRecord) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "ref": record.ref,
        "status": record.status,
    }
    if record.name is not None:
        payload["name"] = record.name
    return payload


def _reference_record(kind: ReferenceKind, scenario_ref: str, row: sqlite3.Row) -> ReferenceRecord:
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
        scenario_ref=scenario_ref,
        api=str(row["api"]),
        operation_id=str(row["operation_id"]),
        status_code=int(row["status_code"]) if kind is ReferenceKind.RESPONSE else None,
        data=data,
        operation_ref=operation_ref,
        created_at=float(row["created_at"]),
        expires_at=expires_at,
        removed_reason=str(raw_reason) if raw_reason is not None else None,
    )


def _take_ordinal(connection: sqlite3.Connection, scenario_ordinal: int, kind: ReferenceKind) -> int:
    row = connection.execute(
        "UPDATE scenario_counters SET next_ordinal = next_ordinal + 1 "
        "WHERE scenario_ordinal = ? AND kind = ? RETURNING next_ordinal - 1",
        (scenario_ordinal, kind.value),
    ).fetchone()
    if row is None:
        raise ExecutionError("execution_store_corrupt", "reference counter is missing")
    return int(row[0])


def _peek_ordinal(connection: sqlite3.Connection, scenario_ordinal: int, kind: ReferenceKind) -> int:
    row = connection.execute(
        "SELECT next_ordinal FROM scenario_counters WHERE scenario_ordinal = ? AND kind = ?",
        (scenario_ordinal, kind.value),
    ).fetchone()
    if row is None:
        raise ExecutionError("execution_store_corrupt", "reference counter is missing")
    return int(row[0])


def _expire(connection: sqlite3.Connection, scenario_ordinal: int, now: float) -> int:
    cursor = connection.execute(
        "UPDATE responses SET status = 'expired', removed_reason = 'expired', data_json = NULL, byte_size = 0 "
        "WHERE scenario_ordinal = ? AND status = 'active' AND expires_at <= ?",
        (scenario_ordinal, now),
    )
    return cursor.rowcount


def _expire_in_transaction(connection: sqlite3.Connection, scenario_ordinal: int, now: float) -> int:
    connection.execute("BEGIN IMMEDIATE")
    expired = _expire(connection, scenario_ordinal, now)
    connection.commit()
    return expired


def _response_bytes(connection: sqlite3.Connection, scenario_ordinal: int) -> int:
    row = connection.execute(
        "SELECT COALESCE(SUM(byte_size), 0) FROM responses WHERE scenario_ordinal = ? AND status = 'active'",
        (scenario_ordinal,),
    ).fetchone()
    return int(row[0])


def _count(connection: sqlite3.Connection, scenario_ordinal: int, table: str, status: str) -> int:
    row = connection.execute(
        f"SELECT COUNT(*) FROM {table} WHERE scenario_ordinal = ? AND status = ?",
        (scenario_ordinal, status),
    ).fetchone()
    return int(row[0])


def _count_not_active(connection: sqlite3.Connection, scenario_ordinal: int, table: str) -> int:
    row = connection.execute(
        f"SELECT COUNT(*) FROM {table} WHERE scenario_ordinal = ? AND status != 'active'",
        (scenario_ordinal,),
    ).fetchone()
    return int(row[0])


def _hash_json(value: Any) -> str:
    if isinstance(value, bytes):
        encoded = value
    else:
        encoded = _canonical_json(value).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


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
        raise ValueError("value must be canonical JSON") from error


def _require_identity(api: str, operation_id: str) -> None:
    if not api or not operation_id:
        raise ValueError("api and operation_id must not be empty")
