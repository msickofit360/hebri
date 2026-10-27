"""Trusted-device runtime. Local management and the small peer API are separate."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import socket
import threading
import time
from pathlib import Path

from .identity import DeviceError, Identity, fingerprint, private_address
from .transport import PeerServer, request


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def label(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 64 or any(ord(c) < 32 for c in value):
        raise DeviceError("invalid_name")
    return value.strip()


class DeviceService:
    def __init__(self, home: Path, key: str, *, bind="0.0.0.0", discovery=True, endpoint=None, worker=None, hardware=None):
        from . import worker as local_worker
        self.home = home
        self.identity = Identity(home, key)
        self.bind, self.use_discovery = bind, discovery
        self.endpoint = endpoint or local_worker.managed_endpoint
        self.worker = worker or local_worker.assist
        self.hardware = hardware or local_worker.facts
        self.lock = threading.RLock()
        self.server = self.discovery = None
        self.pending, self.joining, self.jobs = {}, {}, {}
        self.outgoing_jobs = {}
        self.invite = None
        self.hardware_cache = ({}, 0)
        self.endpoint_cache = None
        self.discovery_error = False

    def start(self):
        with self.lock:
            if self.server:
                return
            self.server = PeerServer(self, self.bind)
            self.identity.data["port"] = self.server.server_port
            try:
                self.identity.save()
            except Exception:
                self.server.server_close()
                self.server = None
                raise
            threading.Thread(target=self.server.serve_forever, daemon=True, name="hebri-device-peer").start()
            if self.use_discovery:
                from .discovery import Discovery
                try:
                    self.discovery = Discovery(self.identity, self.server.server_port)
                except OSError:
                    self.discovery_error = True

    def close(self):
        with self.lock:
            server, discovery = self.server, self.discovery
            self.server = self.discovery = None
            self.invite = None
            self.pending.clear()
            self.joining.clear()
            for job in self.jobs.values():
                job["cancel"].set()
                job["result"] = ""
                job["status"] = "cancelled"
        if discovery:
            discovery.close()
        if server:
            server.shutdown()
            server.server_close()

    def configure(self, name, enabled, models):
        name = label(name)
        if type(enabled) is not bool or not isinstance(models, list) or len(models) > 16:
            raise DeviceError("invalid_settings")
        if any(not isinstance(model, str) or not 1 <= len(model) <= 200 for model in models):
            raise DeviceError("invalid_model")
        with self.lock:
            self.identity.data.update(name=name, enabled=enabled, models=list(dict.fromkeys(models)))
            self.identity.save()
            for job in self.jobs.values():
                if job["model"] not in models:
                    job["cancel"].set()
                    job.update(status="cancelled", result="")
        if enabled:
            self.start()
        else:
            self.close()

    def _expire(self):
        now = time.monotonic()
        self.pending = {k: v for k, v in self.pending.items() if v["expires"] > now}
        self.joining = {k: v for k, v in self.joining.items() if v["expires"] > now}
        self.jobs = {k: v for k, v in self.jobs.items()
                     if v.get("active") or v["created"] > now - 600}
        self.outgoing_jobs = {k: v for k, v in self.outgoing_jobs.items() if v["created"] > now - 600}

    def create_invite(self, address):
        address = private_address(address)
        if not self.server:
            raise DeviceError("sharing_disabled")
        token = secrets.token_urlsafe(32)
        with self.lock:
            self.invite = {"hash": digest(token), "expires": time.monotonic() + 300}
        payload = {"v": 1, "address": address, "port": self.server.server_port,
                   "cert": self.identity.cert, "token": token, "name": self.identity.data["name"]}
        return {"invite": "hebri-pair:" + base64.urlsafe_b64encode(json.dumps(payload).encode()).decode(),
                "expires_in": 300}

    def join(self, invite):
        if not self.server:
            raise DeviceError("sharing_disabled")
        if not isinstance(invite, str) or not invite.startswith("hebri-pair:") or len(invite) > 10000:
            raise DeviceError("invalid_invite")
        try:
            peer = json.loads(base64.urlsafe_b64decode(invite[11:]))
            if peer["v"] != 1:
                raise ValueError()
            peer_id = fingerprint(peer["cert"])
            name = label(peer["name"])
            private_address(peer["address"])
            if peer_id == self.identity.id:
                raise DeviceError("cannot_pair_self")
            result = request(peer["address"], peer["port"], peer["cert"], "/pair", {
                "invite": peer["token"], "id": self.identity.id, "name": self.identity.data["name"]})
        except DeviceError:
            raise
        except Exception:
            raise DeviceError("invalid_invite") from None
        with self.lock:
            self._expire()
            if len(self.joining) >= 8:
                raise DeviceError("pairing_limit")
            self.joining[peer_id] = {"address": peer["address"], "port": peer["port"], "cert": peer["cert"],
                                     "name": name, "ticket": result["ticket"], "expires": time.monotonic() + 300}
        return {"id": peer_id, "verification": result["verification"]}

    def approve(self, ticket, allow_assistance):
        if type(allow_assistance) is not bool:
            raise DeviceError("invalid_permission")
        with self.lock:
            self._expire()
            row = self.pending.get(ticket)
            if row is None or row.get("token"):
                raise DeviceError("pairing_expired")
            if len(self.identity.data["peers"]) >= 32 and row["id"] not in self.identity.data["peers"]:
                raise DeviceError("device_limit")
            token = secrets.token_urlsafe(32)
            peer = self.identity.data["peers"].setdefault(row["id"], {"name": row["name"]})
            peer.update(incoming=digest(token), assistance=allow_assistance)
            self.identity.save()
            row["token"] = token

    def finish(self, peer_id):
        with self.lock:
            self._expire()
            peer = dict(self.joining.get(peer_id) or {})
        if not peer:
            raise DeviceError("pairing_expired")
        result = request(peer["address"], peer["port"], peer["cert"], "/pair/result", {"ticket": peer["ticket"]})
        if result.get("status") != "approved":
            return result
        with self.lock:
            if peer_id not in self.joining:
                raise DeviceError("pairing_expired")
            if len(self.identity.data["peers"]) >= 32 and peer_id not in self.identity.data["peers"]:
                raise DeviceError("device_limit")
            current = self.identity.data["peers"].setdefault(peer_id, {})
            current.update({k: peer[k] for k in ("address", "port", "cert", "name")})
            current["outgoing"] = result["token"]
            self.identity.save()
            del self.joining[peer_id]
        return {"status": "approved"}

    def revoke(self, peer_id):
        with self.lock:
            self.identity.data["peers"].pop(peer_id, None)
            self.identity.save()
            self.pending = {k: v for k, v in self.pending.items() if v["id"] != peer_id}
            self.joining.pop(peer_id, None)
            self.outgoing_jobs = {k: v for k, v in self.outgoing_jobs.items() if v["peer"] != peer_id}
            for job in self.jobs.values():
                if job["owner"] == peer_id:
                    job["cancel"].set()
                    job.update(status="cancelled", result="")

    def _authorized(self, authorization):
        if not authorization.startswith("Bearer ") or len(authorization) > 128:
            raise DeviceError("device_not_authorized")
        hashed = digest(authorization[7:])
        for peer_id, peer in self.identity.data["peers"].items():
            if peer.get("incoming") and hmac.compare_digest(peer["incoming"], hashed):
                return peer_id, peer
        raise DeviceError("device_not_authorized")

    def receive(self, route, body, authorization):
        from hermes_constants import assert_named_profile_home_live
        try:
            assert_named_profile_home_live(self.home)
        except FileNotFoundError:
            raise DeviceError("sharing_disabled") from None
        with self.lock:
            self._expire()
            if not self.server or not self.identity.data["enabled"] or not self.identity.path.is_file():
                raise DeviceError("sharing_disabled")
            if route == "/pair":
                return self._pair(body)
            if route == "/pair/result":
                pending = self.pending.get(body.get("ticket", ""))
                if not pending:
                    raise DeviceError("pairing_expired")
                return {"status": "approved", "token": pending["token"]} if pending.get("token") else {"status": "pending"}
            peer_id, peer = self._authorized(authorization)
            if route == "/status":
                return {"id": self.identity.id, "name": self.identity.data["name"],
                        "hardware": self.hardware_cache[0], "models": self.identity.data["models"] if peer.get("assistance") else [],
                        "assistance": bool(peer.get("assistance")), "active_jobs": sum(bool(j.get("active")) for j in self.jobs.values()),
                        "ready": self.endpoint_cache is not None}
            if route == "/jobs/start":
                return self._submit(peer_id, peer, body)
            if route in {"/jobs/status", "/jobs/cancel"}:
                job = self.jobs.get(body.get("id", ""))
                if not job or job["owner"] != peer_id:
                    raise DeviceError("job_not_found")
                if route.endswith("cancel"):
                    job["cancel"].set()
                    job.update(status="cancelled", result="")
                return {"id": job["id"], "status": job["status"], "result": job["result"]}
            raise DeviceError("unknown_operation")

    def _pair(self, body):
        token, peer_id = body.get("invite"), body.get("id")
        if (not self.invite or self.invite["expires"] <= time.monotonic() or not isinstance(token, str)
                or len(token) > 128 or not hmac.compare_digest(self.invite["hash"], digest(token))):
            raise DeviceError("invalid_or_expired_invite")
        if not isinstance(peer_id, str) or len(peer_id) != 64 or any(c not in "0123456789abcdef" for c in peer_id):
            raise DeviceError("invalid_identity")
        name = label(body.get("name"))
        if peer_id == self.identity.id or len(self.pending) >= 8:
            raise DeviceError("pairing_limit")
        ticket = secrets.token_urlsafe(32)
        verification = digest(":".join(sorted([self.identity.id, peer_id])))[:16]
        self.pending[ticket] = {"id": peer_id, "name": name, "verification": verification,
                                "expires": time.monotonic() + 300}
        self.invite = None  # Single-use even while awaiting local approval.
        return {"ticket": ticket, "verification": verification}

    def _submit(self, peer_id, peer, body):
        if not peer.get("assistance"):
            raise DeviceError("assistance_not_allowed")
        goal, model, job_id = body.get("goal"), body.get("model"), body.get("id")
        if (not isinstance(goal, str) or not 1 <= len(goal) <= 16000 or not isinstance(model, str)
                or model not in self.identity.data["models"] or not isinstance(job_id, str)
                or len(job_id) != 32 or any(c not in "0123456789abcdef" for c in job_id)
                or set(body) != {"id", "goal", "model"}):
            raise DeviceError("invalid_task_or_model")
        if job_id in self.jobs:
            if self.jobs[job_id]["owner"] != peer_id:
                raise DeviceError("job_not_found")
            return {"id": job_id, "status": self.jobs[job_id]["status"]}
        if self.endpoint_cache is None:
            raise DeviceError("local_runtime_not_ready")
        if any(j.get("active") for j in self.jobs.values()) or len(self.jobs) >= 64:
            raise DeviceError("device_busy")
        job = {"id": job_id, "owner": peer_id, "status": "running", "result": "", "cancel": threading.Event(),
               "created": time.monotonic(), "model": model, "active": True}
        self.jobs[job_id] = job
        endpoint = self.endpoint_cache
        threading.Thread(target=self._run, args=(job, endpoint, model, goal), daemon=True, name="hebri-device-assist").start()
        return {"id": job_id, "status": "running"}

    def _run(self, job, endpoint, model, goal):
        try:
            result = self.worker(endpoint, model, goal, job["cancel"])
            status = "completed"
        except Exception:
            result, status = "", "failed"
        with self.lock:
            job["active"] = False
            peer = self.identity.data["peers"].get(job["owner"], {})
            if job["cancel"].is_set() or not peer.get("assistance") or not self.server:
                job.update(status="cancelled", result="")
            else:
                job.update(status=status, result=str(result)[:16000])

    def peer_call(self, peer_id, route, body):
        with self.lock:
            if not self.server:
                raise DeviceError("sharing_disabled")
            peer = dict(self.identity.data["peers"].get(peer_id, {}))
        if not peer.get("outgoing"):
            raise DeviceError("outgoing_pairing_required")
        if self.discovery:
            discovered = next((row for row in self.discovery.snapshot() if row["id"] == peer_id), None)
            if discovered:
                peer.update(address=discovered["address"], port=discovered["port"])
        # A changed discovered address still has to present the pinned certificate.
        result = request(peer["address"], peer["port"], peer["cert"], route, body, peer["outgoing"])
        if route.startswith("/jobs/") and isinstance(result.get("id"), str):
            with self.lock:
                self._expire()
                if route == "/jobs/start" and len(self.outgoing_jobs) < 64:
                    self.outgoing_jobs[result["id"]] = {"peer": peer_id, "id": result["id"],
                        "created": time.monotonic(), "model": body.get("model", ""), "name": peer["name"]}
                if result["id"] in self.outgoing_jobs:
                    self.outgoing_jobs[result["id"]]["status"] = result.get("status", "unknown")
        return result

    def refresh(self):
        # Called under the caller's profile context, not a peer server thread.
        if self.identity.data["enabled"]:
            self.start()
        if self.server and time.monotonic() - self.hardware_cache[1] > 10:
            self.hardware_cache = (self.hardware(), time.monotonic())
        try:
            self.endpoint_cache = self.endpoint() if self.server else None
        except DeviceError:
            self.endpoint_cache = None

    def catalog(self):
        from .worker import catalog
        self.refresh()
        return catalog(self.endpoint_cache) if self.endpoint_cache else []

    def addresses(self):
        addresses = set()
        try:
            rows = socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)
        except OSError:
            rows = []
        for row in rows:
            try:
                address = private_address(row[4][0])
                if not address.startswith("127."):
                    addresses.add(address)
            except DeviceError:
                continue
        return sorted(addresses)

    def snapshot(self):
        self.refresh()
        with self.lock:
            self._expire()
            return {"enabled": self.server is not None, "id": self.identity.id, "name": self.identity.data["name"],
                    "models": self.identity.data["models"], "hardware": self.hardware_cache[0],
                    "runtime_ready": self.endpoint_cache is not None, "discovery_unavailable": self.discovery_error,
                    "addresses": self.addresses(),
                    "nearby": self.discovery.snapshot() if self.discovery else [],
                    "peers": [{"id": key, "name": row["name"], "outgoing": bool(row.get("outgoing")),
                               "assistance": bool(row.get("assistance"))} for key, row in self.identity.data["peers"].items()],
                    "pending": [{"ticket": key, "name": row["name"], "verification": row["verification"]}
                                for key, row in self.pending.items() if not row.get("token")],
                    "joining": [{"id": key, "name": row["name"]} for key, row in self.joining.items()],
                    "jobs": [{"id": row["id"], "owner": row["owner"], "status": row["status"], "model": row["model"]}
                             for row in self.jobs.values()],
                    "outgoing_jobs": [{k: v for k, v in row.items() if k != "created"}
                                      for row in self.outgoing_jobs.values()]}

    def local_cancel(self, job_id):
        with self.lock:
            job = self.jobs.get(job_id)
            if not job:
                raise DeviceError("job_not_found")
            job["cancel"].set()
            job.update(status="cancelled", result="")
