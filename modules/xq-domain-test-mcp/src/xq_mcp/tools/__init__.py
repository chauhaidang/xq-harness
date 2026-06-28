from mcp.server.fastmcp import FastMCP

from xq_mcp.runtime import RuntimeState
from xq_mcp.tools.rest_api import RestApiTools
from xq_mcp.tools.runtime_config import RuntimeConfigTools


def register_tools(mcp: FastMCP, state: RuntimeState) -> None:
    RuntimeConfigTools(state).register(mcp)
    RestApiTools(state).register(mcp)
