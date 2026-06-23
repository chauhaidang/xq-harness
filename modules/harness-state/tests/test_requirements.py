import pytest

from harness_state import EntityNotFoundError, HarnessState, UnknownEntityTypeError


def test_requirement_add_creates_event_and_projection(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    req_id = state.record_requirement("Track project context", "Need durable state")

    row = state.show("requirement", req_id)
    assert row["title"] == "Track project context"
    assert row["status"] == "active"

    events = state.timeline()
    assert len(events) == 1
    assert events[0]["event_type"] == "requirement.created"


def test_show_unknown_entity_type_raises(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    with pytest.raises(UnknownEntityTypeError):
        state.show("not_a_type", "REQ-123")


def test_show_missing_entity_raises(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    with pytest.raises(EntityNotFoundError):
        state.show("requirement", "REQ-DOESNOTEXIST")
