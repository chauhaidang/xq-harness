import json

import pytest

from harness_state import HarnessState, NotInitializedError


def test_events_get_monotonic_sequences(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    state.record_requirement("First")
    state.record_requirement("Second")

    events = state.timeline()
    sequences = [event["sequence"] for event in events]
    assert sequences == [1, 2]


def test_event_appended_to_jsonl_journal(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    state.record_requirement("Track context", "body")

    journals = list((tmp_path / ".harness" / "events").glob("*.jsonl"))
    assert len(journals) == 1

    lines = journals[0].read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1

    event = json.loads(lines[0])
    assert event["event_type"] == "requirement.created"
    assert event["payload"]["title"] == "Track context"


def test_operations_before_init_raise(tmp_path):
    state = HarnessState(root=tmp_path)
    with pytest.raises(NotInitializedError):
        state.record_requirement("nope")
