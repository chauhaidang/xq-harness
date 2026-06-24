from harness_state import HarnessState


def test_rebuild_from_jsonl(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    req_id = state.record_requirement("Requirement A")
    state.rebuild()

    row = state.show("requirement", req_id)
    assert row["title"] == "Requirement A"


def test_rebuild_preserves_event_ids_and_sequences(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    state.record_requirement("Requirement A")
    task_id = state.create_task("Task A")
    state.change_task_status(task_id, "done")

    before = state.timeline()
    state.rebuild()
    after = state.timeline()

    assert [(e["id"], e["sequence"]) for e in before] == [
        (e["id"], e["sequence"]) for e in after
    ]
    # Rebuild must not append new events to the journal.
    assert len(after) == 3
    assert state.show("task", task_id)["status"] == "done"


def test_rebuild_deletes_no_journal_lines(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    state.record_requirement("Requirement A")
    journal = next((tmp_path / ".harness" / "events").glob("*.jsonl"))
    lines_before = journal.read_text(encoding="utf-8")

    state.rebuild()

    assert journal.read_text(encoding="utf-8") == lines_before
