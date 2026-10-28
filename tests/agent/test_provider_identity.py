"""Hebri identity reaches real request builders without changing account routing."""
import base64
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def test_catalog_and_provider_headers_share_hebri_identity(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    from hermes_cli.provider_identity import APP_NAME, APP_URL, user_agent
    from providers.base import ProviderProfile
    from providers import get_provider_profile
    from agent.anthropic_adapter import _attribution_headers
    from agent.auxiliary_client import build_nvidia_nim_headers, build_or_headers
    from agent.client_lifecycle import _routermint_headers
    from hermes_cli.auth_constants import CODEX_OAUTH_USER_AGENT
    from hermes_cli.models import _HERMES_USER_AGENT

    received = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_GET(self):
            received.append(dict(self.headers))
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"data":[{"id":"fixture-model"}]}')

    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            profile = ProviderProfile(name="fixture", base_url=f"http://127.0.0.1:{server.server_port}")
            assert profile.fetch_models(api_key="synthetic-test-key") == ["fixture-model"]
            assert received[0]["User-Agent"] == user_agent()
            assert received[0]["Authorization"] == "Bearer synthetic-test-key"
        finally:
            server.shutdown()
            worker.join(timeout=5)

    for name in ("fireworks", "gmi", "kimi-coding", "opencode"):
        profile = get_provider_profile(name)
        assert profile is not None, name
        assert profile.default_headers["User-Agent"] == user_agent()
    assert _HERMES_USER_AGENT == CODEX_OAUTH_USER_AGENT == user_agent()
    assert _routermint_headers()["User-Agent"] == _attribution_headers()["User-Agent"] == user_agent()
    assert build_or_headers({})["X-Title"] == APP_NAME
    assert _attribution_headers()["HTTP-Referer"] == APP_URL
    assert build_nvidia_nim_headers("https://integrate.api.nvidia.com/v1")["X-BILLING-INVOKE-ORIGIN"] == APP_NAME
    assert build_nvidia_nim_headers("http://localhost:8000/v1") == {}


def test_codex_identity_preserves_account_residency_and_proxy_compatibility():
    from agent.codex_headers import apply_required_codex_headers, codex_cloudflare_headers
    from agent.copilot_acp_client import _INITIALIZE_PARAMS
    from hermes_cli.provider_identity import APP_ID, APP_NAME, user_agent

    payload = {"https://api.openai.com/auth": {"chatgpt_account_id": "fixture-account", "chatgpt_data_residency": "eu"}}
    token = "header." + base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=") + ".signature"
    kwargs = {"default_headers": {"user-agent": "old-brand", "originator": "old-brand", "X-Custom": "keep"}}
    apply_required_codex_headers(kwargs, access_token=token, base_url="https://chatgpt.com/backend-api/codex")
    headers = kwargs["default_headers"]
    assert headers["User-Agent"] == user_agent()
    assert headers["originator"] == APP_ID
    assert headers["ChatGPT-Account-ID"] == "fixture-account"
    assert headers["x-openai-internal-codex-residency"] == "eu"
    assert headers["X-Custom"] == "keep"
    assert "user-agent" not in headers
    assert codex_cloudflare_headers(token, base_url="https://proxy.example/v1")["originator"] == "codex_cli_rs"
    assert _INITIALIZE_PARAMS["clientInfo"]["name"] == APP_ID
    assert _INITIALIZE_PARAMS["clientInfo"]["title"] == APP_NAME
