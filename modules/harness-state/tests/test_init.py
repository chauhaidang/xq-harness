from harness_state import HarnessState


def test_init_creates_state_directories(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    assert (tmp_path / ".harness").exists()
    assert (tmp_path / ".harness" / "events").exists()
    assert (tmp_path / ".harness" / "artifacts").exists()
    assert (tmp_path / "docs" / "context").exists()
    assert (tmp_path / ".harness" / "state.db").exists()
