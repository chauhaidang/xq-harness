from __future__ import annotations

import json
import re
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Any

from xq_mcp.runtime import RuntimeState
from xq_mcp.tools.rest_api import call_rest_api
from xq_mcp.tools.runtime_config import (
    clear_environment,
    configure_environment,
    get_environment,
)

TESTBED_DIR = Path(__file__).resolve().parents[2] / "testbed"
MAPPINGS_DIR = TESTBED_DIR / "mappings"

ToolHandler = Callable[[RuntimeState, dict[str, Any]], dict[str, object]]

TOOL_HANDLERS: dict[str, ToolHandler] = {
    "configure_environment": lambda state, args: configure_environment(state, **args),
    "get_environment": lambda state, args: get_environment(state),
    "clear_environment": lambda state, args: clear_environment(state),
    "call_rest_api": lambda state, args: call_rest_api(state, **args),
}


def list_mapping_files() -> list[Path]:
    return sorted(MAPPINGS_DIR.glob("*.json"))


def load_mapping(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def substitute_templates(value: Any, variables: Mapping[str, str]) -> Any:
    if isinstance(value, str):
        result = value
        for key, replacement in variables.items():
            result = result.replace(f"{{{{{key}}}}}", replacement)
        return result
    if isinstance(value, list):
        return [substitute_templates(item, variables) for item in value]
    if isinstance(value, dict):
        return {
            str(key): substitute_templates(item, variables)
            for key, item in value.items()
        }
    return value


def _path_tokens(path: str) -> list[str | int]:
    tokens: list[str | int] = []
    for segment in path.split("."):
        match = re.fullmatch(r"([A-Za-z_]+)(\[(\d+)\])?", segment)
        if match is None:
            raise ValueError(f"Invalid expect path segment: {segment}")
        tokens.append(match.group(1))
        index = match.group(3)
        if index is not None:
            tokens.append(int(index))
    return tokens


def get_value_at_path(payload: object, path: str) -> object:
    current: object = payload
    for segment in _path_tokens(path):
        if isinstance(segment, str):
            if not isinstance(current, dict):
                raise AssertionError(f"Expected mapping at {path}, got {type(current)!r}")
            if segment not in current:
                raise AssertionError(f"Missing key {segment!r} at {path}")
            current = current[segment]
            continue
        if not isinstance(current, list):
            raise AssertionError(f"Expected list at {path}, got {type(current)!r}")
        if segment >= len(current):
            raise AssertionError(f"Index {segment} out of range at {path}")
        current = current[segment]
    return current


def assert_expectations(result: dict[str, object], expect: dict[str, Any]) -> None:
    for path, expected in expect.items():
        actual = get_value_at_path(result, path)
        assert actual == expected, f"{path}: expected {expected!r}, got {actual!r}"


def run_mapping(
    mapping: dict[str, Any],
    *,
    mock_api_base_url: str,
) -> None:
    state = RuntimeState()
    variables = {"mock_api_base_url": mock_api_base_url}
    steps = mapping.get("steps")
    if not isinstance(steps, list):
        raise ValueError("mapping.steps must be a list")

    for step in steps:
        if not isinstance(step, dict):
            raise ValueError("each mapping step must be an object")
        tool_name = step.get("tool")
        if not isinstance(tool_name, str):
            raise ValueError("mapping step.tool must be a string")
        handler = TOOL_HANDLERS.get(tool_name)
        if handler is None:
            raise ValueError(f"unsupported tool: {tool_name}")

        raw_args = step.get("arguments", {})
        if not isinstance(raw_args, dict):
            raise ValueError("mapping step.arguments must be an object")
        args = substitute_templates(raw_args, variables)
        typed_args = {str(key): value for key, value in args.items()}

        result = handler(state, typed_args)
        expect = step.get("expect")
        if isinstance(expect, dict):
            assert_expectations(result, expect)
