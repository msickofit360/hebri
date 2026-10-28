"""Bounded HTTPS transport pinned to the certificate in an out-of-band invite."""
from __future__ import annotations

import asyncio
import json
import ssl
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .identity import DeviceError, private_address

MAX_BODY = 131072


def request(address: str, port: int, cert: str, route: str, body: dict, token: str = "", timeout: float = 10):
    address = private_address(address)
    if type(port) is not int or not 1 <= port <= 65535:
        raise DeviceError("invalid_port")
    payload = json.dumps(body).encode()
    if len(payload) > MAX_BODY:
        raise DeviceError("request_too_large")
    context = ssl.create_default_context(cadata=cert)
    # The exact paired certificate, not an untrusted LAN hostname, is the trust anchor.
    context.check_hostname = False
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async def exchange():
        import httpx
        # Absolute deadline, including TLS and slow response bodies; ignore proxy
        # environment variables so paired credentials stay on the direct link.
        async with asyncio.timeout(timeout):
            async with httpx.AsyncClient(verify=context, trust_env=False, follow_redirects=False, timeout=timeout) as client:
                async with client.stream("POST", f"https://{address}:{port}{route}", content=payload,
                    headers=headers) as response:
                    data = bytearray()
                    async for chunk in response.aiter_bytes():
                        data.extend(chunk)
                        if len(data) > MAX_BODY:
                            raise DeviceError("response_too_large")
                    result = json.loads(data)
                    if not isinstance(result, dict):
                        raise DeviceError("invalid_response")
                    if response.status_code != 200:
                        raise DeviceError(result.get("error", "peer_rejected"))
                    return result
    try:
        return asyncio.run(exchange())
    except DeviceError:
        raise
    except Exception:
        raise DeviceError("peer_unavailable_or_identity_changed") from None



class PeerServer(ThreadingHTTPServer):
    daemon_threads = True
    block_on_close = False
    request_queue_size = 8

    def __init__(self, owner, address: str):
        self.owner = owner
        self.slots = threading.BoundedSemaphore(8)
        self.context = owner.identity.server_context()
        super().__init__((address, owner.identity.data.get("port", 0)), PeerHandler)

    def get_request(self):
        stream, address = super().get_request()
        stream.settimeout(5)
        # Handshake in a bounded worker, never in the accept loop.
        return stream, address

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            request.close()
            return
        super().process_request(request, client_address)

    def process_request_thread(self, request, client_address):
        try:
            with self.context.wrap_socket(request, server_side=True) as stream:
                super().process_request_thread(stream, client_address)
        except (OSError, ssl.SSLError):
            request.close()
        finally:
            self.slots.release()


class PeerHandler(BaseHTTPRequestHandler):
    # Deliberately not the dashboard: no config, shell, files, or session routes.
    server_version = "Hebri"
    sys_version = ""

    def log_message(self, *_args):
        pass  # No invite, authorization header, prompt, or response in access logs.

    def do_POST(self):
        try:
            private_address(self.client_address[0])
            if self.headers.get("Origin") or self.headers.get("Transfer-Encoding"):
                raise DeviceError("forbidden")
            lengths = self.headers.get_all("Content-Length", [])
            if len(lengths) != 1 or not lengths[0].isdigit() or not 0 < int(lengths[0]) <= MAX_BODY:
                raise DeviceError("invalid_body")
            body = json.loads(self.rfile.read(int(lengths[0])))
            if not isinstance(body, dict):
                raise DeviceError("invalid_body")
            result = self.server.owner.receive(self.path, body, self.headers.get("Authorization", ""))
            status = 200
        except DeviceError as error:
            result, status = {"error": str(error)}, 403
        except Exception:
            result, status = {"error": "invalid_request"}, 400
        encoded = json.dumps(result).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)
