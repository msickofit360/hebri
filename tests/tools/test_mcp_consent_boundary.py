"""MCP hints cannot grant authority; profile trust and reviewed arguments stay local."""
from types import SimpleNamespace
import asyncio
import json


def test_untrusted_hints_cannot_bypass_consent_or_cross_profile(tmp_path, monkeypatch):
    from agent.secret_scope import set_multiplex_active
    from hermes_constants import set_hermes_home_override, reset_hermes_home_override
    from tools import mcp_tool as core, mcp_tool_handlers as handlers
    from tools.mcp_tool_registration import _record_tool_trust_metadata

    prompts = []
    monkeypatch.setattr(core, "_server_trust_levels", {})
    monkeypatch.setattr(core, "_tool_read_only_hints", {})
    monkeypatch.setattr("tools.approval_prompt.request_elicitation_consent",
                        lambda *args, **kw: prompts.append(args) or "decline")
    monkeypatch.setattr(handlers, "_acquire_call_server",
                        lambda *args: (_ for _ in ()).throw(AssertionError("denied request acquired transport")))
    set_multiplex_active(True)
    try:
        for name, policy in [("a", {"trust": "full"}), ("b", {}), ("a", {"trust": "full"})]:
            home = tmp_path / name
            home.mkdir(exist_ok=True)
            token = set_hermes_home_override(home)
            try:
                _record_tool_trust_metadata("same-server", policy, [SimpleNamespace(name="claimed_read", annotations={"readOnlyHint": True})])
                if name == "a":
                    assert handlers._trust_gate_check("same-server", "claimed_read", {}) is None
                    assert handlers._tool_is_read_only("same-server", "claimed_read")
                else:
                    result = handlers._make_tool_handler("same-server", "claimed_read", 1)({"target": "production"})
                    assert "did not approve" in json.loads(result)["error"]
                    assert not handlers._tool_is_read_only("same-server", "claimed_read")
                    assert '"target": "production"' in prompts[-1][0]
            finally:
                reset_hermes_home_override(token)
        assert len(prompts) == 1
    finally:
        set_multiplex_active(False)


def test_approved_arguments_are_frozen_and_missing_or_failed_consent_blocks(monkeypatch):
    from tools import mcp_tool as core, mcp_tool_handlers as handlers
    monkeypatch.setattr(core, "_server_trust_levels", {})
    original = {"payload": {"target": "reviewed"}}
    seen = []

    def approve(message, description, **kwargs):
        assert '"target": "reviewed"' in message
        original["payload"]["target"] = "changed-after-review"
        return "accept"

    monkeypatch.setattr("tools.approval_prompt.request_elicitation_consent", approve)
    monkeypatch.setattr(handlers, "_check_circuit_breaker", lambda *_: None)
    async def call_tool(name, arguments):
        seen.append(arguments)
        return SimpleNamespace(content=[], isError=False)
    server = SimpleNamespace(_rpc_lock=asyncio.Lock(), session=SimpleNamespace(call_tool=call_tool))
    monkeypatch.setattr(handlers, "_acquire_call_server", lambda *_: (server, None))
    monkeypatch.setattr(handlers._loop, "_run_on_mcp_loop", lambda call, **kw: asyncio.run(call()))
    handlers._make_tool_handler("unknown", "write", 1)(original)
    assert seen == [{"payload": {"target": "reviewed"}}]
    def unavailable(*args, **kwargs):
        raise RuntimeError("approval surface unavailable")
    monkeypatch.setattr("tools.approval_prompt.request_elicitation_consent", unavailable)
    assert "blocked" in handlers._make_tool_handler("unknown", "write", 1)({})
    assert len(seen) == 1
    # Even a typed HTTP 401 after dispatch cannot replay an approved write.
    import httpx
    monkeypatch.setattr("tools.approval_prompt.request_elicitation_consent", lambda *a, **k: "accept")
    async def ambiguous(name, arguments):
        seen.append(arguments)
        response = httpx.Response(401, request=httpx.Request("POST", "https://example.test/mcp"))
        response.raise_for_status()
    server.session.call_tool = ambiguous
    result = json.loads(handlers._make_tool_handler("unknown", "write", 1)({"target": "once"}))
    assert result["outcome_uncertain"] is True
    assert len(seen) == 2
