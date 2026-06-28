import unittest

from xq_mcp.runtime import MissingRuntimeConfigError, RuntimeState
from xq_mcp.tools.rest_api import JsonValue, call_rest_api
from xq_mcp.tools.runtime_config import configure_environment


class RecordingRequester:
    status_code: int

    def __init__(self, status_code: int = 200) -> None:
        self.status_code = status_code
        self.calls: list[dict[str, object]] = []

    def request_json(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, JsonValue] | None,
        timeout_seconds: float,
    ) -> dict[str, JsonValue]:
        self.calls.append(
            {
                "method": method,
                "url": url,
                "headers": headers,
                "body": body,
                "timeout_seconds": timeout_seconds,
            }
        )
        return {
            "status_code": self.status_code,
            "url": url,
            "json": {"ok": True},
        }


class RestApiToolsTest(unittest.TestCase):
    def test_call_rest_api_requires_config(self) -> None:
        with self.assertRaises(MissingRuntimeConfigError):
            _ = call_rest_api(RuntimeState(), method="GET", path="/health")

    def test_call_rest_api_uses_config_and_asserts_status(self) -> None:
        state = RuntimeState()
        _ = configure_environment(
            state,
            environment="dev",
            api_base_url="https://api.example.test/root",
            api_token="secret-token",
        )
        requester = RecordingRequester(status_code=201)

        result = call_rest_api(
            state,
            method="post",
            path="/exercises",
            body={"lesson_id": "lesson-a"},
            expected_status=201,
            timeout_seconds=3,
            requester=requester,
        )

        self.assertEqual(result["tool"], "call_rest_api")
        self.assertEqual(result["category"], "rest_api")
        self.assertEqual(result["method"], "POST")
        self.assertEqual(
            result["assertion"],
            {"expected_status": 201, "actual_status": 201, "passed": True},
        )
        self.assertEqual(
            requester.calls,
            [
                {
                    "method": "POST",
                    "url": "https://api.example.test/root/exercises",
                    "headers": {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer secret-token",
                    },
                    "body": {"lesson_id": "lesson-a"},
                    "timeout_seconds": 3,
                }
            ],
        )

    def test_call_rest_api_reports_failed_status_assertion(self) -> None:
        state = RuntimeState()
        _ = configure_environment(
            state,
            environment="dev",
            api_base_url="https://api.example.test",
        )

        result = call_rest_api(
            state,
            method="GET",
            path="/health",
            expected_status=200,
            requester=RecordingRequester(status_code=500),
        )

        self.assertEqual(
            result["assertion"],
            {"expected_status": 200, "actual_status": 500, "passed": False},
        )
