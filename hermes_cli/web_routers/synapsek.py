"""Local-only account actions, scoped to the dashboard's explicitly selected Bit."""
from __future__ import annotations

import threading
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict

from hermes_cli.synapsek_account import AccountError, run_account, select_synapsek
from hermes_cli.web_routers._common import config_scoped_to_thread, config_write_scope, destructive_profile
from hermes_constants import get_hermes_home

router = APIRouter()
_flows: dict[str, dict] = {}
_lock = threading.Lock()


class AccountAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_user_id: Optional[str] = None


def require_local_account_access(request):
    from hermes_cli.web_server import _require_token
    _require_token(request)
    if (getattr(request.app.state, "auth_required", False)
            or not request.client or request.client.host not in {"127.0.0.1", "::1"}):
        raise HTTPException(403, "Synapsek account sign-in is available only in the local Hebri dashboard.")


@router.get("/api/synapsek/account")
async def account_status(request: Request, profile: Optional[str] = None):
    require_local_account_access(request)
    profile = destructive_profile(profile, route="Synapsek account")
    def read():
        home = get_hermes_home().resolve()
        with _lock:
            flow = dict(_flows.get(str(home), {}))
            if flow and flow.get("state") != "signing_in":
                _flows.pop(str(home), None)
        if flow:
            return flow
        try:
            return run_account("status", home=home)
        except AccountError as exc:
            return {"state": "unavailable", "error": str(exc)}
    return await config_scoped_to_thread(profile, read)


@router.post("/api/synapsek/account/login")
async def account_login(request: Request, profile: Optional[str] = None):
    require_local_account_access(request)
    profile = destructive_profile(profile, route="Synapsek sign-in")
    def start():
        home = get_hermes_home().resolve()
        key = str(home)
        with _lock:
            if _flows.get(key, {}).get("state") == "signing_in":
                return {"state": "signing_in"}
            _flows[key] = {"state": "signing_in"}
        def authorize(url):
            with _lock:
                _flows[key] = {"state": "signing_in", "authorize_url": url}
        def finish():
            try:
                result = run_account("login", home=home, on_authorize=authorize)
                if result.get("account", {}).get("managedInferenceEnabled"):
                    with config_write_scope(profile):
                        select_synapsek(home)
            except AccountError as exc:
                result = {"state": "unavailable", "error": str(exc)}
            except Exception:
                result = {"state": "unavailable", "error": "account_unavailable"}
            with _lock:
                _flows[key] = result
        from agent.memory_provider import spawn_context_thread
        spawn_context_thread(finish, name="synapsek-sign-in").start()
        return {"state": "signing_in"}
    return await config_scoped_to_thread(profile, start)


@router.post("/api/synapsek/account/logout")
async def account_logout(request: Request, action: AccountAction, profile: Optional[str] = None):
    require_local_account_access(request)
    profile = destructive_profile(profile, route="Synapsek sign-out")
    if not action.expected_user_id:
        raise HTTPException(400, "Refresh the account before signing out.")
    def logout():
        home = get_hermes_home().resolve()
        try:
            result = run_account("logout", home=home, expected_user_id=action.expected_user_id)
        except AccountError as exc:
            raise HTTPException(409, str(exc)) from exc
        with _lock:
            _flows.pop(str(home), None)
        return result
    return await config_scoped_to_thread(profile, logout)


@router.post("/api/synapsek/account/refresh")
async def account_refresh(request: Request, profile: Optional[str] = None):
    require_local_account_access(request)
    profile = destructive_profile(profile, route="Synapsek account refresh")
    def refresh():
        key = str(get_hermes_home().resolve())
        with _lock:
            if _flows.get(key, {}).get("state") != "signing_in":
                _flows.pop(key, None)
        return {"ok": True}
    return await config_scoped_to_thread(profile, refresh)
