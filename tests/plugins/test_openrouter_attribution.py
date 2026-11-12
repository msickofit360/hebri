"""Capture actual media HTTP submissions; no real keys, generation, or downloads."""
import json
from pathlib import Path

import requests


def test_image_and_video_submissions_use_the_same_hebri_identity(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    from plugins.image_gen.openrouter import OpenRouterCompatImageProvider
    from plugins.video_gen.openrouter import OpenRouterVideoGenProvider
    from hermes_cli.provider_identity import openrouter_attribution_headers

    received = []

    def request(_session, method, url, **kwargs):
        received.append((method, url, kwargs))
        response = requests.Response()
        response.status_code = 400
        response._content = json.dumps({"error": {"message": "fixture rejection"}}).encode()
        return response

    monkeypatch.setattr(requests.Session, "request", request)
    image = OpenRouterCompatImageProvider(provider_name="openrouter", display_name="OpenRouter",
        runtime_name="openrouter", config_key="openrouter", model_env_var="OPENROUTER_IMAGE_MODEL", setup_schema=None)
    video = OpenRouterVideoGenProvider()
    for provider in (image, video):
        monkeypatch.setattr(provider, "_credentials", lambda: ("fixture-key", "https://openrouter.ai/api/v1"))
    monkeypatch.setattr(video, "_entry", lambda _model: {})
    image.generate("fixture", model="fixture/image")
    video.generate("fixture", model="fixture/video")
    assert [call[1] for call in received] == ["https://openrouter.ai/api/v1/chat/completions", "https://openrouter.ai/api/v1/videos"]
    for _method, _url, kwargs in received:
        for name, value in openrouter_attribution_headers().items():
            assert kwargs["headers"][name] == value
        assert kwargs["headers"]["Authorization"] == "Bearer fixture-key"
