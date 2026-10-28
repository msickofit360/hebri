"""Local-only assistance worker. Remote text never becomes host tools or settings."""
import asyncio
import contextlib
import json
import os
import platform
import urllib.parse

from .identity import DeviceError


def facts():
    from hermes_cli.web_routers.local_models import local_models_hardware
    return {"os": platform.system(), "architecture": platform.machine(), "cpu_count": os.cpu_count(),
            **local_models_hardware()}


def managed_endpoint():
    from hermes_cli.local_runtime.endpoint import managed_root
    endpoint = managed_root()
    if endpoint is None:
        raise DeviceError("local_runtime_not_ready")
    url = urllib.parse.urlsplit(endpoint[0])
    if url.scheme != "http" or url.hostname not in {"127.0.0.1", "::1"} or url.username or url.password:
        raise DeviceError("local_runtime_required")
    return url, endpoint[1]


def local_request(endpoint, route, body=None, cancelled=None):
    # Use cancellable async I/O inside this dedicated worker thread. Closing a
    # blocking Windows socket from another thread does not reliably stop a read.
    import httpx
    url, api_key = endpoint

    async def perform():
        async with httpx.AsyncClient(trust_env=False, follow_redirects=False, timeout=120) as client:
            async with client.stream("GET" if body is None else "POST", url.geturl().rstrip("/") + route,
                                     json=body, headers={"Authorization": f"Bearer {api_key}"}) as response:
                if response.status_code != 200:
                    raise DeviceError("local_model_rejected")
                data = bytearray()
                async for chunk in response.aiter_bytes():
                    data.extend(chunk)
                    if len(data) > 131072:
                        raise DeviceError("result_too_large")
                return json.loads(data)

    async def run():
        task = asyncio.create_task(perform())
        try:
            async with asyncio.timeout(120):
                while True:
                    if cancelled is not None and cancelled.is_set():
                        raise DeviceError("cancelled")
                    done, _ = await asyncio.wait([task], timeout=0.1)
                    if done:
                        return task.result()
        finally:
            if not task.done():
                task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

    return asyncio.run(run())


def catalog(endpoint):
    result = local_request(endpoint, "/v1/models")
    return [row["id"] for row in result.get("data", [])
            if isinstance(row.get("id"), str) and len(row["id"]) <= 200][:64]


def assist(endpoint, model, goal, cancelled):
    # A fresh, bounded assistant task. No host history, tool dispatcher, credentials,
    # recursive delegation, URL attachments, or filesystem enters this context.
    result = local_request(endpoint, "/v1/chat/completions", {
        "model": model, "stream": False, "max_tokens": 2048,
        "messages": [
            {"role": "system", "content": "You are a Hebri device assistant. Help with the supplied task. "
             "You have no tools or access to this computer's files, other chats, or credentials. "
             "Return your answer to the requesting agent; do not claim to have run commands."},
            {"role": "user", "content": goal}],
    }, cancelled)
    try:
        text = result["choices"][0]["message"]["content"]
        if not isinstance(text, str):
            raise ValueError()
        return text[:16000]
    except (KeyError, IndexError, TypeError, ValueError):
        raise DeviceError("invalid_model_response") from None
