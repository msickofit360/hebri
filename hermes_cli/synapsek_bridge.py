"""Process-lifetime inference capability for independently signed-in Hebri Bits."""
from __future__ import annotations

import atexit
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import secrets
import threading
import time

from hermes_cli.synapsek_account import AccountError, run_account
from hermes_cli.synapsek_store import AccountStore

_bridges: dict[str, tuple[ThreadingHTTPServer, dict]] = {}
_lock = threading.Lock()


def completion_chunks(result: dict, include_usage: bool):
    base = {k: result[k] for k in ("id", "created", "model")}
    base["object"] = "chat.completion.chunk"
    choices = []
    for choice in result["choices"]:
        delta = dict(choice["message"])
        if delta.get("tool_calls"):
            delta["tool_calls"] = [{**tool, "index": i} for i, tool in enumerate(delta["tool_calls"])]
        choices.append({"index": choice["index"], "delta": delta, "finish_reason": None})
    yield {**base, "choices": choices}
    yield {**base, "choices": [{"index": c["index"], "delta": {}, "finish_reason": c["finish_reason"]}
                              for c in result["choices"]]}
    if include_usage:
        yield {**base, "choices": [], "usage": result.get("usage")}


def start_bridge(home: Path, account_call=run_account):
    token = secrets.token_hex(32)
    owner: list[str] = []
    owner_lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def reply(self, status, body):
            payload = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def fail(self, status, code):
            # Closing with unread POST bytes can reset the socket on Windows,
            # hiding the rejection from the caller. Drain only a bounded body,
            # without parsing it or invoking the account broker.
            if self.command == "POST" and not getattr(self, "_body_consumed", False):
                try:
                    size = int(self.headers.get("Content-Length", "0"))
                    if 0 < size <= 512_000 and not self.headers.get("Transfer-Encoding"):
                        deadline = time.monotonic() + 1
                        while size > 0:
                            remaining = deadline - time.monotonic()
                            if remaining <= 0:
                                break
                            self.connection.settimeout(remaining)
                            chunk = self.rfile.read1(min(size, 16_384))
                            if not chunk:
                                break
                            size -= len(chunk)
                except (ValueError, OSError):
                    pass  # Still reject; never wait indefinitely for an untrusted body.
            self.reply(status, {"error": {"message": code, "code": code, "type": "synapsek_error"}})

        def do_GET(self):
            self.handle_request()

        def do_POST(self):
            self.handle_request()

        def handle_request(self):
            expected_host = f"127.0.0.1:{self.server.server_port}"
            auth = self.headers.get("Authorization", "")
            if (self.headers.get("Host") != expected_host or self.headers.get("Origin") is not None
                    or not hmac.compare_digest(auth.encode(), f"Bearer {token}".encode())):
                return self.fail(401, "unauthenticated")
            action = {("GET", "/v1/models"): "models", ("POST", "/v1/chat/completions"): "completion",
                      ("POST", "/v1/connectors"): "connectors"}.get((self.command, self.path))
            if not action:
                return self.fail(404, "not_found")
            if self.headers.get("x-stainless-retry-count", "0") != "0":
                return self.fail(409, "automatic_retry_disabled")
            body = None
            if action in {"completion", "connectors"}:
                try:
                    size = int(self.headers.get("Content-Length", "0"))
                    if not 0 < size <= (24_000 if action == "connectors" else 512_000) or self.headers.get_content_type() != "application/json":
                        return self.fail(413, "invalid_request_size")
                    self.connection.settimeout(10)
                    self._body_consumed = True
                    body = json.loads(self.rfile.read(size))
                    if not isinstance(body, dict):
                        return self.fail(400, "invalid_json")
                except (ValueError, OSError):
                    return self.fail(400, "invalid_json")
            try:
                with owner_lock:
                    if not owner:
                        view = account_call("status", home=home)
                        if view.get("state") != "signed_in":
                            raise AccountError("inference_not_enabled")
                        owner.append(view["account"]["userId"])
                result = account_call(action, home=home, body=body, expected_user_id=owner[0], timeout=180)
                if action == "completion" and body and body.get("stream"):
                    self.send_response(200)
                    self.send_header("Content-Type", "text/event-stream")
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    for chunk in completion_chunks(result, bool((body.get("stream_options") or {}).get("include_usage"))):
                        self.wfile.write(("data: " + json.dumps(chunk) + "\n\n").encode())
                    self.wfile.write(b"data: [DONE]\n\n")
                else:
                    self.reply(200, result)
            except AccountError as exc:
                statuses = {"shared_budget_exhausted": 402, "inference_not_enabled": 403,
                            "personal_paid_plan_required": 403, "request_already_submitted": 409,
                            "account_mismatch": 409, "too_many_requests": 429}
                self.fail(statuses.get(str(exc), 400), str(exc))
            except Exception:
                self.fail(503, "managed_inference_unavailable")

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server.daemon_threads = True
    from agent.memory_provider import spawn_context_thread
    spawn_context_thread(server.serve_forever, name="synapsek-inference").start()
    credentials = {"provider": "synapsek", "api_key": token,
                   "base_url": f"http://127.0.0.1:{server.server_port}/v1", "source": "env:HEBRI_SYNAPSEK_BRIDGE_TOKEN"}
    return server, credentials


def standalone_credentials(home: Path):
    home = home.resolve()
    if not AccountStore(home).file.is_file():
        return None
    key = str(home)
    with _lock:
        if key not in _bridges:
            _bridges[key] = start_bridge(home)
        return dict(_bridges[key][1])


@atexit.register
def close_bridges():
    for server, _credentials in _bridges.values():
        server.shutdown()
        server.server_close()
