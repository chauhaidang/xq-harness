import hashlib
import subprocess
from pathlib import Path


def run_git(root: Path, args: list[str]) -> str | None:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except (FileNotFoundError, OSError):
        return None

    if result.returncode != 0:
        return None

    return result.stdout.strip()


def current_branch(root: Path) -> str | None:
    return run_git(root, ["branch", "--show-current"])


def current_commit(root: Path) -> str | None:
    return run_git(root, ["rev-parse", "HEAD"])


def working_tree_status(root: Path) -> str:
    return run_git(root, ["status", "--short"]) or ""


def working_tree_hash(root: Path) -> str:
    status = working_tree_status(root)
    return hashlib.sha256(status.encode("utf-8")).hexdigest()
