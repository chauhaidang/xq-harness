#!/usr/bin/env python3
"""Smoke test an installed harness-state executable in a temporary Git repo."""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


class SmokeTestError(RuntimeError):
    """Raised when the installed CLI smoke test fails."""


def run(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True)


def require_path(path: Path, description: str) -> None:
    if not path.exists():
        raise SmokeTestError(f"missing {description}: {path}")


def require_any(path: Path, pattern: str, description: str) -> None:
    if not any(path.glob(pattern)):
        raise SmokeTestError(f"missing {description}: {path}/{pattern}")


def smoke_test(executable: Path) -> None:
    if not executable.is_file():
        raise SmokeTestError(f"harness-state executable not found: {executable}")

    with tempfile.TemporaryDirectory(prefix="harness-state-smoke-") as temp:
        workdir = Path(temp)

        run(["git", "init"], cwd=workdir)
        run([str(executable), "init"], cwd=workdir)
        run(
            [
                str(executable),
                "requirement",
                "add",
                "Smoke requirement",
                "--body",
                "Verify released CLI works.",
            ],
            cwd=workdir,
        )
        run(
            [
                str(executable),
                "decision",
                "record",
                "Smoke decision",
                "--body",
                "Built wheel is executable.",
                "--rationale",
                "Release validation.",
            ],
            cwd=workdir,
        )
        run([str(executable), "timeline"], cwd=workdir)
        run([str(executable), "export"], cwd=workdir)
        run([str(executable), "rebuild"], cwd=workdir)

        require_path(workdir / ".harness" / "state.db", "SQLite state DB")
        require_any(workdir / ".harness" / "events", "*.jsonl", "JSONL event journal")
        require_any(workdir / "docs" / "context", "*.md", "Markdown context export")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--executable", required=True, type=Path)
    args = parser.parse_args(argv)

    try:
        smoke_test(args.executable)
    except (SmokeTestError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print("Installed harness-state CLI smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
