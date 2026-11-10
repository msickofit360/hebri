import asyncio
import json
import pytest


class MemoryKeyring:
    def __init__(self):
        self.keys = {}
    def get_password(self, service, identity):
        return self.keys.get((service, identity))
    def set_password(self, service, identity, value):
        self.keys[service, identity] = value


def test_real_sdk_token_storage_migrates_and_keeps_servers_and_bits_separate(tmp_path, monkeypatch):
    from tools.mcp_oauth import HermesTokenStorage
    from tools.mcp_oauth_storage import read_oauth_json
    from mcp.shared.auth import OAuthToken
    keys = MemoryKeyring()
    monkeypatch.setattr("hermes_cli.synapsek_store.native_keyring", lambda: keys)
    homes = [tmp_path / "a", tmp_path / "b"]
    for home in homes:
        (home / "mcp-tokens").mkdir(parents=True)
    legacy = homes[0] / "mcp-tokens/service.json"
    legacy.write_text(json.dumps({"access_token": "legacy-access", "refresh_token": "legacy-refresh", "token_type": "Bearer", "hermes_issuer": "https://issuer.example"}))
    a = HermesTokenStorage("service", hermes_home=homes[0])
    assert asyncio.run(a.get_tokens()).access_token == "legacy-access"
    assert a.loaded_issuer == "https://issuer.example"
    assert "legacy-refresh" not in legacy.read_text()
    for home in [homes[0], homes[1], homes[0]]:
        store = HermesTokenStorage("service", hermes_home=home)
        if home == homes[1]:
            asyncio.run(store.set_tokens(OAuthToken(access_token="b-only", token_type="Bearer")))
        assert asyncio.run(store.get_tokens()).access_token == ("legacy-access" if home == homes[0] else "b-only")
    copied = homes[0] / "mcp-tokens/other.json"
    copied.write_bytes(legacy.read_bytes())
    with pytest.raises(RuntimeError, match="cannot be unlocked"):
        read_oauth_json(copied)
    from hermes_cli.profiles import _clone_all_copytree_ignore, _EXPORT_CREDENTIAL_FILES
    assert "mcp-tokens" in _clone_all_copytree_ignore(homes[0])(str(homes[0]), ["mcp-tokens"])
    assert "mcp-tokens" in _EXPORT_CREDENTIAL_FILES


def test_locked_os_store_preserves_legacy_credentials_without_plaintext_fallback(tmp_path, monkeypatch):
    from tools.mcp_oauth_storage import read_oauth_json, write_oauth_json
    path = tmp_path / "mcp-tokens/service.json"
    path.parent.mkdir()
    original = '{"access_token":"keep-original-until-migration-succeeds"}'
    path.write_text(original)
    def locked():
        raise RuntimeError("OS store locked")
    monkeypatch.setattr("hermes_cli.synapsek_store.native_keyring", locked)
    with pytest.raises(RuntimeError):
        read_oauth_json(path)
    with pytest.raises(RuntimeError):
        write_oauth_json(path, {"access_token": "replacement"})
    assert path.read_text() == original


def test_client_rotation_invalidates_tokens_without_logging_stored_identity(tmp_path, monkeypatch, caplog):
    from tools.mcp_oauth import HermesTokenStorage, _invalidate_tokens_on_client_change
    from tools.mcp_oauth_storage import write_oauth_json
    monkeypatch.setattr("hermes_cli.synapsek_store.native_keyring", lambda: keys)
    keys = MemoryKeyring()
    store = HermesTokenStorage("service", hermes_home=tmp_path)
    write_oauth_json(store._client_info_path(), {"client_id": "private-old-client", "client_secret": "private-client-secret"})
    write_oauth_json(store._tokens_path(), {"access_token": "private-access-token"})
    store._meta_path().write_text("{}")
    _invalidate_tokens_on_client_change(store, "private-old-client", "private-client-secret")
    assert store._tokens_path().exists()
    _invalidate_tokens_on_client_change(store, "private-new-client", "replacement-secret")
    assert not store._tokens_path().exists() and not store._meta_path().exists()
    assert "Re-authorize" in caplog.text
    for value in ("private-old-client", "private-new-client", "private-client-secret", "private-access-token", "replacement-secret"):
        assert value not in caplog.text
