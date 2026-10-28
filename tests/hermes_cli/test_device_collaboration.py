"""Real HTTPS pairing and request boundaries across isolated profile homes."""
import base64
import json
import secrets
import threading
import time

import pytest
from cryptography.fernet import Fernet

from hermes_cli.devices.identity import DeviceError, Identity, private_address
from hermes_cli.devices.service import DeviceService
from hermes_cli.devices.transport import request


@pytest.fixture
def devices(tmp_path):
    instances = []
    def make(name):
        runtime = DeviceService(tmp_path / name, Fernet.generate_key().decode(), bind="127.0.0.1", discovery=False,
                               endpoint=lambda: "fixture", worker=lambda endpoint, model, goal, cancel: "Answer: " + goal,
                               hardware=lambda: {"os": "fixture", "gpu_name": "test GPU"})
        runtime.configure(name, True, ["fixture-model"])
        runtime.refresh()
        instances.append(runtime)
        return runtime
    yield make
    for runtime in instances:
        runtime.close()


def pair(host, client, allow=True):
    invite = host.create_invite("127.0.0.1")["invite"]
    joined = client.join(invite)
    pending = host.snapshot()["pending"]
    assert pending[0]["verification"] == joined["verification"]
    assert client.finish(host.identity.id)["status"] == "pending"
    host.approve(pending[0]["ticket"], allow)
    assert client.finish(host.identity.id)["status"] == "approved"
    return invite


def wait_result(client, host, job_id):
    deadline = time.monotonic() + 3
    while time.monotonic() < deadline:
        result = client.peer_call(host.identity.id, "/jobs/status", {"id": job_id})
        if result["status"] != "running":
            return result
        time.sleep(.02)
    pytest.fail("job did not complete")


def test_pair_is_single_use_and_does_not_imply_reverse_access(devices):
    a, b, c = devices("A"), devices("B"), devices("C")
    invite = pair(a, b)
    assert b.peer_call(a.identity.id, "/status", {})["hardware"]["gpu_name"] == "test GPU"
    with pytest.raises(DeviceError, match="invalid_or_expired_invite"):
        c.join(invite)
    with pytest.raises(DeviceError, match="outgoing_pairing_required"):
        a.peer_call(b.identity.id, "/status", {})
    assert "outgoing" not in json.dumps(a.snapshot()["pending"])


def test_real_tls_task_and_cross_user_denial_and_revocation(devices):
    a, b, c = devices("A"), devices("B"), devices("C")
    pair(a, b)
    pair(a, c)
    job_id = secrets.token_hex(16)
    b.peer_call(a.identity.id, "/jobs/start", {"id": job_id, "model": "fixture-model", "goal": "synthetic task"})
    assert wait_result(b, a, job_id)["result"] == "Answer: synthetic task"
    with pytest.raises(DeviceError, match="job_not_found"):
        c.peer_call(a.identity.id, "/jobs/status", {"id": job_id})
    a.revoke(b.identity.id)
    with pytest.raises(DeviceError, match="device_not_authorized"):
        b.peer_call(a.identity.id, "/status", {})
    assert c.peer_call(a.identity.id, "/status", {})["ready"]


def test_metadata_only_peer_cannot_run_or_escalate(devices):
    a, b = devices("A"), devices("B")
    pair(a, b, allow=False)
    assert b.peer_call(a.identity.id, "/status", {})["models"] == []
    with pytest.raises(DeviceError, match="assistance_not_allowed"):
        b.peer_call(a.identity.id, "/jobs/start", {"id": secrets.token_hex(16), "goal": "task", "model": "fixture-model"})
    with pytest.raises(DeviceError, match="unknown_operation"):
        b.peer_call(a.identity.id, "/api/config", {"auto_approve": True})


def test_wrong_certificate_fails_before_sending_credentials(devices):
    a, b, c = devices("A"), devices("B"), devices("C")
    pair(a, b)
    with pytest.raises(DeviceError, match="identity_changed"):
        request("127.0.0.1", a.server.server_port, c.identity.cert, "/status", {}, "not-a-real-token")


def test_invite_requires_local_approval_and_expiry(devices):
    a, b = devices("A"), devices("B")
    invite = a.create_invite("127.0.0.1")["invite"]
    a.invite["expires"] = time.monotonic() - 1
    with pytest.raises(DeviceError, match="invalid_or_expired_invite"):
        b.join(invite)
    b.join(a.create_invite("127.0.0.1")["invite"])
    with pytest.raises(DeviceError, match="outgoing_pairing_required"):
        b.peer_call(a.identity.id, "/status", {})


def test_cancelled_worker_keeps_capacity_until_it_exits(devices):
    a, b = devices("A"), devices("B")
    pair(a, b)
    entered, release = threading.Event(), threading.Event()
    def slow(*args):
        entered.set()
        release.wait(3)
        return "must not be delivered"
    a.worker = slow
    job_id = secrets.token_hex(16)
    payload = {"id": job_id, "model": "fixture-model", "goal": "task"}
    b.peer_call(a.identity.id, "/jobs/start", payload)
    assert entered.wait(1)
    b.peer_call(a.identity.id, "/jobs/cancel", {"id": job_id})
    try:
        with pytest.raises(DeviceError, match="device_busy"):
            b.peer_call(a.identity.id, "/jobs/start", {**payload, "id": secrets.token_hex(16)})
    finally:
        release.set()
    assert wait_result(b, a, job_id)["result"] == ""


def test_model_allowlist_payload_bounds_and_no_tool_override(devices):
    a, b = devices("A"), devices("B")
    pair(a, b)
    payload = {"id": secrets.token_hex(16), "model": "fixture-model", "goal": "task"}
    for change in [{"model": "unapproved"}, {"goal": "x" * 16001}, {"tools": ["terminal"]}]:
        with pytest.raises(DeviceError, match="invalid_task_or_model"):
            b.peer_call(a.identity.id, "/jobs/start", {**payload, **change})


def test_encrypted_identity_restart_and_profile_isolation(tmp_path):
    key = Fernet.generate_key().decode()
    first = Identity(tmp_path / "A", key)
    first.data["peers"]["fixture"] = {"outgoing": "secret-fixture-token"}
    first.save()
    assert b"secret-fixture-token" not in first.path.read_bytes()
    assert Identity(tmp_path / "A", key).id == first.id
    assert Identity(tmp_path / "B", key).id != first.id
    with pytest.raises(DeviceError, match="identity_locked"):
        Identity(tmp_path / "A", Fernet.generate_key().decode())


@pytest.mark.parametrize("address", ["example.com", "https://192.168.1.1", "169.254.169.254", "8.8.8.8", "0.0.0.0", "224.0.0.1"])
def test_only_literal_private_targets(address):
    with pytest.raises(DeviceError):
        private_address(address)


def test_restart_preserves_port_and_trust(devices):
    a, b = devices("A"), devices("B")
    pair(a, b)
    pair(b, a)
    port, identity = a.server.server_port, a.identity.id
    a.close()
    a.start()
    assert a.server.server_port == port
    assert b.peer_call(identity, "/status", {})["id"] == identity
    assert a.peer_call(b.identity.id, "/status", {})["id"] == b.identity.id


def test_model_removal_cancels_work_and_outgoing_tasks_survive_panel_refresh(devices):
    a, b = devices("A"), devices("B")
    pair(a, b)
    entered, release = threading.Event(), threading.Event()
    def slow(*args):
        entered.set()
        release.wait(2)
        return "late result"
    a.worker = slow
    job = secrets.token_hex(16)
    b.peer_call(a.identity.id, "/jobs/start", {"id": job, "model": "fixture-model", "goal": "task"})
    assert entered.wait(1)
    assert b.snapshot()["outgoing_jobs"][0]["id"] == job
    try:
        a.configure("A", True, [])
        assert b.peer_call(a.identity.id, "/jobs/status", {"id": job})["status"] == "cancelled"
    finally:
        release.set()


def test_profile_a_b_a_registry_and_secret_scrub(tmp_path, monkeypatch):
    from hermes_constants import set_hermes_home_override, reset_hermes_home_override
    from hermes_cli.devices.runtime import service, stop_all
    from tools.environments.local import hermes_subprocess_env
    key = Fernet.generate_key().decode()
    monkeypatch.setenv("HEBRI_DEVICE_STORAGE_KEY", key)
    ids = []
    try:
        for name in ["A", "B", "A"]:
            home = tmp_path / name
            home.mkdir(exist_ok=True)
            token = set_hermes_home_override(home)
            try:
                runtime = service()
                ids.append(runtime.identity.id)
                assert runtime.server is None
                assert "HEBRI_DEVICE_STORAGE_KEY" not in hermes_subprocess_env(inherit_credentials=True)
            finally:
                reset_hermes_home_override(token)
        assert ids[0] == ids[2] != ids[1]
    finally:
        stop_all()


def test_real_local_worker_contract_and_cancel_after_headers():
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    from urllib.parse import urlsplit
    from hermes_cli.devices.worker import assist
    entered, release = threading.Event(), threading.Event()
    calls, errors = [], []
    class RuntimeHandler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            calls.append((self.path, self.headers["Authorization"], body))
            self.send_response(200)
            # HTTP/1.0 close-delimited body: HTTPConnection.sock is detached here.
            self.end_headers()
            self.wfile.flush()
            entered.set()
            if body["messages"][-1]["content"] == "wait":
                release.wait(3)
            try:
                self.wfile.write(json.dumps({"choices": [{"message": {"content": "synthetic answer"}}]}).encode())
            except OSError:
                pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), RuntimeHandler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    endpoint = (urlsplit(f"http://127.0.0.1:{server.server_port}"), "fixture-key")
    try:
        assert assist(endpoint, "model", "hello", threading.Event()) == "synthetic answer"
        assert calls[0][0] == "/v1/chat/completions"
        assert calls[0][1] == "Bearer fixture-key"
        assert "tools" not in calls[0][2]
        assert len(calls[0][2]["messages"]) == 2
        entered.clear()
        cancel = threading.Event()
        def invoke():
            try:
                assist(endpoint, "model", "wait", cancel)
            except Exception as error:
                errors.append(error)
        worker = threading.Thread(target=invoke, daemon=True)
        worker.start()
        assert entered.wait(1)
        cancel.set()
        worker.join(timeout=1.5)
        assert not worker.is_alive()
        assert errors
    finally:
        release.set()
        server.shutdown()
        server.server_close()


def test_agent_tool_dispatch_uses_only_the_active_profiles_peers(devices, monkeypatch):
    from hermes_constants import set_hermes_home_override, reset_hermes_home_override, hermes_home_key
    from hermes_cli.devices import runtime
    from tools import device_help_tool  # Registers the real, opt-in tool.
    from tools.registry import registry
    a, b, c = devices("A"), devices("B"), devices("C")
    pair(a, b)
    monkeypatch.setenv("HEBRI_DEVICE_STORAGE_KEY", b.identity.password)
    monkeypatch.setitem(runtime._services, hermes_home_key(b.home), b)
    monkeypatch.setitem(runtime._services, hermes_home_key(c.home), c)
    for client, count in [(b, 1), (c, 0), (b, 1)]:
        token = set_hermes_home_override(client.home)
        try:
            result = json.loads(registry.dispatch("device_help", {"action": "list"}))
            assert len(result["devices"]) == count
            assert device_help_tool.available()
            assert json.loads(registry.dispatch("device_help", {"action": "approve"}))["error"] == "invalid_operation"
            if count:
                task = json.loads(registry.dispatch("device_help", {
                    "action": "ask", "device": a.identity.id, "model": "fixture-model", "goal": "agent task"}))
                assert wait_result(b, a, task["id"])["result"] == "Answer: agent task"
        finally:
            reset_hermes_home_override(token)


def test_real_profile_clone_and_export_do_not_inherit_device_identity(tmp_path, monkeypatch):
    from hermes_cli import profiles
    import tarfile
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / ".hebri"))
    source = profiles.create_profile("source", no_alias=True, no_skills=True)
    Identity(source, Fernet.generate_key().decode())
    clone = profiles.create_profile("clone", clone_from="source", clone_all=True, no_alias=True)
    assert not (clone / "devices").exists()
    archive = profiles.export_profile("source", str(tmp_path / "export.tar.gz"))
    with tarfile.open(archive) as exported:
        assert not any("/devices/" in name for name in exported.getnames())
    forged = tmp_path / "with-device.tar.gz"
    with tarfile.open(forged, "w:gz") as bundle:
        bundle.add(source, arcname="imported")
    with pytest.raises(ValueError, match="not portable"):
        profiles.import_profile(str(forged), "imported")


def test_peer_listener_rejects_browser_origin(devices):
    import http.client
    import ssl
    a = devices("A")
    connection = http.client.HTTPSConnection("127.0.0.1", a.server.server_port,
        context=ssl.create_default_context(cadata=a.identity.cert))
    connection._context.check_hostname = False
    try:
        connection.request("POST", "/pair", "{}", {"Origin": "https://example.com"})
        response = connection.getresponse()
        assert response.status == 403
        assert json.loads(response.read())["error"] == "forbidden"
        assert not a.pending
    finally:
        connection.close()


def test_control_api_rejects_remote_clients_and_requires_secure_storage(tmp_path, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from hermes_cli.web_routers.devices import router
    app = FastAPI()
    app.include_router(router)
    remote = TestClient(app, client=("192.168.1.20", 50000))
    assert remote.post("/api/devices?profile=default", json={"operation": "configure"}).status_code == 403
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / ".hebri"))
    monkeypatch.delenv("HEBRI_DEVICE_STORAGE_KEY", raising=False)
    local = TestClient(app, client=("127.0.0.1", 50000))
    result = local.post("/api/devices?profile=default", json={"operation": "status"})
    assert result.json() == {"ok": False, "code": "secure_storage_required"}


def test_devices_are_configurable_but_default_off():
    from hermes_cli.tools_config import CONFIGURABLE_TOOLSETS, _DEFAULT_OFF_TOOLSETS
    from toolsets import resolve_toolset
    assert any(row[0] == "devices" for row in CONFIGURABLE_TOOLSETS)
    assert "devices" in _DEFAULT_OFF_TOOLSETS
    assert "device_help" in resolve_toolset("devices")
