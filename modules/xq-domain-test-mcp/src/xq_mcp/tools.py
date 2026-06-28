import json
from typing import Any, Protocol
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from xq_mcp.runtime import RuntimeState


class HttpRequester(Protocol):
    def request_json(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, Any] | None,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        ...


class UrllibHttpRequester:
    def request_json(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, Any] | None,
        timeout_seconds: float,
    ) -> dict[str, Any]:
        payload = None if body is None else json.dumps(body).encode("utf-8")
        request = Request(url, data=payload, headers=headers, method=method)
        with urlopen(request, timeout=timeout_seconds) as response:
            response_body = response.read().decode("utf-8")
            parsed = json.loads(response_body) if response_body else None
            return {
                "status_code": response.status,
                "url": url,
                "json": parsed,
            }


def configure_environment(
    state: RuntimeState,
    *,
    environment: str,
    api_base_url: str,
    api_token: str | None = None,
) -> dict[str, object]:
    return state.configure(
        environment=environment,
        api_base_url=api_base_url,
        api_token=api_token,
    )


def get_environment(state: RuntimeState) -> dict[str, object]:
    return state.status()


def clear_environment(state: RuntimeState) -> dict[str, object]:
    return state.clear()


def call_rest_api(
    state: RuntimeState,
    *,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
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
