from harness_state import HarnessState


def test_decision_recorded(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    dec_id = state.record_decision(
        title="Use SQLite projection",
        body="SQLite is local state.",
        rationale="Do not commit binary DB to git.",
    )

    row = state.show("decision", dec_id)
    assert row["rationale"] == "Do not commit binary DB to git."
    assert row["status"] == "accepted"
