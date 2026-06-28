from mcp.server.fastmcp import FastMCP

from xq_mcp.runtime import RuntimeState


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


class RuntimeConfigTools:
    _state: RuntimeState

    def __init__(self, state: RuntimeState) -> None:
        self._state = state

    def register(self, mcp: FastMCP) -> None:
        state = self._state

        @mcp.tool(name="configure_environment")
        def configure_environment_tool(
            environment: str,
            api_base_url: str,
            api_token: str | None = None,
        ) -> dict[str, object]:
            """Configure runtime environment parameters for this MCP process."""
            return configure_environment(
                state,
                environment=environment,
                api_base_url=api_base_url,
                api_token=api_token,
            )

        @mcp.tool(name="get_environment")
        def get_environment_tool() -> dict[str, object]:
            """Read redacted runtime environment status."""
            return get_environment(state)

        @mcp.tool(name="clear_environment")
        def clear_environment_tool() -> dict[str, object]:
            """Clear runtime environment parameters from memory."""
            return clear_environment(state)

        _ = (configure_environment_tool, get_environment_tool, clear_environment_tool)
