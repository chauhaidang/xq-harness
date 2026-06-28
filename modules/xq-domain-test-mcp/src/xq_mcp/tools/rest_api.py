import json
from http.client import HTTPResponse
from typing import Protocol, cast
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from mcp.server.fastmcp import FastMCP

from xq_mcp.runtime import RuntimeState

type JsonPrimitive = str | int | float | bool | None
type JsonValue = JsonPrimitive | dict[str, JsonValue] | list[JsonValue]


class HttpRequester(Protocol):
    def request_json(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, JsonValue] | None,
        timeout_seconds: float,
    ) -> dict[str, JsonValue]:
        ...


class UrllibHttpRequester:
    def request_json(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, JsonValue] | None,
        timeout_seconds: float,
    ) -> dict[str, JsonValue]:
        payload = None if body is None else json.dumps(body).encode("utf-8")
        request = Request(url, data=payload, headers=headers, method=method)
        http_response = cast(HTTPResponse, urlopen(request, timeout=timeout_seconds))
        with http_response:
            response_body = http_response.read().decode("utf-8")
            parsed: JsonValue = json.loads(response_body) if response_body else None
            return {
                "status_code": http_response.status,
                "url": url,
                "json": parsed,
            }


def call_rest_api(
    state: RuntimeState,
    *,
    method: str,
    path: str,
    body: dict[str, JsonValue] | None = None,
    expected_status: int | None = None,
    timeout_seconds: float = 10.0,
    requester: HttpRequester | None = None,
) -> dict[str, object]:
    method = method.upper()
    if method not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
        raise ValueError("method must be one of GET, POST, PUT, PATCH, DELETE")
    if not path.strip():
        raise ValueError("path is required")
    if expected_status is not None and (expected_status < 100 or expected_status > 599):
        raise ValueError("expected_status must be a valid HTTP status code")
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be greater than 0")

    config = state.require_config()
    url = urljoin(f"{config.api_base_url}/", path.lstrip("/"))
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if config.api_token:
        headers["Authorization"] = f"Bearer {config.api_token}"

    client = requester or UrllibHttpRequester()
    response = client.request_json(
        method=method,
        url=url,
        headers=headers,
        body=body,
        timeout_seconds=timeout_seconds,
    )

    status_code = response.get("status_code")
    assertion = None
    if expected_status is not None:
        assertion = {
            "expected_status": expected_status,
            "actual_status": status_code,
            "passed": status_code == expected_status,
        }

    return {
        "tool": "call_rest_api",
        "category": "rest_api",
        "method": method,
        **response,
        "assertion": assertion,
    }


class RestApiTools:
    _state: RuntimeState
    _requester: HttpRequester | None

    def __init__(
        self,
        state: RuntimeState,
        *,
        requester: HttpRequester | None = None,
    ) -> None:
        self._state = state
        self._requester = requester

    def register(self, mcp: FastMCP) -> None:
        state = self._state
        requester = self._requester

        @mcp.tool(name="call_rest_api")
        def call_rest_api_tool(
            method: str,
            path: str,
            body: dict[str, JsonValue] | None = None,
            expected_status: int | None = None,
            timeout_seconds: float = 10.0,
        ) -> dict[str, object]:
            """Call a REST endpoint using the configured runtime environment."""
            return call_rest_api(
                state,
                method=method,
                path=path,
                body=body,
                expected_status=expected_status,
                timeout_seconds=timeout_seconds,
                requester=requester,
            )

        _ = call_rest_api_tool
