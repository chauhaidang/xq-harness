"""Stable domain contract for xq-kraken."""

from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class ApiCatalog:
    title: str | None
    version: str | None
    description: str | None
    servers: tuple[str, ...] = ()
    endpoints: tuple["ApiEndpoint", ...] = ()


@dataclass(frozen=True)
class ApiRequestBody:
    required: bool = False
    description: str | None = None
    content: Mapping[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class ApiResponse:
    status_code: str
    description: str | None = None
    content: Mapping[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class ApiEndpoint:
    path: str
    method: str
    operation_id: str
    summary: str | None = None
    description: str | None = None
    tags: tuple[str, ...] = ()
    deprecated: bool = False
    request_body: ApiRequestBody | None = None
    responses: tuple[ApiResponse, ...] = ()

@dataclass(frozen=True)
class ApiParameter:
    pass


class ApiSource(Protocol):
    def load(self, path: Path) -> Mapping[str, object]: ...

class ApiExtractor(Protocol):
    def extract(self, source: Mapping[str, object]) -> ApiCatalog: ...

class ApiCatalogProvider(Protocol):
    def get_catalog(self, source: object) -> ApiCatalog: ...
