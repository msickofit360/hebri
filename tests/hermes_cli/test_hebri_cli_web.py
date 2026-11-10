"""Public command, browser identity and native terminal regression checks."""
import asyncio
import json
import os
from pathlib import Path
import subprocess
import sys
import time

import pytest


@pytest.fixture(autouse=True)
def isolated_home(tmp_path, monkeypatch):
    for key in ("HOME", "USERPROFILE", "HEBRI_HOME", "HERMES_HOME"):
        monkeypatch.setenv(key, str(tmp_path))
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setenv("HERMES_TEST_ISOLATION", "1")


def test_product_release_is_independent_of_engine_version(tmp_path):
    from hermes_cli import __version__
    from hermes_cli.product_version import product_version
    manifest = tmp_path / "apps" / "desktop" / "package.json"
    manifest.parent.mkdir(parents=True)
    manifest.write_text(json.dumps({"version": "9.8.7-beta.1"}))
    assert product_version(tmp_path) == "9.8.7-beta.1"
    manifest.write_text("[]")
    assert product_version(tmp_path) == f"{__version__}-engine"
    manifest.write_text(json.dumps({"version": "<invalid>"}))
    assert product_version(tmp_path) == f"{__version__}-engine"


def test_public_help_and_version(tmp_path):
    from hermes_cli.product_version import product_version
    from hermes_cli import __version__
    for args, expected in ((["--help"], "hebri                         Start interactive chat"),
                           (["--version"], f"Hebri v{product_version()} · engine {__version__}"),
                           (["dashboard", "--help"], "usage: hebri dashboard")):
        run = subprocess.run([sys.executable, "-m", "hermes_cli.hebri", *args],
                             capture_output=True, text=True, encoding="utf-8", timeout=40)
        assert run.returncode == 0, run.stderr
        assert expected in run.stdout


@pytest.mark.parametrize("command,expected", [
    ("hebri dashboard", ("dashboard", "127.0.0.1", 9119)),
    ("hebri -p blue dashboard --port=9121 --host 127.0.0.1", ("dashboard", "127.0.0.1", 9121)),
    ("python -m hermes_cli.hebri --profile dashboard serve --port 0", ("serve", "127.0.0.1", 0)),
    ("python -m hermes_cli.main dashboard", ("dashboard", "127.0.0.1", 9119)),
    ('"C:/Program Files/Hebri/hebri.exe" dashboard --port 9122', ("dashboard", "127.0.0.1", 9122)),
    ('echo "hebri dashboard"', None),
    ('python unrelated.py "hebri dashboard"', None),
    ('hebri chat -q "dashboard --port 9122"', None),
    ("hebri --profile dashboard model", None),
    ("hebri dashboard --port invalid", None),
    ("hebri dashboard --port 65536", None),
])
def test_dashboard_recognizes_real_public_launches_only(command, expected):
    from hermes_cli.main_dashboard import _parse_dashboard_runtime
    assert _parse_dashboard_runtime(command) == expected


def test_default_skin_and_startup_errors_use_hebri():
    from hermes_cli.skin_engine import load_skin
    from tui_gateway.user_messages import agent_init_failed_message
    assert load_skin("default").branding["agent_name"] == "Hebri Agent"
    assert agent_init_failed_message("missing provider").startswith("Hebri could not start")


def test_browser_profile_child_home_a_b_a(tmp_path):
    # Initialize CLI config once, as a real dashboard does before accepting chats.
    import hermes_cli.main  # noqa: F401
    from hermes_cli.web_server_chat import _resolve_chat_argv
    for name in ("alpha", "beta"):
        home = tmp_path / "profiles" / name
        home.mkdir(parents=True)
        (home / "config.yaml").write_text("{}")
    before = dict(os.environ)
    for name in ("alpha", "beta", "alpha"):
        _, _, env = _resolve_chat_argv(profile=name)
        assert Path(env["HEBRI_HOME"]) == tmp_path / "profiles" / name
        assert env["HEBRI_HOME"] == env["HERMES_HOME"]
    assert dict(os.environ) == before


@pytest.mark.skipif(sys.platform != "win32", reason="Real Windows ConPTY integration")
def test_windows_browser_terminal_input_output_and_host(tmp_path):
    from hermes_cli.win_pty_bridge import WinPtyBridge
    assert WinPtyBridge.is_available(), "Windows distribution must include pywinpty"
    script = tmp_path / "terminal_probe.py"
    script.write_text('import os\nprint("HOST=" + os.environ["HERMES_PTY_HOST"], flush=True)\n'
                      'print("REPLY=" + input(), flush=True)\n', encoding="utf-8")
    bridge = WinPtyBridge.spawn([sys.executable, "-u", str(script)], env=dict(os.environ))
    try:
        bridge.resize(100, 30)
        assert asyncio.run(bridge.write(b"hello-browser\r\n"))
        output = b""
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            data = bridge.read()
            if data is None:
                break
            output += data
            if b"REPLY=hello-browser" in output:
                break
        assert b"HOST=dashboard" in output
        assert b"REPLY=hello-browser" in output
    finally:
        bridge.close()
    assert not bridge.is_alive()
