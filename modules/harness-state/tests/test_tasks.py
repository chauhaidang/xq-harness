import pytest

from harness_state import EntityNotFoundError, HarnessState


def test_task_status_change_updates_projection(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    task_id = state.create_task("Implement v1", priority="high")
    assert state.show("task", task_id)["status"] == "open"

    state.change_task_status(task_id, "done")
    assert state.show("task", task_id)["status"] == "done"

    events = state.timeline()
    assert [event["event_type"] for event in events] == [
        "task.created",
        "task.status_changed",
    ]


def test_task_status_change_unknown_task_raises(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    with pytest.raises(EntityNotFoundError):
        state.change_task_status("TASK-MISSING", "done")
