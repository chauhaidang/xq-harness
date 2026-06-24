from harness_state import HarnessState


def test_export_writes_markdown(tmp_path):
    state = HarnessState(root=tmp_path)
    state.init()

    state.record_requirement("Requirement A")
    state.export_markdown()

    context_dir = tmp_path / "docs" / "context"
    assert (context_dir / "requirements.md").exists()
    assert (context_dir / "timeline.md").exists()
    assert (context_dir / "current.md").exists()

    requirements_md = (context_dir / "requirements.md").read_text(encoding="utf-8")
    assert "Requirement A" in requirements_md
