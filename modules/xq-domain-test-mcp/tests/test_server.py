import unittest
from collections.abc import Callable
from typing import TypeVar, cast

from mcp.server.fastmcp import FastMCP

from xq_mcp.runtime import RuntimeState
from xq_mcp.tools import register_tools

ToolFunc = TypeVar("ToolFunc", bound=Callable[..., object])


class FakeMcp:
    def __init__(self) -> None:
        self.tools: dict[str, Callable[..., object]] = {}

    def tool(
        self,
        name: str | None = None,
        description: str | None = None,
        **kwargs: object,
    ) -> Callable[[ToolFunc], ToolFunc]:
        _ = (description, kwargs)

        def decorator(func: ToolFunc) -> ToolFunc:
            self.tools[name or func.__name__] = func
            return func

        return decorator


class RegisterToolsTest(unittest.TestCase):
    def test_registers_mvp_tool_catalog(self) -> None:
        mcp = FakeMcp()
        state = RuntimeState()

        register_tools(cast(FastMCP, cast(object, mcp)), state)

        self.assertEqual(
            set(mcp.tools),
            {
                "configure_environment",
                "get_environment",
                "clear_environment",
                "call_rest_api",
            },
        )
