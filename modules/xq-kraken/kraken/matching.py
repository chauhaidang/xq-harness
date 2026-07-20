"""RFC 6901 selection and partial semantic JSON matching."""

from collections.abc import Mapping
from dataclasses import dataclass

from .models import JsonValue


@dataclass(frozen=True)
class MissingValue:
    """Explicit marker distinguishing an absent pointer from JSON null."""


MISSING = MissingValue()


@dataclass(frozen=True)
class BodyAssertionFailure:
    pointer: str
    expected: JsonValue
    actual: JsonValue | MissingValue


def evaluate_body_assertions(
    data: JsonValue,
    assertions: Mapping[str, JsonValue],
) -> tuple[BodyAssertionFailure, ...]:
    """Evaluate pointer expectations and return only unmatched fields."""
    failures: list[BodyAssertionFailure] = []
    for pointer, expected in assertions.items():
        actual = resolve_json_pointer(data, pointer)
        if isinstance(actual, MissingValue) or not is_partial_match(actual, expected):
            failures.append(
                BodyAssertionFailure(pointer=pointer, expected=expected, actual=actual)
            )
    return tuple(failures)


def is_partial_match(actual: JsonValue, expected: JsonValue) -> bool:
    """Return whether actual contains the expected semantic JSON fragment."""
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(
            key in actual and is_partial_match(actual[key], expected_value)
            for key, expected_value in expected.items()
        )
    if isinstance(expected, list):
        return isinstance(actual, list) and _match_array_subset(actual, expected, 0, set())
    if isinstance(expected, bool) or isinstance(actual, bool):
        return type(actual) is type(expected) and actual == expected
    if isinstance(expected, int | float) and isinstance(actual, int | float):
        return actual == expected
    return type(actual) is type(expected) and actual == expected


def _match_array_subset(
    actual: list[JsonValue],
    expected: list[JsonValue],
    expected_index: int,
    consumed: set[int],
) -> bool:
    if expected_index == len(expected):
        return True
    if len(expected) - expected_index > len(actual) - len(consumed):
        return False
    expected_value = expected[expected_index]
    for actual_index, actual_value in enumerate(actual):
        if actual_index in consumed or not is_partial_match(actual_value, expected_value):
            continue
        consumed.add(actual_index)
        if _match_array_subset(actual, expected, expected_index + 1, consumed):
            return True
        consumed.remove(actual_index)
    return False


def resolve_json_pointer(document: JsonValue, pointer: str) -> JsonValue | MissingValue:
    """Resolve an RFC 6901 pointer, returning ``MISSING`` for absent targets."""
    if pointer == "":
        return document
    if not pointer.startswith("/"):
        raise ValueError("JSON Pointer must be empty or start with '/'")

    current = document
    for raw_token in pointer[1:].split("/"):
        token = _decode_reference_token(raw_token)
        if isinstance(current, dict):
            if token not in current:
                return MISSING
            current = current[token]
        elif isinstance(current, list):
            if not _is_array_index(token):
                return MISSING
            index = int(token)
            if index >= len(current):
                return MISSING
            current = current[index]
        else:
            return MISSING
    return current


def _decode_reference_token(token: str) -> str:
    decoded: list[str] = []
    index = 0
    while index < len(token):
        character = token[index]
        if character != "~":
            decoded.append(character)
            index += 1
            continue
        if index + 1 >= len(token) or token[index + 1] not in {"0", "1"}:
            raise ValueError("JSON Pointer contains an invalid '~' escape")
        decoded.append("~" if token[index + 1] == "0" else "/")
        index += 2
    return "".join(decoded)


def _is_array_index(token: str) -> bool:
    return token == "0" or (token.isascii() and token.isdigit() and not token.startswith("0"))
