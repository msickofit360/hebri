"""Encrypted MCP OAuth files, bound to a Bit home and server filename.

Public discovery metadata stays readable. Tokens and client secrets use only an
OS credential-store key. Legacy credentials migrate atomically after encryption
succeeds; failure leaves the original intact and blocks authentication.
"""
import hashlib
import json
import os
from pathlib import Path

from hermes_cli.auth import _auth_store_lock
from hermes_cli.synapsek_store import AccountStore
from utils import atomic_json_write

_FORMAT = "hebri-mcp-oauth-v1"


def _cipher(path: Path, *, create: bool):
    # A separate key for every profile/server/file avoids substituting client
    # metadata or another server's tokens, and serializes first-key creation.
    store = AccountStore(path.parent.parent)
    store.identity = hashlib.sha256(("mcp-oauth:" + os.path.normcase(str(path.resolve()))).encode()).hexdigest()
    return store.cipher(create=create)


def _seal(path: Path, data: dict) -> dict:
    encrypted = _cipher(path, create=True).encrypt(json.dumps(data, ensure_ascii=True).encode()).decode("ascii")
    return {"format": _FORMAT, "ciphertext": encrypted}


def read_oauth_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    if path.name.endswith(".meta.json"):
        return json.loads(path.read_text(encoding="utf-8"))
    with _auth_store_lock(target_path=path, timeout_seconds=30):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return data
        if data.get("format") == _FORMAT:
            try:
                return json.loads(_cipher(path, create=False).decrypt(data["ciphertext"].encode()).decode())
            except Exception:
                raise RuntimeError("MCP credentials cannot be unlocked from this Bit's operating-system credential store") from None
        # Never overwrite plaintext until a verified OS-backed key produced the
        # replacement. This preserves refresh/issuer metadata during migration.
        atomic_json_write(path, _seal(path, data), mode=0o600)
        return data


def write_oauth_json(path: Path, data: dict) -> None:
    if path.name.endswith(".meta.json"):
        atomic_json_write(path, data, mode=0o600, default=str)
        return
    with _auth_store_lock(target_path=path, timeout_seconds=30):
        atomic_json_write(path, _seal(path, data), mode=0o600)
