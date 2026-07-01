from mcp.server.fastmcp import FastMCP

from xq_mcp.runtime import RuntimeState
from xq_mcp.tools import register_tools


def build_server(state: RuntimeState | None = None) -> FastMCP:
    runtime = state or RuntimeState()
    mcp = FastMCP("xq-domain-test-mcp")
    register_tools(mcp, runtime)
    return mcp


def main() -> None:
    build_server().run()


if __name__ == "__main__":
    main()
