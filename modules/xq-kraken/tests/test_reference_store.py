from __future__ import annotations

import os
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
from typing import cast

from kraken.reference_store import (
    ReferenceKind,
    ReferenceStatus,
    ReferenceStore,
    ReferenceStoreError,
    canonical_context,
    default_session_name,
    parse_reference,
    reference_store_path,
)


class MutableClock:
    def __init__(self, now: float = 1_000.0) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


class ReferenceStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.path = self.root / "state" / "references.sqlite3"
        self.clock = MutableClock()
        self.context = canonical_context(self.root / "kraken.yaml")

    def store(
        self,
        *,
        context: str | None = None,
        max_bytes: int = 50 * 1024 * 1024,
        busy_timeout: float = 1.0,
    ) -> ReferenceStore:
        return ReferenceStore(
            self.path,
            session="agent one",
            context=context or self.context,
            clock=self.clock,
            max_bytes=max_bytes,
            busy_timeout=busy_timeout,
        )

    def test_helpers_canonicalize_context_locate_user_state_and_parse_typed_refs(self) -> None:
        config = self.root / "project" / ".." / "kraken.yaml"
        context = canonical_context(config, spec_override=self.root / "api.json", base_url_override="https://example.test/")

        self.assertEqual(context, canonical_context(self.root / "kraken.yaml", spec_override=self.root / "api.json", base_url_override="https://example.test/"))
        self.assertEqual(default_session_name(config), default_session_name(self.root / "kraken.yaml"))
        path = reference_store_path("work / 一", state_home=self.root / "xdg")
        self.assertEqual(path.parent.parent, self.root / "xdg" / "kraken")
        self.assertEqual(path.suffix, ".sqlite3")
        parsed = parse_reference("@r42")
        self.assertEqual((parsed.kind, parsed.ordinal), (ReferenceKind.RESPONSE, 42))
        with self.assertRaises(ValueError):
            parse_reference("@r0")
        with self.assertRaises(ValueError):
            parse_reference("operation")

    def test_operation_allocation_is_deduplicated_monotonic_and_persistent(self) -> None:
        first = self.store().allocate_operation("widgets", "getWidget")
        duplicate = self.store().allocate_operation("widgets", "getWidget")
        second = self.store().allocate_operation("widgets", "createWidget")

        self.assertEqual((first, duplicate, second), ("@o1", "@o1", "@o2"))
        resolved = self.store().resolve(first)
        self.assertEqual(resolved.ref, "@o1")
        self.assertEqual(resolved.kind, ReferenceKind.OPERATION)
        self.assertEqual(resolved.status, ReferenceStatus.ACTIVE)
        self.assertEqual(resolved.context, self.context)
        self.assertEqual((resolved.api, resolved.operation_id), ("widgets", "getWidget"))

        self.store().clear()
        third = self.store().allocate_operation("widgets", "getWidget")
        self.assertEqual(third, "@o3")
        with self.assertRaisesRegex(ReferenceStoreError, "reference_target_removed"):
            self.store().resolve("@o1")

    def test_concurrent_operation_allocation_converges_on_one_binding(self) -> None:
        barrier = threading.Barrier(9)
        results: list[str] = []
        failures: list[BaseException] = []

        def allocate() -> None:
            try:
                barrier.wait()
                results.append(self.store().allocate_operation("widgets", "getWidget"))
            except BaseException as error:
                failures.append(error)

        threads = [threading.Thread(target=allocate) for _ in range(8)]
        for thread in threads:
            thread.start()
        barrier.wait()
        for thread in threads:
            thread.join()

        self.assertEqual(failures, [])
        self.assertEqual(results, ["@o1"] * 8)
        self.assertEqual(self.store().allocate_operation("widgets", "next"), "@o2")

    def test_concurrent_response_allocation_creates_immutable_unique_snapshots(self) -> None:
        barrier = threading.Barrier(7)
        results: list[str | None] = []
        failures: list[BaseException] = []

        def allocate(index: int) -> None:
            try:
                barrier.wait()
                results.append(
                    self.store().allocate_response(
                        "widgets", "getWidget", {"id": index}, status_code=200
                    ).ref
                )
            except BaseException as error:
                failures.append(error)

        threads = [threading.Thread(target=allocate, args=(index,)) for index in range(6)]
        for thread in threads:
            thread.start()
        barrier.wait()
        for thread in threads:
            thread.join()

        self.assertEqual(failures, [])
        self.assertEqual(set(results), {"@r1", "@r2", "@r3", "@r4", "@r5", "@r6"})
        snapshots = []
        for reference in results:
            if reference is None:
                continue
            data = self.store().resolve(reference).data
            self.assertIsInstance(data, dict)
            snapshots.append(cast(dict[str, int], data)["id"])
        self.assertEqual(
            set(snapshots),
            set(range(6)),
        )

    def test_resolve_classifies_kind_context_unknown_and_removed(self) -> None:
        operation = self.store().allocate_operation("widgets", "getWidget")
        response = self.store().allocate_response(
            "widgets", "getWidget", {"id": 7}, status_code=200, operation_ref=operation
        )
        self.assertEqual(response.ref, "@r1")

        with self.assertRaises(ReferenceStoreError) as wrong_kind:
            self.store().resolve(response.ref or "", expected_kind=ReferenceKind.OPERATION)
        self.assertEqual(wrong_kind.exception.kind, "reference_kind_mismatch")
        with self.assertRaises(ReferenceStoreError) as unknown:
            self.store().resolve("@o999")
        self.assertEqual(unknown.exception.kind, "unknown_reference")
        with self.assertRaises(ReferenceStoreError) as wrong_context:
            self.store(context=canonical_context(self.root / "other.yaml")).resolve(operation)
        self.assertEqual(wrong_context.exception.kind, "reference_context_mismatch")

        self.store().mark_operation_removed(operation)
        with self.assertRaises(ReferenceStoreError) as removed:
            self.store().resolve(operation)
        self.assertEqual(removed.exception.kind, "reference_target_removed")

    def test_one_session_allocates_monotonically_across_contexts_without_cross_resolution(self) -> None:
        first = self.store().allocate_operation("widgets", "getWidget")
        other = self.store(context=canonical_context(self.root / "other.yaml"))

        second = other.allocate_operation("widgets", "getWidget")

        self.assertEqual((first, second), ("@o1", "@o2"))
        self.assertEqual(other.allocate_operation("widgets", "getWidget"), "@o2")
        with self.assertRaises(ReferenceStoreError) as mismatch:
            other.resolve(first)
        self.assertEqual(mismatch.exception.kind, "reference_context_mismatch")

    def test_response_snapshots_are_immutable_expire_and_gc_to_tombstones(self) -> None:
        data = {"items": [1, 2]}
        allocation = self.store().allocate_response("widgets", "listWidgets", data, status_code=200)
        data["items"].append(3)

        self.assertTrue(allocation.persisted)
        self.assertIsNone(allocation.reason)
        self.assertEqual(allocation.max_bytes, 50 * 1024 * 1024)
        resolved = self.store().resolve("@r1")
        self.assertEqual((resolved.status_code, resolved.data), (200, {"items": [1, 2]}))

        self.clock.now += 24 * 60 * 60
        with self.assertRaises(ReferenceStoreError) as expired:
            self.store().resolve("@r1")
        self.assertEqual(expired.exception.kind, "expired_reference")
        self.assertEqual(self.store().gc().expired_responses, 0)
        listed = self.store().list(kind=ReferenceKind.RESPONSE)
        self.assertEqual((listed[0].ref, listed[0].status), ("@r1", ReferenceStatus.EXPIRED))

    def test_response_budget_evicts_expired_then_oldest_and_rejects_oversized(self) -> None:
        # Canonical retained snapshots are 68, 68, and 70 bytes respectively;
        # the quota accounts for identity and status as well as response data.
        store = self.store(max_bytes=138)
        self.assertEqual(store.allocate_response("a", "one", "12345678", status_code=200).ref, "@r1")
        self.clock.now += 1
        self.assertEqual(store.allocate_response("a", "two", "abcdefgh", status_code=200).ref, "@r2")
        self.clock.now += 1
        self.assertEqual(store.allocate_response("a", "three", "ABCDEFGH", status_code=200).ref, "@r3")

        with self.assertRaises(ReferenceStoreError) as evicted:
            store.resolve("@r1")
        self.assertEqual(evicted.exception.kind, "reference_target_removed")
        self.assertEqual(store.resolve("@r2").data, "abcdefgh")

        too_large = store.allocate_response("a", "huge", "x" * 89, status_code=200)
        self.assertEqual(
            (too_large.ref, too_large.persisted, too_large.reason, too_large.max_bytes),
            (None, False, "response_too_large", 138),
        )
        self.assertEqual(store.status().response_bytes, 138)

    def test_response_budget_removes_expired_data_before_live_data(self) -> None:
        store = self.store(max_bytes=138)
        store.allocate_response("a", "old", "12345678", status_code=200)
        self.clock.now += 23 * 60 * 60
        store.allocate_response("a", "live", "abcdefgh", status_code=200)
        self.clock.now += 60 * 60

        allocation = store.allocate_response("a", "new", "ABCDEFGH", status_code=200)

        self.assertEqual(allocation.ref, "@r3")
        with self.assertRaises(ReferenceStoreError) as expired:
            store.resolve("@r1")
        self.assertEqual(expired.exception.kind, "expired_reference")
        self.assertEqual(store.resolve("@r2").data, "abcdefgh")

    def test_list_status_clear_and_permissions_are_publicly_observable(self) -> None:
        self.store().allocate_operation("widgets", "getWidget")
        self.store().allocate_response(
            "widgets", "getWidget", {"id": 1}, status_code=200, operation_ref="@o1"
        )

        status = self.store().status()
        self.assertEqual((status.active_operations, status.active_responses, status.next_operation, status.next_response), (1, 1, 2, 2))
        self.assertEqual([record.ref for record in self.store().list()], ["@o1", "@r1"])
        cleared = self.store().clear(kind=ReferenceKind.RESPONSE)
        self.assertEqual((cleared.operations, cleared.responses), (0, 1))
        self.assertEqual(self.store().resolve("@o1").operation_id, "getWidget")
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.path.parent.stat().st_mode & 0o777, 0o700)

        raw = self.path.read_bytes()
        self.assertNotIn(b'"id":1', raw)

    def test_busy_and_corrupt_stores_have_stable_classification(self) -> None:
        self.store().status()
        locker = sqlite3.connect(self.path, isolation_level=None)
        self.addCleanup(locker.close)
        locker.execute("BEGIN EXCLUSIVE")
        with self.assertRaises(ReferenceStoreError) as busy:
            self.store(busy_timeout=0.05).allocate_operation("widgets", "getWidget")
        self.assertEqual(busy.exception.kind, "reference_store_busy")
        locker.rollback()

        corrupt_path = self.root / "corrupt.sqlite3"
        corrupt_path.write_bytes(b"not sqlite")
        os.chmod(corrupt_path, 0o600)
        with self.assertRaises(ReferenceStoreError) as corrupt:
            ReferenceStore(corrupt_path, session="s", context=self.context).status()
        self.assertEqual(corrupt.exception.kind, "reference_store_corrupt")

    def test_canonical_json_uses_utf8_bytes_and_rejects_non_json_values(self) -> None:
        store = self.store(max_bytes=72)
        allocation = store.allocate_response("a", "unicode", {"v": "é"}, status_code=200)
        self.assertTrue(allocation.persisted)
        self.assertEqual(store.status().response_bytes, 72)
        with self.assertRaises(ValueError):
            store.allocate_response("a", "nan", float("nan"), status_code=200)


if __name__ == "__main__":
    unittest.main()
