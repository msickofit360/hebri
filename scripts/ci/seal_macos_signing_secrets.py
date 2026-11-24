"""One-time repository -> environment migration; only GitHub can decrypt output.

No plaintext files, digests of secret values, or secret-bearing diagnostics.
This does not grant a runner an API token capable of modifying GitHub secrets.
An operator imports the sealed values separately after verifying run provenance.
"""

import base64
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from nacl.public import PublicKey, SealedBox

REPOSITORY = "Synapsek-Labs/hebri"
ENVIRONMENT = "macos-signing"
# Public, not secret. Retrieved from this exact environment's GitHub REST API.
KEY_ID = "3380204578043523366"
PUBLIC_KEY = "zKyl4NCvI/4hcBl62lI8nzZ4/ovTbWdgfy8CHgcJCBQ="
SECRET_NAMES = (
    "CSC_LINK", "CSC_KEY_PASSWORD", "APPLE_API_KEY",
    "APPLE_API_KEY_ID", "APPLE_API_ISSUER",
)
EXPIRES = datetime(2026, 11, 28, tzinfo=timezone.utc)


def seal_values(values: dict[str, str], public_key: str) -> dict[str, str]:
    """Validate the entire set before encrypting; preserve original UTF-8 bytes."""
    if set(values) != set(SECRET_NAMES) or any(not values[name] for name in SECRET_NAMES):
        raise ValueError("All five nonempty signing secrets are required")
    key = PublicKey(base64.b64decode(public_key, validate=True))
    box = SealedBox(key)
    return {
        name: base64.b64encode(box.encrypt(values[name].encode("utf-8"))).decode("ascii")
        for name in SECRET_NAMES
    }


def main() -> int:
    try:
        if (len(sys.argv) != 1 or os.environ.get("GITHUB_REPOSITORY") != REPOSITORY
                or os.environ.get("GITHUB_REF") != "refs/heads/main"
                or os.environ.get("GITHUB_EVENT_NAME") != "workflow_dispatch"
                or datetime.now(timezone.utc) >= EXPIRES):
            raise ValueError("Migration context is not allowed")
        payload = {
            "repository": REPOSITORY,
            "environment": ENVIRONMENT,
            "key_id": KEY_ID,
            "public_key": PUBLIC_KEY,
            "commit": os.environ["GITHUB_SHA"],
            "run_id": os.environ["GITHUB_RUN_ID"],
            "run_attempt": os.environ["GITHUB_RUN_ATTEMPT"],
            "encrypted_values": seal_values(
                {name: os.environ.pop(name, "") for name in SECRET_NAMES}, PUBLIC_KEY
            ),
        }
        output = Path(os.environ["RUNNER_TEMP"]) / "macos-signing-migration.json"
        # Never overwrite a pre-existing output, including a symlink.
        with output.open("x", encoding="utf-8") as stream:
            json.dump(payload, stream)
    except Exception:
        # Never include exceptions, environment values or library internals in logs.
        print("Signing migration failed; no usable artifact may be imported.", file=sys.stderr)
        return 1
    print("Sealed five signing values for the fixed macos-signing environment.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
