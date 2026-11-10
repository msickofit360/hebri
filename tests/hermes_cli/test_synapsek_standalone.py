"""Standalone account security boundaries, real encrypted storage and HTTP wire."""
import asyncio
import json
from pathlib import Path
import sys

import httpx
import pytest


@pytest.fixture(autouse=True)
def isolate(tmp_path, monkeypatch):
    for name in ("HOME", "USERPROFILE", "HERMES_HOME", "HEBRI_HOME"):
        monkeypatch.setenv(name, str(tmp_path))
    monkeypatch.setattr(Path, "home", lambda: tmp_path)


class MemoryKeyring:
    def __init__(self):
        self.keys = {}
    def get_password(self, service, user):
        return self.keys.get((service, user))
    def set_password(self, service, user, value):
        self.keys[service, user] = value


def test_cli_sign_in_status_does_not_print_account_details(monkeypatch, capsys):
    from types import SimpleNamespace
    from hermes_cli import synapsek_account
    monkeypatch.setattr(synapsek_account, "run_account", lambda *args, **kwargs: {
        "state": "signed_in", "account": {"email": "private-account@example.test",
        "billing": {"plan": "private-plan"}, "managedInferenceEnabled": False}})
    synapsek_account.cli(SimpleNamespace(synapsek_action="status"))
    output = capsys.readouterr()
    assert "Signed in to Synapsek" in output.out
    assert "private-account" not in output.out + output.err
    assert "private-plan" not in output.out + output.err


def test_rejected_incomplete_body_cannot_hold_the_account_bridge_open(tmp_path):
    from http.client import HTTPConnection
    from hermes_cli.synapsek_bridge import start_bridge
    server, _ = start_bridge(tmp_path, account_call=lambda *a, **kw: pytest.fail("Unauthenticated broker call"))
    client = HTTPConnection("127.0.0.1", server.server_port, timeout=3)
    try:
        client.putrequest("POST", "/v1/connectors")
        client.putheader("Content-Length", "512000")
        client.endheaders(b"{")
        response = client.getresponse()
        assert response.status == 401
        assert json.loads(response.read())["error"]["code"] == "unauthenticated"
    finally:
        client.close()
        server.shutdown(); server.server_close()


def test_protected_store_encryption_rotation_and_bit_isolation(tmp_path):
    from hermes_cli.synapsek_store import AccountStore
    keyring = MemoryKeyring()
    a, b = AccountStore(tmp_path / "a", keyring), AccountStore(tmp_path / "b", keyring)
    ciphertext = a.execute("encrypt", "refresh-token-a")
    a.execute("write", ciphertext)
    assert "refresh-token-a" not in a.file.read_text()
    assert a.execute("decrypt", a.execute("read")) == "refresh-token-a"
    with pytest.raises(Exception):
        b.execute("decrypt", ciphertext)
    b.execute("encrypt", "b")
    with pytest.raises(Exception):
        b.execute("decrypt", ciphertext)
    a.execute("write", a.execute("encrypt", "rotated-token-a"))
    assert a.execute("decrypt", a.execute("read")) == "rotated-token-a"
    a.execute("clear")
    assert a.execute("read") is None


@pytest.mark.skipif(sys.platform != "win32", reason="Native Windows credential vault")
def test_real_windows_keychain_roundtrip(tmp_path):
    from hermes_cli.synapsek_store import AccountStore, native_keyring, SERVICE
    backend = native_keyring()
    store = AccountStore(tmp_path, backend)
    try:
        encrypted = store.execute("encrypt", "disposable-test-value")
        assert store.execute("decrypt", encrypted) == "disposable-test-value"
        assert "disposable-test-value" not in encrypted
    finally:
        if backend.get_password(SERVICE, store.identity) is not None:
            backend.delete_password(SERVICE, store.identity)


def test_bridge_auth_retries_owner_binding_and_tool_stream(tmp_path, monkeypatch):
    from hermes_cli.synapsek_bridge import start_bridge
    from hermes_cli.synapsek_account import AccountError
    owner = ["user-a"]
    requests = []
    def account(action, **kwargs):
        if action == "status":
            return {"state": "signed_in", "account": {"userId": owner[0]}}
        requests.append((action, kwargs))
        if kwargs["expected_user_id"] != owner[0]:
            raise AccountError("account_mismatch")
        if action == "models":
            return {"data": [{"id": "synapsek-auto"}]}
        return {"id": "test", "created": 1, "model": "synapsek-auto", "usage": {"total_tokens": 3},
                "choices": [{"index": 0, "message": {"role": "assistant", "content": None, "tool_calls": [
                    {"id": "call1", "type": "function", "function": {"name": "read_file", "arguments": "{}"}}]},
                    "finish_reason": "tool_calls"}]}
    server, credentials = start_bridge(tmp_path, account)
    from hermes_cli import synapsek_bridge
    from hermes_cli.synapsek_store import AccountStore
    AccountStore(tmp_path).file.write_text("encrypted-fixture")
    monkeypatch.setitem(synapsek_bridge._bridges, str(tmp_path.resolve()), (server, credentials))
    monkeypatch.delenv("HEBRI_SYNAPSEK_BRIDGE_TOKEN", raising=False)
    monkeypatch.delenv("HEBRI_SYNAPSEK_BRIDGE_URL", raising=False)
    from hermes_cli.runtime_provider import resolve_runtime_provider
    runtime = resolve_runtime_provider(requested="synapsek", target_model="synapsek-auto")
    assert runtime["api_key"] == credentials["api_key"]
    assert runtime["base_url"] == credentials["base_url"]
    if (tmp_path / "auth.json").exists():
        assert credentials["api_key"] not in (tmp_path / "auth.json").read_text()
    headers = {"Authorization": f"Bearer {credentials['api_key']}"}
    try:
        with httpx.Client(base_url=credentials["base_url"], trust_env=False) as client:
            assert client.get("/models").status_code == 401
            assert client.get("/models", headers={**headers, "Origin": "https://evil.invalid"}).status_code == 401
            assert client.get("/models", headers={**headers, "Host": "evil.invalid"}).status_code == 401
            assert client.get("/models", headers={**headers, "x-stainless-retry-count": "1"}).status_code == 409
            assert not requests
            for _ in range(10):
                denied = client.post("/connectors", headers={**headers, "Origin": "https://evil.invalid"}, json={})
                assert denied.status_code == 401
                assert int(denied.headers["Content-Length"]) == len(denied.content)
            assert client.post("/connectors", headers=headers, json={"value": "x" * 24_001}).status_code == 413
            assert not requests
            assert client.post("/connectors", headers=headers, json={"command": {"action": "catalog"}}).status_code == 200
            assert requests[-1][0] == "connectors"
            assert requests[-1][1]["expected_user_id"] == "user-a"
            assert client.get("/models", headers=headers).json()["data"][0]["id"] == "synapsek-auto"
            response = client.post("/chat/completions", headers=headers, json={"stream": True, "stream_options": {"include_usage": True}})
            assert response.status_code == 200
            chunks = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: {")]
            assert chunks[0]["choices"][0]["delta"]["tool_calls"][0]["index"] == 0
            assert chunks[1]["choices"][0]["finish_reason"] == "tool_calls"
            assert chunks[2]["usage"]["total_tokens"] == 3
            owner[0] = "user-b"
            assert client.get("/models", headers=headers).status_code == 409
    finally:
        server.shutdown(); server.server_close()


def test_account_model_selection_preserves_other_config(tmp_path):
    from hermes_cli.synapsek_account import select_synapsek
    import yaml
    path = tmp_path / "config.yaml"
    path.write_text("# personal settings\nmodel:\n  provider: custom\n  base_url: https://old.invalid\nterminal:\n  backend: docker\n")
    select_synapsek(tmp_path)
    result = yaml.safe_load(path.read_text())
    assert result["model"] == {"provider": "synapsek", "default": "synapsek-auto"}
    assert result["terminal"]["backend"] == "docker"
    assert "# personal settings" in path.read_text()


def test_browser_account_routes_reject_unauthenticated_and_remote(monkeypatch):
    from fastapi.testclient import TestClient
    from hermes_cli.web_server import app
    import hermes_cli.web_server as web
    client = TestClient(app, client=("127.0.0.1", 1234))
    for path in ("/api/synapsek/account", "/api/synapsek/account/login", "/api/synapsek/account/logout"):
        response = client.get(path) if path.endswith("account") else client.post(path, json={})
        assert response.status_code == 401
    monkeypatch.setattr(web, "_has_valid_session_token", lambda _request: True)
    remote = TestClient(app, client=("203.0.113.1", 1234))
    assert remote.get("/api/synapsek/account?profile=default").status_code == 403
    assert client.get("/api/synapsek/account?profile=default").json() == {"state": "signed_out"}
    assert client.post("/api/synapsek/account/logout?profile=default", json={}).status_code == 400


@pytest.mark.parametrize("action,expected", [("add", "login"), ("status", "status"), ("logout", "logout")])
def test_legacy_account_commands_use_secure_controller(action, expected, monkeypatch):
    from types import SimpleNamespace
    from hermes_cli.auth_commands import auth_command
    from hermes_cli import synapsek_account
    called = []
    monkeypatch.setattr(synapsek_account, "cli", lambda args: called.append(args))
    auth_command(SimpleNamespace(auth_action=action, provider="synapsek", no_browser=True))
    assert called[0].synapsek_action == expected
    assert called[0].no_browser


def test_synapsek_refuses_api_key_and_pool_operations(monkeypatch):
    from types import SimpleNamespace
    from hermes_cli.auth_commands import auth_command
    from hermes_cli import synapsek_account
    monkeypatch.setattr(synapsek_account, "cli", lambda _args: pytest.fail("must not start account flow"))
    with pytest.raises(SystemExit, match="account sign-in"):
        auth_command(SimpleNamespace(auth_action="add", provider="synapsek", api_key="not-an-account"))
    with pytest.raises(SystemExit, match="separate from API-key pools"):
        auth_command(SimpleNamespace(auth_action="remove", provider="synapsek", target="1"))


@pytest.mark.parametrize("packaged", [False, True])
def test_account_helper_uses_installed_bundle_without_build(tmp_path, monkeypatch, packaged):
    from hermes_cli.synapsek_account import account_entry
    from hermes_cli import main_tui_launch
    bundle = tmp_path / "hermes_cli" / "tui_dist" if packaged else tmp_path / "external" / "dist"
    bundle.mkdir(parents=True)
    (bundle / "entry.js").touch()
    helper = bundle / "account-client.js"
    helper.touch()
    monkeypatch.delenv("HERMES_TUI_DIR", raising=False)
    if not packaged:
        monkeypatch.setenv("HERMES_TUI_DIR", str(bundle.parent))
    monkeypatch.setattr(main_tui_launch, "_make_tui_argv", lambda *_args, **_kwargs: pytest.fail("no source build"))
    assert account_entry(tmp_path) == helper


def test_account_helper_rebuilds_stale_checkout(tmp_path, monkeypatch):
    from hermes_cli.synapsek_account import account_entry
    from hermes_cli import main_tui_launch
    monkeypatch.delenv("HERMES_TUI_DIR", raising=False)
    helper = tmp_path / "ui-tui" / "dist" / "account-client.js"
    helper.parent.mkdir(parents=True)
    helper.touch()
    monkeypatch.setattr(main_tui_launch, "_tui_need_rebuild", lambda _root: True)
    builds = []
    monkeypatch.setattr(main_tui_launch, "_make_tui_argv", lambda root, **_kwargs: builds.append(root))
    assert account_entry(tmp_path) == helper
    assert builds == [tmp_path / "ui-tui"]


def test_model_picker_never_persists_inference_capability(tmp_path, monkeypatch):
    from hermes_cli import auth, models, model_setup_flows_common as common
    from hermes_cli.model_setup_flows import _model_flow_api_key_provider
    import yaml
    monkeypatch.setattr(auth, "resolve_api_key_provider_credentials", lambda _provider: {
        "api_key": "ephemeral-secret", "base_url": "http://127.0.0.1:12345/v1"})
    monkeypatch.setattr(models, "fetch_api_models", lambda *_args: ["synapsek-auto"])
    monkeypatch.setattr(common, "_pick_model_or_prompt", lambda *_args, **_kwargs: "synapsek-auto")
    _model_flow_api_key_provider({}, "synapsek")
    text = (tmp_path / "config.yaml").read_text()
    assert "ephemeral-secret" not in text and "12345" not in text
    config = yaml.safe_load(text)
    assert config["model"]["provider"] == "synapsek"
    assert config["model"]["default"] == "synapsek-auto"
