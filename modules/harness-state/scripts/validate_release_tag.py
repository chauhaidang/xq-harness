#!/usr/bin/env python3
"""Validate that a harness-state release tag matches pyproject.toml."""

from __future__ import annotations

import argparse
import sys
import tomllib
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PYPROJECT = PROJECT_ROOT / "pyproject.toml"
TAG_PREFIX = "harness-state-v"


class ReleaseTagError(RuntimeError):
    """Raised when a release tag is invalid."""


def project_version() -> str:
    with PYPROJECT.open("rb") as file:
        data = tomllib.load(file)

    try:
        return str(data["project"]["version"])
    except KeyError as exc:
        raise ReleaseTagError("pyproject.toml is missing project.version") from exc


def version_from_tag(tag: str) -> str:
    if not tag.startswith(TAG_PREFIX):
        raise ReleaseTagError(f"invalid harness-state tag {tag!r}; expected {TAG_PREFIX}<version>")

    version = tag.removeprefix(TAG_PREFIX)
    if not version:
        raise ReleaseTagError(f"invalid harness-state tag {tag!r}; missing version")

    return version


def validate_tag(tag: str) -> str:
    tag_version = version_from_tag(tag)
    pyproject_version = project_version()

    if tag_version != pyproject_version:
        raise ReleaseTagError(
            f"tag version {tag_version!r} does not match pyproject version {pyproject_version!r}"
        )

    return tag_version


def write_github_output(path: Path, version: str) -> None:
    with path.open("a", encoding="utf-8") as file:
        file.write(f"version={version}\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tag", required=True, help="Git tag to validate.")
    parser.add_argument(
        "--github-output",
        type=Path,
        help="Optional GITHUB_OUTPUT file to receive version=<version>.",
    )
    args = parser.parse_args(argv)

    try:
        version = validate_tag(args.tag)
    except ReleaseTagError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.github_output is not None:
        write_github_output(args.github_output, version)

    print(version)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
