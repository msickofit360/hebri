"""OS-keychain-backed encryption for the standalone Synapsek account.

Only native backends are admitted; configured third-party/plaintext keyrings
are deliberately not loaded. The account and key are scoped to one Bit home.
The Node account controller calls this helper over private stdin/stdout pipes.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile

SERVICE = "Synapsek Hebri terminal"


def native_keyring():
    if sys.platform == "win32":
        from keyring.backends.Windows import WinVaultKeyring
        backend = WinVaultKeyring()
    elif sys.platform == "darwin":
        from keyring.backends.macOS import Keyring
        backend = Keyring()
    elif sys.platform.startswith("linux"):
        from keyring.backends.SecretService import Keyring
        backend = Keyring()
    else:
        raise RuntimeError("secure_storage_unavailable")
    if backend.priority <= 0:
        raise RuntimeError("secure_storage_unavailable")
    return backend


class AccountStore:
    def __init__(self, home: Path, backend=None):
        self.home = home.resolve()
        self.file = self.home / "synapsek-account.enc.json"
        self.identity = hashlib.sha256(os.path.normcase(str(self.home)).encode()).hexdigest()
        self._backend = backend

    def backend(self):
        return self._backend if self._backend is not None else native_keyring()

    def cipher(self, *, create: bool = False):
        from cryptography.fernet import Fernet
        backend = self.backend()
        key = backend.get_password(SERVICE, self.identity)
        if key is None and create:
            key = Fernet.generate_key().decode("ascii")
            backend.set_password(SERVICE, self.identity, key)
            if backend.get_password(SERVICE, self.identity) != key:
                raise RuntimeError("secure_storage_unavailable")
        if not key:
            raise RuntimeError("stored_session_unavailable")
        return Fernet(key.encode("ascii"))

    def execute(self, action: str, value=None):
        if action == "available":
            self.backend().get_password(SERVICE, self.identity)
            return True
        if action == "read":
            try:
                text = self.file.read_text(encoding="utf-8")
            except FileNotFoundError:
                return None
            if len(text) > 128_000:
                raise RuntimeError("stored_session_unavailable")
            return text
        if action == "encrypt":
            return self.cipher(create=True).encrypt(value.encode("utf-8")).decode("ascii")
        if action == "decrypt":
            return self.cipher().decrypt(value.encode("ascii")).decode("utf-8")
        if action == "write":
            if not isinstance(value, str) or len(value) > 128_000:
                raise RuntimeError("stored_session_unavailable")
            self.home.mkdir(parents=True, exist_ok=True, mode=0o700)
            fd, temporary = tempfile.mkstemp(prefix=".synapsek-", dir=self.home)
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as handle:
                    handle.write(value)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temporary, self.file)
            finally:
                Path(temporary).unlink(missing_ok=True)
            return True
        if action == "clear":
            self.file.unlink(missing_ok=True)
            return True
        raise RuntimeError("invalid_storage_operation")


def main():
    try:
        message = json.loads(sys.stdin.read(256_000))
        result = AccountStore(Path(message["home"])).execute(message["action"], message.get("value"))
        print(json.dumps({"ok": True, "value": result}))
    except Exception:
        # Do not expose tokens, keychain diagnostics or plaintext in stderr/logs.
        print(json.dumps({"ok": False, "error": "secure_storage_unavailable"}))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
