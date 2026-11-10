"""Local-only interoperability fixture for the pinned MCP SDK."""
from mcp.server import MCPServer

server = MCPServer("Hebri interoperability test")


@server.tool()
def echo(value: str) -> str:
    """Return the supplied test value without external effects."""
    return value


if __name__ == "__main__":
    server.run(transport="stdio")
