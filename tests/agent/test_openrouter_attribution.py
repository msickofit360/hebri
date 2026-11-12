"""Exercise primary/rebuilt and auxiliary SDK requests without provider traffic."""
from pathlib import Path
from types import SimpleNamespace

import httpx
from openai import OpenAI


def test_openrouter_identity_survives_real_sdk_requests_and_route_changes(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    from agent.agent_init import _host_default_headers_factory
    from agent.client_lifecycle import ClientLifecycleMixin
    from agent import auxiliary_client as aux
    from hermes_cli.provider_identity import APP_NAME, APP_URL, openrouter_attribution_headers

    received = []

    def respond(request):
        received.append(request)
        return httpx.Response(200, json={"id": "fixture", "choices": []})

    endpoint = "https://openrouter.ai/api/v1"
    transport = httpx.MockTransport(respond)
    owner = SimpleNamespace(_client_kwargs={}, provider="openrouter", api_mode="chat_completions")
    ClientLifecycleMixin._apply_client_headers_for_base_url(owner, endpoint, apply_user_headers=False)
    factories = [
        _host_default_headers_factory(endpoint)("fixture-key", endpoint),
        owner._client_kwargs["default_headers"],
        aux._endpoint_default_headers(endpoint, "custom"),
        aux.build_or_headers({"response_cache": True}),
    ]
    for headers in factories:
        with OpenAI(api_key="fixture-key", base_url=endpoint, default_headers=headers,
                    http_client=httpx.Client(transport=transport)) as client:
            client.chat.completions.create(model="fixture/model", messages=[{"role": "user", "content": "fixture"}])

    monkeypatch.setattr(aux, "_openai_http_client_kwargs", lambda _url: {"http_client": httpx.Client(transport=transport)})
    with aux._named_custom_openai_wire_client(endpoint, "fixture-key", {"X-Test": "keep"}) as client:
        client.chat.completions.create(model="fixture/model", messages=[{"role": "user", "content": "fixture"}])
    for request in received:
        assert request.headers["HTTP-Referer"] == APP_URL
        assert request.headers["X-OpenRouter-Title"] == request.headers["X-Title"] == APP_NAME
        assert set(request.headers["X-OpenRouter-Categories"].split(",")) <= {"cli-agent", "personal-agent"}
        assert request.headers["Authorization"] == "Bearer fixture-key"
    assert received[-1].headers["X-Test"] == "keep"
    assert received[-2].headers["X-OpenRouter-Cache"] == "true"
    assert _host_default_headers_factory("https://openrouter.ai.example.com/v1") is None
    owner.provider = "custom"
    ClientLifecycleMixin._apply_client_headers_for_base_url(owner, "http://localhost:9999/v1", apply_user_headers=False)
    assert "HTTP-Referer" not in owner._client_kwargs.get("default_headers", {})
    assert aux._endpoint_default_headers("https://openrouter.ai.example.com/v1", "custom") is None
    edited = openrouter_attribution_headers()
    edited["HTTP-Referer"] = "https://example.com"
    assert openrouter_attribution_headers()["HTTP-Referer"] == APP_URL
