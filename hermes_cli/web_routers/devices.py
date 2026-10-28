"""Authenticated desktop control surface. Never mounted on the peer listener."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from hermes_cli.devices.identity import DeviceError
from hermes_cli.devices.runtime import service
from hermes_cli.web_routers._common import config_scoped_to_thread, destructive_profile

router = APIRouter()


class DeviceOperation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    operation: str = Field(max_length=32)
    payload: dict = Field(default_factory=dict)


def operate(operation, body):
    runtime = service()
    operations = {
        "status": lambda: runtime.snapshot(),
        "catalog": lambda: runtime.catalog(),
        "configure": lambda: runtime.configure(body.get("name"), body.get("enabled"), body.get("models", [])),
        "invite": lambda: runtime.create_invite(body.get("address", "")),
        "join": lambda: runtime.join(body.get("invite")),
        "approve": lambda: runtime.approve(body.get("ticket"), body.get("assistance", False)),
        "finish": lambda: runtime.finish(body.get("id")),
        "revoke": lambda: runtime.revoke(body.get("id")),
        "cancelLocal": lambda: runtime.local_cancel(body.get("id")),
        "peerStatus": lambda: runtime.peer_call(body.get("peer"), "/status", {}),
        "ask": lambda: runtime.peer_call(body.get("peer"), "/jobs/start", {
            "id": body.get("id"), "model": body.get("model"), "goal": body.get("goal")}),
        "result": lambda: runtime.peer_call(body.get("peer"), "/jobs/status", {"id": body.get("id")}),
        "cancel": lambda: runtime.peer_call(body.get("peer"), "/jobs/cancel", {"id": body.get("id")}),
    }
    if operation not in operations:
        raise DeviceError("invalid_operation")
    if operation in {"ask", "peerStatus"}:
        runtime.refresh()
    return operations[operation]()


@router.post("/api/devices")
async def device_operation(body: DeviceOperation, request: Request, profile: str | None = None):
    # Existing dashboard authentication/CSRF middleware applies first. A paired
    # peer bearer is intentionally not a dashboard/session credential.
    if not request.client or request.client.host not in {"127.0.0.1", "::1"}:
        raise HTTPException(status_code=403, detail="local_device_control_required")
    profile = destructive_profile(profile, "devices")
    try:
        return {"ok": True, "value": await config_scoped_to_thread(profile, lambda: operate(body.operation, body.payload))}
    except DeviceError as error:
        return {"ok": False, "code": str(error)}
    except Exception:
        return {"ok": False, "code": "device_operation_failed"}
