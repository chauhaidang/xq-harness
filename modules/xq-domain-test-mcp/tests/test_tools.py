import unittest

from xq_mcp.runtime import MissingRuntimeConfigError, RuntimeState
from xq_mcp.server import register_tools
from xq_mcp.tools import (
    call_rest_api,
    clear_environment,
    configure_environment,
    get_environment,
)


class RecordingRequester:
    def __init__(self, status_code: int = 200) -> None:
        self.status_code = status_code
        self.calls: list[dict[str, object]] = []

    def request_json(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, object] | None,
        timeout_seconds: float,
    ) -> dict[str, object]:
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


class FakeMcp:
    def __init__(self) -> None:
        self.tools: dict[str, object] = {}

    def tool(self):
        def decorator(func):
            self.tools[func.__name__] = func
            return func

        return decorator


class RestApiMvpTest(unittest.TestCase):
    def test_environment_config_is_in_memory_and_redacted(self) -> None:
        state = RuntimeState()

        result = configure_environment(
            state,
            environment="dev",
            api_base_url="https://api.example.test/",
            api_token="secret-token",
        )

        self.assertEqual(result["status"], "configured")
        self.assertEqual(result["api_base_url"], "https://api.example.test")
        self.assertEqual(result["has_api_token"], True)
        self.assertNotIn("secret-token", repr(result))
        self.assertEqual(
            get_environment(state),
            {
                "configured": True,
                "environment": "dev",
                "api_base_url": "https://api.example.test",
                "has_api_token": True,
            },
        )

    def test_clear_environment_removes_config(self) -> None:
        state = RuntimeState()
        configure_environment(
            state,
            environment="dev",
            api_base_url="https://api.example.test",
        )

        self.assertEqual(
            clear_environment(state),
            {"status": "cleared", "was_configured": True, "configured": False},
        )
        self.assertEqual(get_environment(state), {"configured": False})

    def test_call_rest_api_requires_config(self) -> None:
        with self.assertRaises(MissingRuntimeConfigError):
            call_rest_api(RuntimeState(), method="GET", path="/health")

    def test_call_rest_api_uses_config_and_asserts_status(self) -> None:
        state = RuntimeState()
        configure_environment(
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
        configure_environment(
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

    def test_server_registers_only_rest_api_mvp_tools(self) -> None:
        mcp = FakeMcp()

        register_tools(mcp)

        self.assertEqual(
            set(mcp.tools),
            {
                "configure_environment",
                "get_environment",
                "clear_environment",
                "call_rest_api",
            },
        )


if __name__ == "__main__":
    unittest.main()
