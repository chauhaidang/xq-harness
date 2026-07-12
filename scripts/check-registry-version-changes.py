#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Detect canonical version changes from a module's version.yaml."
    )
    parser.add_argument("--module", required=True, help="Module key")
    return parser.parse_args()


def load_yaml_json(text: str) -> dict:
    result = subprocess.run(
        ["yq", "-o=json", "."], input=text, check=True, capture_output=True, text=True
    )
    return json.loads(result.stdout)


def load_previous(root: Path, version_path: str) -> Optional[dict]:
    try:
        text = subprocess.check_output(
            ["git", "show", f"HEAD^:{version_path}"],
            cwd=root,
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return None
    return load_yaml_json(text)


def version_of(data: dict) -> str:
    value = data.get("version")
    return value if isinstance(value, str) else ""


def main() -> int:
    args = parse_args()
    root = Path(__file__).resolve().parent.parent
    registry = load_yaml_json((root / "modules.yaml").read_text(encoding="utf8"))
    module_config = registry.get("modules", {}).get(args.module)
    if not isinstance(module_config, dict) or not isinstance(module_config.get("path"), str):
        print(f"error: unknown module '{args.module}'", file=sys.stderr)
        return 1
    version_path = f"{module_config['path']}/version.yaml"
    current = load_yaml_json((root / version_path).read_text(encoding="utf8"))
    current_version = version_of(current)
    if not current_version:
        print(f"error: {version_path} is missing version", file=sys.stderr)
        return 1
    previous = load_previous(root, version_path)
    # Adding version.yaml establishes a baseline and must not publish an
    # existing module as if its version had just changed.
    previous_version = (
        current_version if previous is None else version_of(previous)
    )
    changed = current_version != previous_version
    result = {
        "module": args.module,
        "previous_version": previous_version,
        "current_version": current_version,
        "version_changed": changed,
    }
    print(json.dumps(result))
    if github_output := os.environ.get("GITHUB_OUTPUT"):
        with open(github_output, "a", encoding="utf8") as handle:
            handle.write(f"version_changed={str(changed).lower()}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
