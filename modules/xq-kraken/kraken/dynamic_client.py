"""Synchronous OpenAPI adapter for the Kraken client interface."""

import copy
from collections.abc import Mapping, Set
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

import httpx
import yaml
from aiopenapi3 import OpenAPI
from aiopenapi3.errors import HTTPStatusError, RequestError, ResponseError
from pydantic import BaseModel, ValidationError

from .api_catalog import ApiRequestBody, ApiResponse
from .errors import (
    InvocationResponseError,
    InvocationTransportError,
    InvocationValidationError,
    OperationNotAllowedError,
    OperationNotFoundError,
)
from .models import (
    ApiParameter,
    InvocationRequest,
    InvocationResult,
    JsonValue,
    OperationDescription,
    OperationSummary,
)

_HTTP_METHODS = frozenset({"delete", "get", "head", "options", "patch", "post", "put", "trace"})
_HttpxClient = httpx.Client


@dataclass(frozen=True)
class _IndexedOperation:
    method: str
    path: str
    operation: Mapping[str, object]
    path_parameters: tuple[Mapping[str, object], ...]


class KrakenDynamicClient:
    """Indexes an OpenAPI document while keeping parser types private."""

    def __init__(
        self,
        api: OpenAPI,
        operations: Mapping[str, _IndexedOperation],
        allowed_operation_ids: frozenset[str],
    ) -> None:
        self._api = api
        self._operations = operations
        self._allowed_operation_ids = allowed_operation_ids

    @classmethod
    def from_file(
        cls,
        *,
        spec_path: Path,
        base_url: str,
        allowed_operation_ids: Set[str] | None,
    ) -> "KrakenDynamicClient":
        try:
            loaded_document = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, yaml.YAMLError) as error:
            raise ValueError(f"Unable to load OpenAPI document: {spec_path}") from error
        if not isinstance(loaded_document, dict):
            raise ValueError("OpenAPI document must be a mapping")
        document = loaded_document

        operations = _index_operations(document)
        transport_document = copy.deepcopy(document)
        transport_document["servers"] = [{"url": base_url}]
        api = OpenAPI(
            spec_path.resolve().as_uri(),
            cast(Any, transport_document),
            session_factory=_HttpxClient,
            use_operation_tags=False,
        )
        # Kraken classifies responses by their OpenAPI contract, not by status
        # class. aiopenapi3 has already selected and validated the documented
        # response before this status hook runs, so disable its 4xx/5xx raises.
        api.raise_on_http_status = []
        allowed = operations.keys() if allowed_operation_ids is None else allowed_operation_ids
        return cls(api, operations, frozenset(allowed))

    def search(self, query: str) -> tuple[OperationSummary, ...]:
        normalized_query = query.casefold()
        summaries = (
            _to_summary(operation_id, indexed.operation)
            for operation_id, indexed in self._operations.items()
            if operation_id in self._allowed_operation_ids
        )
        return tuple(
            sorted(
                (
                    summary
                    for summary in summaries
                    if normalized_query in _search_text(summary)
                ),
                key=lambda summary: summary.operation_id,
            )
        )

    def describe(self, operation_id: str) -> OperationDescription:
        return _to_description(operation_id, self._allowed_operation(operation_id))

    def invoke(self, request: InvocationRequest) -> InvocationResult:
        """Validate and execute an allowed OpenAPI operation.

        The OpenAPI runtime owns parameter and body validation.  Kraken keeps
        the failure safe for callers and converts its parsed Pydantic response
        into the public JSON-shaped result DTO.
        """
        self._allowed_operation(request.operation_id)
        try:
            runtime_request = self._api.createRequest(request.operation_id)
            data = _validated_request_body(runtime_request, request.body)
            _headers, data, response = runtime_request.request(
                # aiopenapi3 validates these dynamic values against the
                # selected operation; its static aliases cannot express our
                # recursive public JSON type at this adapter seam.
                parameters=cast(Any, dict(request.parameters)),
                data=cast(Any, data),
            )
        except (ValidationError, ValueError) as error:
            raise InvocationValidationError(
                request.operation_id,
                "Invocation input is invalid",
            ) from error
        except (RequestError, httpx.RequestError) as error:
            raise InvocationTransportError(
                request.operation_id,
                "Unable to reach the API",
            ) from error
        except HTTPStatusError as error:
            raise InvocationResponseError(
                request.operation_id,
                f"API returned undocumented HTTP {error.http_status}",
            ) from error
        except ResponseError as error:
            raise InvocationResponseError(
                request.operation_id,
                "API response does not match its OpenAPI contract",
            ) from error

        try:
            normalized_data = _to_json_value(data)
        except (TypeError, ValueError) as error:
            raise InvocationResponseError(
                request.operation_id,
                "API response is not JSON-shaped data",
            ) from error

        return InvocationResult(
            operation_id=request.operation_id,
            status_code=response.status_code,
            headers={name.lower(): value for name, value in response.headers.items()},
            data=normalized_data,
        )

    def _allowed_operation(self, operation_id: str) -> _IndexedOperation:
        """Return an indexed operation only when the caller may access it.

        Keep this lookup as the single visibility seam so invocation can use the
        identical unknown-versus-disallowed behavior when it is implemented.
        """
        operation = self._operations.get(operation_id)
        if operation is None:
            raise OperationNotFoundError(operation_id, "Operation not found")
        if operation_id not in self._allowed_operation_ids:
            raise OperationNotAllowedError(operation_id, "Operation is not allowed")
        return operation


def _index_operations(document: Mapping[str, object]) -> dict[str, _IndexedOperation]:
    paths = document.get("paths")
    if not isinstance(paths, Mapping):
        raise ValueError("OpenAPI document must contain a paths mapping")

    operations: dict[str, _IndexedOperation] = {}
    for path, path_item in paths.items():
        if not isinstance(path, str):
            continue
        if not isinstance(path_item, Mapping):
            continue
        path_parameters = _parameter_mappings(path_item.get("parameters"))
        for method, operation in path_item.items():
            if not isinstance(method, str) or method.lower() not in _HTTP_METHODS:
                continue
            if not isinstance(operation, Mapping):
                raise ValueError("OpenAPI operation must be a mapping")
            operation_id = operation.get("operationId")
            if not isinstance(operation_id, str) or not operation_id.strip():
                raise ValueError("Every HTTP operation requires a non-empty operationId")
            if operation_id in operations:
                raise ValueError(f"Duplicate operationId: {operation_id}")
            operations[operation_id] = _IndexedOperation(
                method=method.lower(),
                path=path,
                operation=operation,
                path_parameters=path_parameters,
            )
    return operations


def _to_description(operation_id: str, indexed: _IndexedOperation) -> OperationDescription:
    operation = indexed.operation
    summary = operation.get("summary")
    description = operation.get("description")
    tags = operation.get("tags")
    parameters = _merged_parameters(
        indexed.path_parameters,
        _parameter_mappings(operation.get("parameters")),
    )
    return OperationDescription(
        operation_id=operation_id,
        method=indexed.method,
        path=indexed.path,
        summary=summary if isinstance(summary, str) else None,
        description=description if isinstance(description, str) else None,
        tags=tuple(tag for tag in tags if isinstance(tag, str)) if isinstance(tags, list) else (),
        parameters=tuple(_to_parameter(parameter) for parameter in parameters),
        request_body=_to_request_body(operation.get("requestBody")),
        responses=_to_responses(operation.get("responses")),
    )


def _parameter_mappings(value: object) -> tuple[Mapping[str, object], ...]:
    if not isinstance(value, list):
        return ()
    return tuple(parameter for parameter in value if isinstance(parameter, Mapping))


def _merged_parameters(
    path_parameters: tuple[Mapping[str, object], ...],
    operation_parameters: tuple[Mapping[str, object], ...],
) -> tuple[Mapping[str, object], ...]:
    """Merge parameters using OpenAPI's ``(name, in)`` override rule."""
    parameters: dict[tuple[object, object], Mapping[str, object]] = {}
    for parameter in path_parameters:
        parameters[(parameter.get("name"), parameter.get("in"))] = parameter
    for parameter in operation_parameters:
        parameters[(parameter.get("name"), parameter.get("in"))] = parameter
    return tuple(parameters.values())


def _to_parameter(parameter: Mapping[str, object]) -> ApiParameter:
    name = parameter.get("name")
    location = parameter.get("in")
    description = parameter.get("description")
    schema = parameter.get("schema")
    return ApiParameter(
        name=name if isinstance(name, str) else "",
        location=location if isinstance(location, str) else "",
        required=location == "path" or parameter.get("required") is True,
        description=description if isinstance(description, str) else None,
        schema=cast(Mapping[str, JsonValue], schema) if isinstance(schema, Mapping) else {},
    )


def _to_request_body(value: object) -> ApiRequestBody | None:
    if not isinstance(value, Mapping):
        return None
    content = value.get("content")
    description = value.get("description")
    return ApiRequestBody(
        required=value.get("required") is True,
        description=description if isinstance(description, str) else None,
        content=cast(Mapping[str, object], content) if isinstance(content, Mapping) else {},
    )


def _to_responses(value: object) -> tuple[ApiResponse, ...]:
    if not isinstance(value, Mapping):
        return ()
    responses: list[ApiResponse] = []
    for status_code, response in value.items():
        if not isinstance(response, Mapping):
            continue
        description = response.get("description")
        content = response.get("content")
        responses.append(
            ApiResponse(
                status_code=str(status_code),
                description=description if isinstance(description, str) else None,
                content=cast(Mapping[str, object], content) if isinstance(content, Mapping) else {},
            )
        )
    return tuple(responses)


def _to_summary(operation_id: str, operation: Mapping[str, object]) -> OperationSummary:
    summary = operation.get("summary")
    tags = operation.get("tags")
    return OperationSummary(
        operation_id=operation_id,
        summary=summary if isinstance(summary, str) else None,
        tags=tuple(tag for tag in tags if isinstance(tag, str)) if isinstance(tags, list) else (),
    )


def _search_text(summary: OperationSummary) -> str:
    return " ".join((summary.operation_id, summary.summary or "", *summary.tags)).casefold()


def _to_json_value(data: object) -> JsonValue:
    if isinstance(data, BaseModel):
        return _to_json_value(data.model_dump(mode="json"))
    if data is None or isinstance(data, bool | int | float | str):
        return data
    if isinstance(data, list | tuple):
        return [_to_json_value(value) for value in data]
    if isinstance(data, Mapping):
        if not all(isinstance(key, str) for key in data):
            raise TypeError("JSON object keys must be strings")
        return {key: _to_json_value(value) for key, value in data.items()}
    raise TypeError(f"Unsupported response value: {type(data).__name__}")


def _validated_request_body(runtime_request: object, body: JsonValue | None) -> object:
    """Build the runtime's generated Pydantic request model for JSON bodies."""
    if body is None:
        return None

    schema = getattr(runtime_request, "data", None)
    if schema is None:
        raise ValueError("Operation does not accept a JSON request body")
    model_type = schema.get_type()
    return model_type.model_validate(body)
