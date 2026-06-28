import unittest

from xq_mcp.runtime import RuntimeState
from xq_mcp.tools.runtime_config import (
    clear_environment,
    configure_environment,
    get_environment,
)


class RuntimeConfigToolsTest(unittest.TestCase):
    def test_configure_environment_is_in_memory_and_redacted(self) -> None:
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
        _ = configure_environment(
            state,
            environment="dev",
            api_base_url="https://api.example.test",
        )

        self.assertEqual(
            clear_environment(state),
            {"status": "cleared", "was_configured": True, "configured": False},
        )
        self.assertEqual(get_environment(state), {"configured": False})
