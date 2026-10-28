"""Embedded browser routing exercises real schemas, inline executors and middleware."""

import json
from types import MethodType, SimpleNamespace


def make_agent(session_id, calls):
    from agent.agent_runtime_helpers import invoke_tool
    from tools.drive_preview_tool import ACT_PREVIEW_SCHEMA
    from tools.preview_tool import PREVIEW_SCHEMA

    def read(**kwargs):
        calls.append((session_id, "read", kwargs))
        return json.dumps({"kind": "url", "url": "https://example.test", "text": session_id})

    def act(payload):
        calls.append((session_id, "act", payload))
        return json.dumps({"success": True, "elements": [{"ref": "btn-example"}]})

    agent = SimpleNamespace(
        session_id=session_id, valid_tool_names={"desktop_preview", "drive_preview"},
        tools=[{"type": "function", "function": s} for s in (PREVIEW_SCHEMA, ACT_PREVIEW_SCHEMA)],
        read_preview_callback=read, drive_preview_callback=act,
        _memory_manager=None,
    )
    agent._invoke_tool = MethodType(invoke_tool, agent)
    return agent


def make_session(agent):
    from agent.codex_browser_tools import CodexBrowserTools
    from agent.transports.codex_app_server_session import CodexAppServerSession

    bridge = CodexBrowserTools(agent)
    session = CodexAppServerSession(browser_tools=bridge)
    session._thread_id = agent.session_id
    session._active_turn_id = "turn"
    return session, bridge


def test_browser_requests_use_owning_agent_and_preserve_failure_boundaries(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    calls = []
    a, b = make_agent("A", calls), make_agent("B", calls)
    sa, bridge = make_session(a)
    sb, _ = make_session(b)
    assert {s["name"] for s in bridge.definitions()} == a.valid_tool_names

    def request(session, thread, call_id, tool="desktop_preview", args=None, **extra):
        return session._respond_browser_tool({
            "threadId": thread, "turnId": "turn", "callId": call_id,
            "tool": tool, "arguments": args or {"action": "read"}, **extra,
        })

    for session, thread, call_id in [(sa, "A", "a1"), (sb, "B", "b1"), (sa, "A", "a2")]:
        out = request(session, thread, call_id)
        assert out["success"], out
        assert json.loads(out["contentItems"][0]["text"])["text"] == thread
    assert request(sa, "A", "a3", "drive_preview", {"action": "elements"})["success"]
    assert request(sa, "A", "a4", "drive_preview", {"action": "click", "ref": "btn-example"})["success"]
    before = len(calls)
    for overrides in [
        {"thread": "B", "call_id": "foreign"},
        {"thread": "A", "call_id": "a4"},
        {"thread": "A", "call_id": "stale", "turnId": "old"},
        {"thread": "A", "call_id": "namespace", "namespace": "other"},
        {"thread": "A", "call_id": "shell", "tool": "terminal"},
        {"thread": "A", "call_id": "inject", "args": {"action": "read", "session_id": "B"}},
        {"thread": "A", "call_id": "bad", "args": {"action": "read", "count": True}},
    ]:
        assert not request(sa, **overrides)["success"]
    a.valid_tool_names.clear()
    assert not request(sa, "A", "revoked")["success"]
    sb.request_interrupt()
    assert not request(sb, "B", "interrupted")["success"]
    assert len(calls) == before

    # A completion already queued beside a tool request wins: do not click
    # after the model's turn has ended, even while draining wire notifications.
    from agent.transports.codex_app_server_session import TurnResult
    from collections import deque
    responses = []
    notes = deque([{"method": "turn/completed", "params": {
        "threadId": "A", "turn": {"id": "turn", "status": "completed"},
    }}])
    requests = deque([{"method": "item/tool/call", "id": 42, "params": {
        "threadId": "A", "turnId": "turn", "callId": "late",
        "tool": "drive_preview", "arguments": {"action": "click", "ref": "btn-example"},
    }}])
    a.valid_tool_names.add("drive_preview")
    sa._client = SimpleNamespace(
        is_alive=lambda: True,
        take_server_request=lambda **_: requests.popleft() if requests else None,
        take_notification=lambda **_: notes.popleft() if notes else None,
        respond=lambda rid, result: responses.append((rid, result)),
    )
    sa._run_started_turn(TurnResult(), {"turn": {"id": "turn"}}, 5, 0, 90)
    assert responses and responses[0][0] == 42 and not responses[0][1]["success"]
    assert len(calls) == before


def test_browser_tools_require_session_surface_and_use_security_hooks(tmp_path, monkeypatch):
    from agent.codex_browser_tools import CodexBrowserTools
    from hermes_cli import plugins

    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.delenv("HERMES_DESKTOP", raising=False)
    calls = []
    agent = make_agent("remote-desktop", calls)
    session, bridge = make_session(agent)
    assert bridge.definitions()  # GUI callbacks also work over SSH/remote gateways.
    agent.tools = []
    assert CodexBrowserTools(agent).definitions() == []
    agent = make_agent("CLI", calls)
    agent.read_preview_callback = agent.drive_preview_callback = None
    assert CodexBrowserTools(agent).definitions() == []

    seen = []
    def block(name, args, **identity):
        seen.append((name, identity["session_id"]))
        return "Blocked by test policy", None
    monkeypatch.setattr(plugins, "_dispatch_pre_tool_call_hooks", block)
    out = session._respond_browser_tool({
        "threadId": "remote-desktop", "turnId": "turn", "callId": "blocked",
        "tool": "drive_preview", "arguments": {"action": "click", "ref": "btn-example"},
    })
    assert not out["success"]
    assert seen == [("drive_preview", "remote-desktop")]
    assert not calls

    # Start advertises the actual session schemas; resume keeps Codex's stored
    # registry rather than attempting unsupported mid-thread tool replacement.
    from agent.transports.codex_app_server_session import CodexAppServerSession
    wire = []
    class Client:
        def __init__(self, **kwargs):
            pass

        def initialize(self, **kwargs):
            wire.append(("initialize", kwargs))

        def request(self, method, params, **kwargs):
            wire.append((method, params))
            return {"thread": {"id": "thread-browser"}}

    for resume_id in (None, "thread-browser"):
        transport = CodexAppServerSession(
            browser_tools=bridge, client_factory=Client, resume_thread_id=resume_id,
        )
        assert transport.ensure_started() == "thread-browser"
        assert wire[-2][1]["capabilities"]["experimentalApi"] is True
        if resume_id is None:
            assert wire[-1][1]["dynamicTools"] == bridge.definitions()
        else:
            assert wire[-1][0] == "thread/resume"
            assert "dynamicTools" not in wire[-1][1]
