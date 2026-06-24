#!/usr/bin/env python3
"""Build release-side artifacts for xq-harness-state.

This script intentionally does not build the Python wheel/sdist itself. Run
`uv build` first, then run this script to:

1. validate agent skill files under `skills/`
2. build `dist/harness-state-skills-<version>.tar.gz`
3. write `dist/SHA256SUMS` for the wheel, sdist, and skill bundle
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import re
import sys
import tarfile
import tomllib
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PYPROJECT = PROJECT_ROOT / "pyproject.toml"
SKILLS_DIR = PROJECT_ROOT / "skills"
DIST_DIR = PROJECT_ROOT / "dist"
LOCAL_ABSOLUTE_PATH = re.compile(
    r"(?:(?<=\s)|^)(?:/Users/|/home/|/private/|[A-Za-z]:\\)"
)


class ReleaseArtifactError(RuntimeError):
    """Raised when release artifact validation fails."""


@dataclass(frozen=True)
class Skill:
    name: str
    path: Path
    skill_md: Path


def project_version() -> str:
    with PYPROJECT.open("rb") as file:
        data = tomllib.load(file)

    try:
        return str(data["project"]["version"])
    except KeyError as exc:
        raise ReleaseArtifactError("pyproject.toml is missing project.version") from exc


def parse_frontmatter(skill_md: Path) -> dict[str, str]:
    text = skill_md.read_text(encoding="utf-8")
    lines = text.splitlines()

    if not lines or lines[0].strip() != "---":
        raise ReleaseArtifactError(f"{skill_md} is missing YAML frontmatter")

    try:
        end = lines[1:].index("---") + 1
    except ValueError as exc:
        raise ReleaseArtifactError(f"{skill_md} has unterminated YAML frontmatter") from exc

    frontmatter: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip():
            continue
        if ":" not in line:
            raise ReleaseArtifactError(f"{skill_md} has invalid frontmatter line: {line!r}")
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip('"').strip("'")

    return frontmatter


def validate_skills() -> list[Skill]:
    if not SKILLS_DIR.is_dir():
        raise ReleaseArtifactError(f"skills directory not found: {SKILLS_DIR}")

    skills: list[Skill] = []
    for path in sorted(child for child in SKILLS_DIR.iterdir() if child.is_dir()):
        skill_md = path / "SKILL.md"
        if not skill_md.is_file():
            raise ReleaseArtifactError(f"skill directory is missing SKILL.md: {path}")

        frontmatter = parse_frontmatter(skill_md)
        name = frontmatter.get("name", "")
        description = frontmatter.get("description", "")

        if not name:
            raise ReleaseArtifactError(f"{skill_md} is missing frontmatter name")
        if not description:
            raise ReleaseArtifactError(f"{skill_md} is missing frontmatter description")
        if name != path.name:
            raise ReleaseArtifactError(
                f"{skill_md} frontmatter name {name!r} must match directory {path.name!r}"
            )

        text = skill_md.read_text(encoding="utf-8")
        if "python -m harness_state" in text or "python path/to/script.py" in text:
            raise ReleaseArtifactError(
                f"{skill_md} should document the harness-state executable, not internal Python paths"
            )
        if LOCAL_ABSOLUTE_PATH.search(text):
            raise ReleaseArtifactError(
                f"{skill_md} contains an absolute local path; skill docs must be portable"
            )

        skills.append(Skill(name=name, path=path, skill_md=skill_md))

    if not skills:
        raise ReleaseArtifactError(f"no skills found under {SKILLS_DIR}")

    return skills


def add_file_to_tar(tar: tarfile.TarFile, source: Path, arcname: str) -> None:
    data = source.read_bytes()
    info = tarfile.TarInfo(arcname)
    info.size = len(data)
    info.mtime = 0
    info.mode = 0o644
    tar.addfile(info, io.BytesIO(data))


def build_skill_bundle(version: str) -> Path:
    validate_skills()
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    archive = DIST_DIR / f"harness-state-skills-{version}.tar.gz"
    if archive.exists():
        archive.unlink()

    with archive.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as gz:
            with tarfile.open(fileobj=gz, mode="w") as tar:
                files = sorted(path for path in SKILLS_DIR.rglob("*") if path.is_file())
                for file in files:
                    relative = file.relative_to(SKILLS_DIR).as_posix()
                    add_file_to_tar(tar, file, relative)

    return archive


def expected_python_artifacts(version: str) -> list[Path]:
    return [
        DIST_DIR / f"xq_harness_state-{version}-py3-none-any.whl",
        DIST_DIR / f"xq_harness_state-{version}.tar.gz",
    ]


def validate_python_artifacts(version: str) -> list[Path]:
    artifacts = expected_python_artifacts(version)
    missing = [path for path in artifacts if not path.is_file()]
    if missing:
        missing_list = "\n".join(f"- {path}" for path in missing)
        raise ReleaseArtifactError(
            "missing Python release artifacts; run `uv build` first:\n" + missing_list
        )
    return artifacts


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_checksums(artifacts: list[Path]) -> Path:
    checksum_file = DIST_DIR / "SHA256SUMS"
    lines = []
    for artifact in sorted(artifacts, key=lambda path: path.name):
        lines.append(f"{sha256(artifact)}  {artifact.name}")
    checksum_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return checksum_file


def build_release_artifacts(expected_version: str | None = None) -> list[Path]:
    version = project_version()
    if expected_version is not None and version != expected_version:
        raise ReleaseArtifactError(
            f"pyproject version {version!r} does not match expected version {expected_version!r}"
        )

    python_artifacts = validate_python_artifacts(version)
    skill_bundle = build_skill_bundle(version)
    checksum_file = write_checksums([*python_artifacts, skill_bundle])
    return [*python_artifacts, skill_bundle, checksum_file]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--expected-version",
        help="Fail if pyproject.toml project.version does not match this value.",
    )
    args = parser.parse_args(argv)

    try:
        artifacts = build_release_artifacts(expected_version=args.expected_version)
    except ReleaseArtifactError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print("Built release artifacts:")
    for artifact in artifacts:
        print(f"- {artifact.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
