from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from typing import cast

from kraken.execution import (
    ExecutionError,
    ExecutionFingerprint,
    ExecutionFingerprinter,
    ExecutionRuntime,
    ReferenceKind,
    ParsedReference,
    ScenarioSelection,
    parse_alias,
)


class MutableClock:
    def __init__(self, now: float = 1_000.0) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


class ExecutionRuntimeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.config_path = self.root / "kraken.yaml"
        self.spec_path = self.root / "widgets.yaml"
        self.config_path.write_text("apis:\n  widgets:\n    spec: ./widgets.yaml\n", encoding="utf-8")
        self.spec_path.write_text("openapi: 3.1.0\ninfo:\n  title: Widgets\n", encoding="utf-8")
        self.clock = MutableClock()
        self.runtime = ExecutionRuntime(self.config_path, clock=self.clock)

    def fingerprint(self) -> ExecutionFingerprint:
        return ExecutionFingerprinter.from_files(self.config_path, {"widgets": self.spec_path})

    def test_parse_alias_classifies_scenario_operation_and_response_aliases(self) -> None:
        scenario = parse_alias("@s2")
        self.assertIsInstance(scenario, ScenarioSelection)
        self.assertEqual(scenario.value, "@s2")
        operation = parse_alias("@o3")
        response = parse_alias("@r4")
        self.assertIsInstance(operation, ParsedReference)
        self.assertIsInstance(response, ParsedReference)
        self.assertEqual(cast(ParsedReference, operation).kind, ReferenceKind.OPERATION)
        self.assertEqual(cast(ParsedReference, response).kind, ReferenceKind.RESPONSE)
        with self.assertRaises(ValueError):
            parse_alias("@s0")
        with self.assertRaises(ValueError):
            parse_alias("@e1")

    def test_execution_lifecycle_uses_local_store_and_explicit_cleanup(self) -> None:
        active = self.runtime.start(self.fingerprint())
        self.assertEqual(self.runtime.store_path, self.config_path.resolve().parent / ".kraken" / "execution.sqlite")
        self.assertTrue(self.runtime.store_path.exists())
        self.assertEqual(active.record.config_path, self.config_path.resolve())
        with self.assertRaises(ExecutionError) as duplicate:
            self.runtime.start(self.fingerprint())
        self.assertEqual(duplicate.exception.kind, "execution_already_active")
        self.runtime.cleanup()
        self.assertFalse(self.runtime.store_path.exists())

    def test_stale_execution_requires_explicit_cleanup_before_restart(self) -> None:
        self.runtime.start(self.fingerprint())
        self.clock.now += 24 * 60 * 60

        with self.assertRaises(ExecutionError) as stale:
            self.runtime.start(self.fingerprint())
        self.assertEqual(stale.exception.kind, "execution_stale")

        self.runtime.cleanup()
        self.assertEqual(self.runtime.start(self.fingerprint()).record.config_path, self.config_path.resolve())

    def test_fingerprint_change_fails_validation(self) -> None:
        self.runtime.start(self.fingerprint())
        self.spec_path.write_text("openapi: 3.1.0\ninfo:\n  title: Changed\n", encoding="utf-8")
        with self.assertRaises(ExecutionError) as changed:
            self.runtime.active(self.fingerprint())
        self.assertEqual(changed.exception.kind, "execution_config_changed")

    def test_scenario_selection_and_reference_aliases_are_scoped(self) -> None:
        active = self.runtime.start(self.fingerprint())
        with self.assertRaises(ExecutionError) as missing:
            active.select()
        self.assertEqual(missing.exception.kind, "scenario_required")

        first = active.open_scenario()
        second = active.open_scenario()
        self.assertEqual((first.ref, second.ref), ("@s1", "@s2"))
        with self.assertRaises(ExecutionError) as ambiguous:
            active.select()
        self.assertEqual(ambiguous.exception.kind, "scenario_ambiguous")

        self.assertEqual(first.allocate_operation("widgets", "getWidget"), "@o1")
        self.assertEqual(second.allocate_operation("widgets", "getWidget"), "@o1")
        self.assertEqual(first.allocate_response("widgets", "getWidget", {"id": 1}, status_code=200, operation_ref="@o1").ref, "@r1")
        self.assertEqual(first.allocate_response("widgets", "getWidget", {"id": 1}, status_code=200, operation_ref="@o1").ref, "@r2")
        self.assertEqual(second.allocate_response("widgets", "getWidget", {"id": 2}, status_code=200, operation_ref="@o1").ref, "@r1")
        self.assertEqual(first.resolve("@r1").data, {"id": 1})
        self.assertEqual(first.resolve("@r2").data, {"id": 1})
        self.assertEqual(second.resolve("@r1").data, {"id": 2})

        first.close()
        third = active.open_scenario()
        self.assertEqual(third.ref, "@s3")
        with self.assertRaises(ExecutionError) as closed:
            active.select("@s1")
        self.assertEqual(closed.exception.kind, "scenario_closed")


if __name__ == "__main__":
    unittest.main()
