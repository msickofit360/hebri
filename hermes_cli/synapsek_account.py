"""Standalone account controller shared by Hebri terminal and local dashboard."""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
from typing import Callable
import uuid

from hermes_constants import get_hermes_home, find_node_executable
from hermes_cli.synapsek_store import AccountStore


class AccountError(RuntimeError):
    pass


def account_entry(root: Path) -> Path:
    """Use the install's bundled helper, or rebuild stale checkout assets."""
    from hermes_cli.main_tui_launch import _find_bundled_tui, _make_tui_argv, _tui_need_rebuild
    external = os.environ.get("HERMES_TUI_DIR")
    if external:
        entry = Path(external) / "dist" / "account-client.js"
    elif bundled := _find_bundled_tui(root / "hermes_cli"):
        entry = bundled.with_name("account-client.js")
    else:
        entry = root / "ui-tui" / "dist" / "account-client.js"
        if _tui_need_rebuild(root / "ui-tui"):
            _make_tui_argv(root / "ui-tui", tui_dev=False)
    if not entry.is_file():
        raise AccountError("account_runtime_unavailable")
    return entry


def run_account(action: str, *, home: Path | None = None, on_authorize: Callable[[str], None] | None = None,
                body=None, expected_user_id: str | None = None, timeout: float = 420):
    """Run the existing PKCE controller with a cross-process rotation lock.

    Tokens travel only through private child pipes and the OS-encrypted store.
    Returned projections contain no OAuth tokens. A login can emit two consent
    URLs (OAuth followed by Synapsek's device binding), both handled explicitly.
    """
    home = (home or get_hermes_home()).resolve()
    store = AccountStore(home)
    if action == "status" and not store.file.exists():
        return {"state": "signed_out"}
    root = Path(__file__).resolve().parent.parent
    entry = account_entry(root)
    node = find_node_executable("node")
    if not node or not entry.is_file():
        raise AccountError("account_runtime_unavailable")
    home.mkdir(parents=True, exist_ok=True, mode=0o700)
    from hermes_cli.auth import _auth_store_lock
    from tools.environments.local import served_profile_child_env
    env = served_profile_child_env(dict(os.environ), target_home=home)
    request = {"action": action, "home": str(home), "root": str(root), "python": sys.executable,
               "body": body, "expectedUserId": expected_user_id, "requestId": str(uuid.uuid4())}
    try:
        with _auth_store_lock(timeout_seconds=30, target_path=store.file):
            process = subprocess.Popen([node, str(entry)], cwd=root, env=env, stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, encoding="utf-8",
                                       creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0)
            timer = threading.Timer(timeout, process.kill)
            timer.daemon = True
            timer.start()
            try:
                process.stdin.write(json.dumps(request) + "\n")
                process.stdin.close()
                while line := process.stdout.readline(3_000_000):
                    if len(line) >= 3_000_000:
                        raise AccountError("invalid_response")
                    message = json.loads(line)
                    if message.get("event") == "authorize":
                        if on_authorize:
                            on_authorize(message["url"])
                        continue
                    if message.get("ok"):
                        return message["result"]
                    code = str(message.get("error") or "account_unavailable")
                    raise AccountError(code if re.fullmatch(r"[a-z_]{1,64}", code) else "account_unavailable")
                raise AccountError("account_unavailable")
            finally:
                timer.cancel()
                if process.poll() is None:
                    process.kill()
                process.wait(timeout=10)
                process.stdout.close()
    except AccountError:
        raise
    except Exception as exc:
        raise AccountError("account_unavailable") from exc


def select_synapsek(home: Path | None = None):
    """Change only the explicitly selected Bit's model; never copy credentials."""
    from hermes_cli.config import atomic_config_write
    import yaml
    path = (home or get_hermes_home()) / "config.yaml"
    config = yaml.safe_load(path.read_text(encoding="utf-8")) if path.exists() else {}
    config = config or {}
    model = dict(config.get("model") or {})
    for key in ("base_url", "api_key", "key_env", "api_key_env", "api_mode"):
        model.pop(key, None)
    model.update(provider="synapsek", default="synapsek-auto")
    config["model"] = model
    atomic_config_write(path, config)


def model_flow(current_model=""):
    """Select a managed model without prompting for or saving bridge secrets."""
    from hermes_cli.auth import AuthError, resolve_api_key_provider_credentials
    from hermes_cli.model_setup_flows_common import _finish_model, _pick_model_or_prompt
    from hermes_cli.models import fetch_api_models
    try:
        credentials = resolve_api_key_provider_credentials("synapsek")
    except AuthError:
        print("Sign in first: hebri auth synapsek login")
        return
    if not credentials.get("api_key"):
        print("Sign in first: hebri auth synapsek login")
        return
    models = fetch_api_models(credentials["api_key"], credentials["base_url"])
    selected = _pick_model_or_prompt(
        models or ["synapsek-auto"], "Synapsek model: ", current_model=current_model,
        confirm_provider="synapsek", confirm_base_url=credentials["base_url"],
        confirm_api_key=credentials["api_key"])
    return _finish_model(selected, "synapsek", f"Default model set to: {selected} (via Synapsek)",
                         drop_base_url=True, drop_api_mode=True)


def cli(args):
    import webbrowser
    action = args.synapsek_action
    def authorize(url):
        print(f"Open this link to continue Synapsek sign-in:\n{url}", flush=True)
        if not getattr(args, "no_browser", False):
            webbrowser.open(url)
    try:
        view = run_account(action, on_authorize=authorize)
        if action == "login" and view.get("account", {}).get("managedInferenceEnabled"):
            select_synapsek()
        if view.get("state") == "signed_in":
            account = view["account"]
            print("Signed in to Synapsek.")
            if not account.get("managedInferenceEnabled"):
                print("Model access is off for this connection. It requires sign-in consent and an eligible plan.")
            else:
                print("Ready: run hebri --tui or hebri dashboard.")
        else:
            print("Signed out of Synapsek.")
    except AccountError as exc:
        print(f"Synapsek: {exc}", file=sys.stderr)
        if str(exc) == "secure_storage_unavailable":
            print("Unlock your OS keychain. Linux requires a running Secret Service keyring; credentials are never saved as plaintext.", file=sys.stderr)
        raise SystemExit(1)
