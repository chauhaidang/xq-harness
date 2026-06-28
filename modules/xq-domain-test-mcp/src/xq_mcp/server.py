from typing import Any

from xq_mcp.runtime import runtime_state
from xq_mcp.tools import (
    call_rest_api as call_rest_api_tool,
    clear_environment as clear_environment_tool,
    configure_environment as configure_environment_tool,
    get_environment as get_environment_tool,
)


def register_tools(mcp: Any) -> None:
    @mcp.tool()
    def configure_environment(
        environment: str,
        api_base_url: str,
        api_token: str | None = None,
    ) -> dict[str, object]:
        """Configure runtime environment parameters for this MCP process."""
        return configure_environment_tool(
            runtime_state,
            environment=environment,
            api_base_url=api_base_url,
            api_token=api_token,
        )

    @mcp.tool()
    def get_environment() -> dict[str, object]:
        """Read redacted runtime environment status."""
        return get_environment_tool(runtime_state)

    @mcp.tool()
    def clear_environment() -> dict[str, object]:
        """Clear runtime environment parameters from memory."""
        return clear_environment_tool(runtime_state)

    @mcp.tool()
    def call_rest_api(
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        expected_status: int | None = None,
        timeout_seconds: float = 10.0,
    ) -> dict[str, object]:
        """Call a REST endpoint using the configured runtime environment."""
        return call_rest_api_tool(
            runtime_state,
            method=method,
            path=path,
            body=body,
            expected_status=expected_status,
            timeout_seconds=timeout_seconds,
        )


def build_server() -> Any:
    try:
        from mcp.server.fastmcp import FastMCP
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "The MCP Python SDK is not installed. Run `uv sync` in "
            "modules/poc/xq-domain-test-mcp before starting the server."
        ) from exc

    mcp = FastMCP("xq-domain-test-mcp")
    register_tools(mcp)
    return mcp


def main() -> None:
    build_server().run()


if __name__ == "__main__":
    main()
