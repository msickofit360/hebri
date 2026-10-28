"""Hebri-owned outbound identity; OAuth registrations remain provider-owned.

These values identify the harness, not a user or device. Keep compatibility
module names and provider-specific authentication protocol identifiers separate.
"""

APP_NAME = "Hebri"
APP_ID = "hebri"
APP_URL = "https://synapseklabs.org"


def user_agent() -> str:
    from hermes_cli import __version__

    return f"{APP_NAME}/{__version__}"
