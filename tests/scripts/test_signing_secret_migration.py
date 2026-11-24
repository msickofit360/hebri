"""Exercise real sealed-box encryption with disposable keys, never signing data."""

import base64
import json
import sys
from datetime import datetime, timezone

import pytest
from nacl.exceptions import CryptoError
from nacl.public import PrivateKey, SealedBox

from scripts.ci import seal_macos_signing_secrets as migration

SECRET_NAMES = migration.SECRET_NAMES


@pytest.fixture
def migration_context(monkeypatch, tmp_path):
    destination = PrivateKey.generate()
    values = {name: f"synthetic-{name}\n\u00e9\n" for name in SECRET_NAMES}
    for name, value in values.items():
        monkeypatch.setenv(name, value)
    for name, value in {
        "GITHUB_REPOSITORY": "Synapsek-Labs/hebri",
        "GITHUB_REF": "refs/heads/main",
        "GITHUB_EVENT_NAME": "workflow_dispatch",
        "GITHUB_SHA": "a" * 40,
        "GITHUB_RUN_ID": "123",
        "GITHUB_RUN_ATTEMPT": "1",
        "RUNNER_TEMP": str(tmp_path),
    }.items():
        monkeypatch.setenv(name, value)
    monkeypatch.setattr(sys, "argv", ["seal_macos_signing_secrets.py"])
    monkeypatch.setattr(migration, "PUBLIC_KEY", base64.b64encode(bytes(destination.public_key)).decode())
    monkeypatch.setattr(migration, "EXPIRES", datetime.max.replace(tzinfo=timezone.utc))
    return destination, values, tmp_path / "macos-signing-migration.json"


def test_only_destination_can_recover_exact_original_values(migration_context, capsys):
    destination, values, output = migration_context
    other = PrivateKey.generate()
    assert migration.main() == 0
    payload = json.loads(output.read_text(encoding="utf-8"))
    assert payload["environment"] == migration.ENVIRONMENT
    assert payload["key_id"] == migration.KEY_ID
    assert payload["commit"] == "a" * 40
    sealed = payload["encrypted_values"]
    assert set(sealed) == set(values)
    for name, ciphertext in sealed.items():
        raw = base64.b64decode(ciphertext, validate=True)
        assert SealedBox(destination).decrypt(raw).decode("utf-8") == values[name]
        with pytest.raises(CryptoError):
            SealedBox(other).decrypt(raw)
    assert "synthetic-" not in json.dumps(sealed)
    captured = capsys.readouterr()
    assert "synthetic-" not in captured.out + captured.err
    assert list(output.parent.iterdir()) == [output]


@pytest.mark.parametrize("bad", ["missing", "empty", "extra", "key", "branch", "event", "repository", "expired", "overwrite"])
def test_invalid_input_or_context_cannot_produce_payload(bad, migration_context, monkeypatch, capsys):
    _, _, output = migration_context
    values = {name: "synthetic" for name in SECRET_NAMES}
    public_key = base64.b64encode(bytes(PrivateKey.generate().public_key)).decode()
    if bad == "missing":
        values.pop(SECRET_NAMES[0])
        monkeypatch.delenv(SECRET_NAMES[0])
    elif bad == "empty":
        values[SECRET_NAMES[0]] = ""
        monkeypatch.setenv(SECRET_NAMES[0], "")
    elif bad == "extra":
        values["UNRELATED_SECRET"] = "synthetic"
        with pytest.raises(ValueError):
            migration.seal_values(values, public_key)
        return
    elif bad == "key":
        public_key = "not-a-public-key"
        monkeypatch.setattr(migration, "PUBLIC_KEY", public_key)
    elif bad == "branch":
        monkeypatch.setenv("GITHUB_REF", "refs/heads/unreviewed")
    elif bad == "event":
        monkeypatch.setenv("GITHUB_EVENT_NAME", "pull_request")
    elif bad == "repository":
        monkeypatch.setenv("GITHUB_REPOSITORY", "unrelated/repo")
    elif bad == "expired":
        monkeypatch.setattr(migration, "EXPIRES", datetime.min.replace(tzinfo=timezone.utc))
    elif bad == "overwrite":
        output.write_text("existing", encoding="utf-8")
    assert migration.main() == 1
    if bad == "overwrite":
        assert output.read_text(encoding="utf-8") == "existing"
    else:
        assert not output.exists()
    captured = capsys.readouterr()
    assert "synthetic" not in captured.out + captured.err
