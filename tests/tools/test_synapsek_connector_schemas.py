"""The authenticated broker's bounded operation inputs survive tool discovery."""
import json

from tools.connectors.dispatch import dispatch_connector_call
from tools.connectors.gateway import synapsek
from tools.connectors.gateway.client import ConnectorClient
from tools.connectors.gateway.bridge import run_remote
from tools.connectors.gateway.errors import GatewayUnavailable
from tools.connectors.gateway.merge import partition_calls
from tools.tool_search import dispatch_tool_describe, dispatch_tool_search


def test_accounting_pagination_survives_real_connector_discovery(monkeypatch):
    schema = {"type": "object", "properties": {"page": {"type": "integer", "minimum": 1, "maximum": 10000, "default": 1}}, "additionalProperties": False}
    calls = []

    def command(body):
        calls.append(body)
        if body["action"] == "catalog":
            return {"items": [{"id": "quickbooks", "name": "QuickBooks", "connected": True, "allowWrites": False,
                               "operations": [{"tool": "quickbooks.invoices", "label": "Read invoices", "write": False, "inputSchema": schema}]}]}
        return {"data": {"items": [], "page": 2, "nextPage": None}}

    monkeypatch.setattr(synapsek, "command", command)
    result = ConnectorClient().search([{"useCase": "Read QuickBooks invoices"}])
    discovered = next(value for value in result["schemas"].values() if value["tool"] == "invoices")
    assert discovered["input_schema"] == schema
    result = synapsek.request("POST", "v1/connectors/execute", {"tools": [{"connector": "quickbooks", "tool": "invoices", "arguments": {"page": 2}}]})
    assert result["results"][0]["data"]["page"] == 2
    assert calls[-1] == {"action": "execute", "request": {"tool": "quickbooks.invoices", "arguments": {"page": 2}}}


def test_older_catalog_keeps_strict_write_and_empty_read_inputs():
    _, read = synapsek._schema("github", {"tool": "github.repositories", "label": "Repositories", "write": False})
    assert read["inputSchema"] == {"type": "object", "properties": {}, "required": [], "additionalProperties": False}
    _, write = synapsek._schema("slack", {"tool": "slack.post_channel_message", "label": "Post", "write": True})
    assert set(write["inputSchema"]["required"]) == {"channel", "text"}
    assert write["inputSchema"]["additionalProperties"] is False


def test_chat_search_describe_and_dispatch_distinguish_providers(tmp_path, monkeypatch):
    monkeypatch.setenv("HEBRI_HOME", str(tmp_path))
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setattr(synapsek, "available", lambda: True)
    schemas = {
        "quickbooks": {"type": "object", "properties": {"page": {"type": "integer"}}},
        "xero": {"type": "object", "properties": {"cursor": {"type": "string"}}},
    }
    catalog = [
        {"id": provider, "connected": True, "operations": [
            {"tool": f"{provider}.invoices", "label": "List invoices", "write": False,
             "inputSchema": schema}]}
        for provider, schema in schemas.items()
    ]
    calls = []

    def broker(body):
        if body["action"] == "catalog":
            return {"items": catalog}
        assert body["action"] == "execute"
        calls.append(body["request"])
        return {"data": {"operation": body["request"]["tool"]}}

    monkeypatch.setattr(synapsek, "command", broker)
    scope = [{"type": "function", "function": {"name": "manage_connections"}}]
    search = json.loads(dispatch_tool_search({"queries": ["invoices"]}, current_tool_defs=scope))
    names = search["results"][0]["matches"]
    assert set(names) == {"connectors__quickbooks__invoices", "connectors__xero__invoices"}
    descriptions = json.loads(dispatch_tool_describe({"names": names}, current_tool_defs=scope))
    arguments = {"quickbooks": {"page": 2}, "xero": {"cursor": "next-page"}}
    for provider, schema in schemas.items():
        name = f"connectors__{provider}__invoices"
        assert descriptions["tools"][name]["parameters"] == schema
        response = json.loads(dispatch_connector_call(name, arguments[provider], "fixture"))
        assert response == {"response": {"operation": f"{provider}.invoices"}}
    assert calls == [
        {"tool": f"{provider}.invoices", "arguments": args} for provider, args in arguments.items()
    ]


def test_current_and_cached_chat_names_check_the_same_slack_receipt(tmp_path, monkeypatch):
    monkeypatch.setenv("HEBRI_HOME", str(tmp_path))
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setattr(synapsek, "available", lambda: True)
    calls = []

    def broker(body):
        if body["action"] == "catalog":
            return {"items": [{"id": "slack", "connected": True, "operations": []}]}
        calls.append(body)
        return {"status": "completed"}

    monkeypatch.setattr(synapsek, "command", broker)
    scope = [{"type": "function", "function": {"name": "manage_connections"}}]
    names = ["connectors__slack__approval_status", "connectors__slack__connectors__slack__approval_status"]
    descriptions = json.loads(dispatch_tool_describe({"names": names}, current_tool_defs=scope))
    receipt = {"approvalId": "receipt-from-the-broker"}
    for name in names:
        assert descriptions["tools"][name]["parameters"]["required"] == ["approvalId"]
        assert json.loads(dispatch_connector_call(name, receipt, "fixture")) == {
            "response": {"status": "completed"}
        }
    assert calls == [{"action": "receipt", **receipt}] * len(names)


def test_partial_gateway_batch_keeps_completed_read_and_skips_unstarted_calls(monkeypatch):
    attempted = []

    def broker(body):
        tool = body["request"]["tool"]
        attempted.append(tool)
        if tool == "quickbooks.invoices":
            return {"data": {"page": 2}}
        raise GatewayUnavailable("The service is unavailable.", code="SYNAPSEK_UNAVAILABLE")

    monkeypatch.setattr(synapsek, "command", broker)
    calls = [{"name": "connectors__quickbooks__" + tool, "arguments": {}}
             for tool in ("invoices", "customers", "suppliers")]
    plans = partition_calls(calls).remote
    results = run_remote(plans, None, availability=lambda: True, client_factory=None)
    assert attempted == ["quickbooks.invoices", "quickbooks.customers"]
    assert [item["name"] for item in results] == [call["name"] for call in calls]
    assert results[0]["response"] == {"page": 2}
    assert results[1]["error"]["code"] == "PROVIDER_ERROR"
    assert "service is unavailable" in results[1]["error"]["message"]
    assert "not attempted" in results[2]["error"]["message"]
