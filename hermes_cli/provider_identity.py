"""Hebri-owned outbound identity; OAuth registrations remain provider-owned.

These values identify the harness, not a user or device. Keep compatibility
module names and provider-specific authentication protocol identifiers separate.
"""

APP_NAME = "Hebri"
APP_ID = "hebri"
APP_URL = "https://synapseklabs.org"


def openrouter_attribution_headers() -> dict[str, str]:
    """Public app identity only; never include a user, device, or session identifier."""
    return {
        "HTTP-Referer": APP_URL,
        "X-OpenRouter-Title": APP_NAME,
        "X-Title": APP_NAME,
        "X-OpenRouter-Categories": "cli-agent,personal-agent",
    }


def user_agent() -> str:
    from hermes_cli import __version__

    return f"{APP_NAME}/{__version__}"
