"""The authenticated broker's bounded operation inputs survive tool discovery."""
from tools.connectors.gateway import synapsek
from tools.connectors.gateway.client import ConnectorClient


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
