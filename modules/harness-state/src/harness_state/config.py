from pathlib import Path


def find_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()

    for path in [current, *current.parents]:
        if (path / ".git").exists():
            return path

    return current


class HarnessPaths:
    def __init__(self, root: Path | None = None):
        self.root = root or find_repo_root()
        self.harness_dir = self.root / ".harness"
        self.db_path = self.harness_dir / "state.db"
        self.events_dir = self.harness_dir / "events"
        self.artifacts_dir = self.harness_dir / "artifacts"
        self.context_dir = self.root / "docs" / "context"

    def ensure_runtime_dirs(self) -> None:
        self.harness_dir.mkdir(parents=True, exist_ok=True)
        self.events_dir.mkdir(parents=True, exist_ok=True)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.context_dir.mkdir(parents=True, exist_ok=True)
