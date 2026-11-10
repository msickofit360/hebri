"""Exercise the real Hebri transport against its locked SDK, without network services."""
import asyncio
from pathlib import Path
import sys


def test_pinned_sdk_starts_lists_calls_and_shuts_down(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setenv("HEBRI_HOME", str(tmp_path))
    (tmp_path / "config.yaml").write_text("{}")
    from tools.mcp_tool import MCPServerTask, _ensure_mcp_sdk
    from tools.mcp_tool_common import mcp_field
    assert _ensure_mcp_sdk()

    async def exercise():
        task = MCPServerTask("hebri-sdk-test")
        fixture = Path(__file__).resolve().parents[1] / "fixtures" / "mcp_stdio_echo.py"
        try:
            await asyncio.wait_for(task.start({"command": sys.executable, "args": [str(fixture)]}), 30)
            listed = await asyncio.wait_for(task.session.list_tools(), 10)
            assert "echo" in [tool.name for tool in listed.tools]
            reply = await asyncio.wait_for(task.session.call_tool("echo", {"value": "hebri-sdk-ok"}), 10)
            assert mcp_field(reply, "is_error", "isError") is False
            assert any(getattr(item, "text", "") == "hebri-sdk-ok" for item in reply.content)
        finally:
            await asyncio.wait_for(task.shutdown(), 10)

    asyncio.run(exercise())
