#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional


SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)
PYPROJECT_VERSION_RE = re.compile(
    r'(?ms)^(\[project\]\s*.*?^version\s*=\s*")[^"]+("\s*$)'
)
XCODEGEN_VERSION_RE = re.compile(
    r"^(\s*MARKETING_VERSION:\s*)\S+(\s*)$", re.MULTILINE
)
XCODEPROJ_VERSION_RE = re.compile(r"(MARKETING_VERSION = )[^;]+(;)")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate or synchronize native versions from each module's version.yaml."
    )
    parser.add_argument("--module", help="Process one module key")
    parser.add_argument(
        "--sync", action="store_true", help="Write the canonical version to every mirror"
    )
    return parser.parse_args()


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_yaml(path: Path) -> dict:
    result = subprocess.run(
        ["yq", "-o=json", ".", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def extract_package_json(content: str) -> str:
    value = json.loads(content).get("version")
    if not isinstance(value, str):
        raise ValueError("missing string version")
    return value


def extract_package_lock_json(content: str) -> str:
    data = json.loads(content)
    versions = {data.get("version"), data.get("packages", {}).get("", {}).get("version")}
    versions.discard(None)
    if len(versions) != 1:
        raise ValueError(f"root versions disagree: {sorted(versions)}")
    return next(iter(versions))


def extract_with_regex(content: str, pattern: re.Pattern[str], label: str) -> str:
    matches = {match.group(1) for match in pattern.finditer(content)}
    if not matches:
        raise ValueError(f"missing {label}")
    if len(matches) != 1:
        raise ValueError(f"multiple {label} values: {sorted(matches)}")
    return next(iter(matches)).strip().strip('"')


def extract_version(content: str, format_name: str) -> str:
    if format_name == "plain":
        return content.strip()
    if format_name == "package-json":
        return extract_package_json(content)
    if format_name == "package-lock-json":
        return extract_package_lock_json(content)
    if format_name == "pyproject-project-version":
        match = re.search(r'(?m)^version\s*=\s*"([^"]+)"\s*$', content)
        if not match:
            raise ValueError("missing [project].version")
        return match.group(1)
    if format_name == "xcodegen-marketing-version":
        pattern = re.compile(r"^\s*MARKETING_VERSION:\s*(\S+)\s*$", re.MULTILINE)
        return extract_with_regex(content, pattern, "MARKETING_VERSION")
    if format_name == "xcodeproj-marketing-version":
        pattern = re.compile(r"MARKETING_VERSION = ([^;]+);")
        return extract_with_regex(content, pattern, "MARKETING_VERSION")
    raise ValueError(f"unknown format {format_name}")


def sync_version(content: str, format_name: str, version: str) -> str:
    if format_name == "plain":
        return f"{version}\n"
    if format_name == "package-json":
        data = json.loads(content)
        data["version"] = version
        return json.dumps(data, indent=2, ensure_ascii=True) + "\n"
    if format_name == "package-lock-json":
        data = json.loads(content)
        data["version"] = version
        data.setdefault("packages", {}).setdefault("", {})["version"] = version
        return json.dumps(data, indent=2, ensure_ascii=True) + "\n"
    if format_name == "pyproject-project-version":
        updated, count = PYPROJECT_VERSION_RE.subn(rf"\g<1>{version}\g<2>", content, count=1)
    elif format_name == "xcodegen-marketing-version":
        updated, count = XCODEGEN_VERSION_RE.subn(rf"\g<1>{version}\g<2>", content)
    elif format_name == "xcodeproj-marketing-version":
        updated, count = XCODEPROJ_VERSION_RE.subn(rf"\g<1>{version}\g<2>", content)
    else:
        raise ValueError(f"unknown format {format_name}")
    if count == 0:
        raise ValueError(f"could not locate version for format {format_name}")
    return updated


def canonical_version(module: str, config: dict, errors: list[str]) -> Optional[str]:
    version = config.get("version")
    if not isinstance(version, str) or not SEMVER_RE.fullmatch(version):
        errors.append(f"{module}: version must be valid semver: {version}")
        return None
    changelog = config.get("changelog")
    if not isinstance(changelog, list) or not changelog:
        errors.append(f"{module}: changelog must be a non-empty newest-first list")
        return None
    seen: set[str] = set()
    for index, release in enumerate(changelog):
        if not isinstance(release, dict):
            errors.append(f"{module}: release {index} must be an object")
            continue
        version = release.get("version")
        changes = release.get("changes")
        if not isinstance(version, str) or not SEMVER_RE.fullmatch(version):
            errors.append(f"{module}: release {index} has invalid semver: {version}")
        elif version in seen:
            errors.append(f"{module}: duplicate release version {version}")
        else:
            seen.add(version)
        if not isinstance(changes, list) or not changes or not all(
            isinstance(item, str) and item.strip() for item in changes
        ):
            errors.append(f"{module}: release {version} must have non-empty changes")
    current = changelog[0].get("version") if isinstance(changelog[0], dict) else None
    if current != version:
        errors.append(
            f"{module}: version {version} must match changelog[0].version {current}"
        )
    return version


def main() -> int:
    args = parse_args()
    root = repo_root()
    registry_modules = load_yaml(root / "modules.yaml").get("modules", {})
    errors: list[str] = []

    if args.module:
        if args.module not in registry_modules:
            print(f"error: unknown module '{args.module}'", file=sys.stderr)
            return 1
        targets = [(args.module, registry_modules[args.module])]
    else:
        targets = list(registry_modules.items())

    for module, registry_config in targets:
        module_path_value = registry_config.get("path")
        if not isinstance(module_path_value, str):
            errors.append(f"{module}: modules.yaml path must be a string")
            continue
        module_root = root / module_path_value
        version_file = module_root / "version.yaml"
        if not version_file.is_file():
            errors.append(f"{module}: missing {module_path_value}/version.yaml")
            continue
        config = load_yaml(version_file)
        if config.get("schema_version") != 1:
            errors.append(f"{module}: version.yaml schema_version must be 1")
        version = canonical_version(module, config, errors)
        mirrors = config.get("mirrors")
        if not isinstance(mirrors, list):
            errors.append(f"{module}: mirrors must be a list")
            continue
        if version is None:
            continue
        for mirror in mirrors:
            if not isinstance(mirror, dict):
                errors.append(f"{module}: mirror entries must be objects")
                continue
            path_value = mirror.get("path")
            format_name = mirror.get("format")
            if not isinstance(path_value, str) or not isinstance(format_name, str):
                errors.append(f"{module}: mirror requires path and format strings")
                continue
            path = module_root / path_value
            if not path.is_file():
                errors.append(f"{module}: mirror not found: {module_path_value}/{path_value}")
                continue
            try:
                content = path.read_text(encoding="utf8")
                if args.sync:
                    updated = sync_version(content, format_name, version)
                    if updated != content:
                        path.write_text(updated, encoding="utf8")
                mirrored = extract_version(path.read_text(encoding="utf8"), format_name)
                if mirrored != version:
                    errors.append(
                        f"{module}: version.yaml version {version} does not match {path_value} version {mirrored}"
                    )
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{module}: could not process {path_value}: {exc}")

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1
    action = "synchronized" if args.sync else "validated"
    print(f"{action} {len(targets)} module release definition(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
