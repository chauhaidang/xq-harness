import os
from contextlib import contextmanager

from harness_state.cli import main


@contextmanager
def chdir(path):
    previous = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(previous)


def test_cli_version(capsys):
    try:
        main(["--version"])
    except SystemExit as exit_info:
        assert exit_info.code == 0
    captured = capsys.readouterr()
    assert captured.out.strip() == "harness-state 0.1.0"


def test_cli_full_flow(tmp_path, capsys):
    # Make the tmp_path look like a repo root so find_repo_root stops here.
    (tmp_path / ".git").mkdir()

    with chdir(tmp_path):
        assert main(["init"]) == 0
        assert main(["requirement", "add", "Capture timeline", "--body", "b"]) == 0
        assert main(["timeline"]) == 0

    captured = capsys.readouterr()
    assert "Created requirement REQ-" in captured.out
    assert "requirement.created" in captured.out
