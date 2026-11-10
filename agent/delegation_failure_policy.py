"""Opt-in delegated-task termination after a tool failure, without a model retry."""
from __future__ import annotations

import json


def record_tool_failure(agent, tool_name: str, result, *, is_error: bool) -> None:
    if (is_error and getattr(agent, "_delegate_stop_on_tool_error", False)
            and getattr(agent, "_delegate_tool_failure", None) is None):
        agent._delegate_tool_failure = (tool_name, result)


def tool_failure_response(agent) -> str | None:
    failure = getattr(agent, "_delegate_tool_failure", None)
    if failure is None:
        return None
    name, result = failure
    body = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False, default=str)
    return f"Stopped after {name} failed, as requested. No subsequent tool calls were started.\n\n{body}"
