from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import TypeAlias

from .api_catalog import ApiRequestBody, ApiResponse


JsonValue: TypeAlias = None | bool | int | float | str | list["JsonValue"] | dict[str, "JsonValue"]


@dataclass(frozen=True)
class OperationSummary:
    operation_id: str
    summary: str | None
    tags: tuple[str, ...]


@dataclass(frozen=True)
class ApiParameter:
    name: str
    location: str
    required: bool
    description: str | None
    schema: Mapping[str, JsonValue] = field(default_factory=dict)


@dataclass(frozen=True)
class OperationDescription:
    operation_id: str
    method: str
    path: str
    summary: str | None
    description: str | None
    tags: tuple[str, ...]
    parameters: tuple[ApiParameter, ...]
    request_body: ApiRequestBody | None
    responses: tuple[ApiResponse, ...]

@dataclass(frozen=True)
class InvocationRequest:
    operation_id: str
    parameters: Mapping[str, JsonValue] = field(default_factory=dict)
    body: JsonValue | None = None


@dataclass(frozen=True)
class InvocationResult:
    operation_id: str
    status_code: int
    headers: Mapping[str, str]
    data: JsonValue
