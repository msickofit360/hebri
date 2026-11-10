"""Real connector adapters and profile encryption; no production credentials or requests."""
import json
from uuid import uuid4

import pytest


class MemoryKeyring:
    def __init__(self):
        self.keys = {}

    def get_password(self, service, identity):
        return self.keys.get((service, identity))

    def set_password(self, service, identity, value):
        self.keys[service, identity] = value


def test_bit_capabilities_are_encrypted_and_follow_a_b_a_profiles(tmp_path, monkeypatch):
    from hermes_cli.synapsek_store import AccountStore
    from tools.connectors.gateway import synapsek
    keyring = MemoryKeyring()
    homes = [tmp_path / "a", tmp_path / "b"]
    monkeypatch.setattr("hermes_cli.synapsek_store.native_keyring", lambda: keyring)
    identities, requests = {}, []

    def account(body):
        if body.get("action") == "register":
            identity = {"id": str(uuid4()), "secret": uuid4().hex + uuid4().hex}
            identities[body["label"]] = identity
            return identity
        requests.append(body)
        return {"bitId": body["bitId"], "items": []}

    for home in [homes[0], homes[1], homes[0]]:
        monkeypatch.setenv("HERMES_HOME", str(home))
        monkeypatch.setenv("HEBRI_HOME", str(home))
        result = synapsek.command({"action": "catalog"}, account_call=account)
        assert result["bitId"] == identities[home.name]["id"]
        assert "secret" not in result
        assert identities[home.name]["secret"] not in (home / "synapsek-connectors.enc.json").read_text()
    assert requests[0]["bitId"] == requests[2]["bitId"] != requests[1]["bitId"]
    a, b = [AccountStore(home, keyring) for home in homes]
    with pytest.raises(Exception):
        b.execute("decrypt", (a.home / "synapsek-connectors.enc.json").read_text())


def test_synapsek_gateway_and_desktop_wire_contracts_without_nous_credentials(monkeypatch):
    from tools.connectors.gateway import synapsek
    from tools.connectors.gateway.client import ConnectorClient
    from tools.connectors.portal.client import PortalConnectorClient
    from tools.connectors.gateway.wire import ConnectorExecuteResponse
    calls = []
    item = {"id": "slack", "name": "Slack", "connected": True, "revision": "grant-a", "allowWrites": False,
            "approvedAt": "2026-11-09T00:00:00Z", "operations": [
                {"tool": "slack.channels", "label": "List Slack channels", "write": False},
                {"tool": "slack.post_channel_message", "label": "Post Slack message", "write": True}]}

    def command(body):
        calls.append(body)
        if body["action"] == "catalog":
            return {"items": [item], "bitId": "bit-a"}
        if body["action"] == "execute":
            return {"approvalRequired": True, "approvalId": "approval-a", "url": "https://synapseklabs.org/hebri/connect#bit=a&approval=a"}
        if body["action"] == "receipt":
            return {"status": "completed", "result": {"posted": True}}
        return {"disconnected": True}

    monkeypatch.setattr(synapsek, "command", command)
    monkeypatch.setattr("tools.connectors.portal.client.read_nous_access_token", lambda: pytest.fail("No Nous identity may be read"))
    client, portal = ConnectorClient(), PortalConnectorClient()
    assert client.list_connectors()[0]["connector"] == "slack"
    assert client.account_status("slack")["active"]
    assert portal.catalog().connectors[0].name == "Slack"
    assert portal.list_accounts()[0]["connector"] == "slack"
    assert portal.tools("slack").tools[1].facet == "write"
    assert portal.policy().effective.tools["slack"].disable == ["post_channel_message"]
    assert portal.authorization_token() is None
    assert portal.cache_identity() == "bit-a"
    assert client.search([{"useCase": "Slack channels"}])["schemas"]
    with pytest.raises(Exception, match="cannot expand"):
        portal.set_policy({"mode": "unrestricted"})
    result = ConnectorExecuteResponse.model_validate(synapsek.request("POST", "v1/connectors/execute", {
        "tools": [{"connector": "slack", "tool": "post_channel_message", "arguments": {"channel": "C1234567890", "text": "hello"}}]}))
    assert result.error_count == 1 and result.total_count == 1
    assert "approval_status" in result.results[0].error.hint
    receipt = synapsek.request("POST", "v1/connectors/execute", {"tools": [{"connector": "slack", "tool": "approval_status", "arguments": {"approvalId": "approval-a"}}]})
    assert receipt["results"][0]["data"]["status"] == "completed"
    assert sum(call["action"] == "execute" for call in calls) == 1


def test_capabilities_excluded_from_clone_and_export(tmp_path, monkeypatch):
    import tarfile
    from hermes_cli import profiles
    from hermes_cli.profiles import _clone_all_copytree_ignore, export_profile
    root = tmp_path / "source"
    root.mkdir()
    names = ["synapsek-connectors.enc.json", "synapsek-account.enc.json", "config.yaml"]
    for name in names:
        (root / name).write_text("test fixture")
    ignored = _clone_all_copytree_ignore(root)(str(root), names)
    assert set(names[:2]).issubset(ignored)
    monkeypatch.setattr(profiles, "_existing_profile_dir", lambda name: ("source", root))
    archive = tmp_path / "export.tar.gz"
    export_profile("source", str(archive))
    with tarfile.open(archive) as tar:
        exported = tar.getnames()
    assert not any(name.endswith(tuple(names[:2])) for name in exported)
    assert all((root / name).exists() for name in names)


def test_external_approval_links_and_non_loopback_brokers_are_rejected(monkeypatch):
    from tools.connectors.gateway import synapsek
    for url in ["https://evil.example/hebri/connect", "https://synapseklabs.org.evil.example/hebri/connect", "http://synapseklabs.org/hebri/connect", "https://synapseklabs.org/hebri/connect?redirect=evil"]:
        with pytest.raises(Exception, match="Invalid approval"):
            synapsek._approval_url(url)
    monkeypatch.setattr("hermes_cli.auth.resolve_api_key_provider_credentials", lambda _: {"api_key": "secret", "base_url": "https://evil.example/v1"})
    monkeypatch.setattr(synapsek, "available", lambda: True)
    monkeypatch.setattr(synapsek.requests, "post", lambda *a, **k: pytest.fail("Must not transmit capability"))
    with pytest.raises(Exception):
        synapsek._account_call({"secret": "capability"})


def test_loopback_transport_ignores_proxy_settings_and_rebind_never_reuses_old_grants(tmp_path, monkeypatch):
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    from threading import Thread
    from hermes_cli.synapsek_store import AccountStore
    from tools.connectors.gateway import synapsek
    from tools.connectors.gateway.errors import GatewayUnavailable

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass
        def do_POST(self):
            assert self.headers["Authorization"] == "Bearer local-test-capability"
            self.rfile.read(int(self.headers["Content-Length"]))
            self.send_response(200); self.end_headers(); self.wfile.write(b'{"items": []}')

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True); thread.start()
    monkeypatch.setenv("HTTP_PROXY", "http://127.0.0.1:1"); monkeypatch.setenv("NO_PROXY", "")
    monkeypatch.setattr(synapsek, "available", lambda: True)
    sent_urls = []
    class RecordingSession(synapsek.requests.Session):
        def post(self, url, **kwargs):
            sent_urls.append(url)
            return super().post(url, **kwargs)
    monkeypatch.setattr(synapsek.requests, "Session", RecordingSession)
    monkeypatch.setattr("hermes_cli.auth.resolve_api_key_provider_credentials", lambda _: {
        "api_key": "local-test-capability", "base_url": f"http://127.0.0.1:0{server.server_port}/v1"})
    try:
        assert synapsek._account_call({"command": {"action": "catalog"}}) == {"items": []}
        assert sent_urls == [f"http://127.0.0.1:{server.server_port}/v1/connectors"]
    finally:
        server.shutdown(); server.server_close(); thread.join()

    store = AccountStore(tmp_path, MemoryKeyring())
    count, old = [0], [None]
    def account(body):
        if body.get("action") == "register":
            count[0] += 1
            return {"id": str(uuid4()), "secret": "a" * 64}
        if body["bitId"] == old[0]:
            raise GatewayUnavailable("New session", code="connector_binding_required")
        return {"bitId": body["bitId"], "items": []}
    old[0] = synapsek.command({"action": "catalog"}, store=store, account_call=account)["bitId"]
    rebound = synapsek.command({"action": "catalog"}, store=store, account_call=account)
    assert rebound["bitId"] != old[0] and rebound["items"] == [] and count[0] == 2
    def ambiguous(_body):
        raise GatewayUnavailable("timeout", code="SYNAPSEK_UNAVAILABLE")
    with pytest.raises(GatewayUnavailable):
        synapsek.command({"action": "execute"}, store=store, account_call=ambiguous)
    assert count[0] == 2
