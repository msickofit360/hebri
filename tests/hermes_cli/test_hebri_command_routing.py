"""Public commands must stay in Hebri and preserve the served Bit's identity."""
import json
import os
from pathlib import Path
import subprocess
import sys
import shutil

import pytest


def test_public_child_launcher_preserves_served_home_a_b_a(tmp_path, monkeypatch):
    from hermes_constants import apply_subprocess_home_env
    from tools.environments.local import served_profile_child_env

    launch = tmp_path / "launch"
    monkeypatch.setenv("HERMES_HOME", str(launch))
    monkeypatch.setenv("HEBRI_HOME", str(launch))
    homes = {name: tmp_path / name for name in ("alpha", "beta")}
    for name, home in homes.items():
        home.mkdir()
        (home / "SOUL.md").write_text(name, encoding="utf-8")
        (home / "config.yaml").write_text("{}", encoding="utf-8")
    code = (
        "import json; from hermes_cli.hebri import configure_home; "
        "from hermes_constants import get_hermes_home; "
        "configure_home(); h=get_hermes_home(); "
        "print(json.dumps([str(h), (h/'SOUL.md').read_text()]))"
    )
    baseline = dict(os.environ)
    for name in ("alpha", "beta", "alpha"):
        home = homes[name]
        env = served_profile_child_env(baseline, target_home=home)
        # The generic terminal environment must obey the same public-entry contract.
        terminal_env = {**baseline, "HERMES_HOME": str(home)}
        apply_subprocess_home_env(terminal_env)
        assert terminal_env["HEBRI_HOME"] == env["HEBRI_HOME"] == str(home)
        result = subprocess.run([sys.executable, "-c", code], env=env,
                                capture_output=True, text=True, timeout=30, check=True)
        assert json.loads(result.stdout) == [str(home), name]
    assert dict(os.environ) == baseline


def test_worker_resolution_prefers_owned_hebri_and_never_foreign_hermes(tmp_path, monkeypatch):
    from tools import bot_relay
    from tools.environments import local

    owned, foreign = tmp_path / "owned", tmp_path / "foreign"
    owned.mkdir()
    foreign.mkdir()
    suffix = ".exe" if sys.platform == "win32" else ""
    for root, name in ((owned, "hebri"), (foreign, "hermes"), (foreign, "hebri")):
        script = root / (name + suffix)
        script.write_text("fixture", encoding="utf-8")
        script.chmod(0o755)
    monkeypatch.setattr(sys, "executable", str(owned / ("python" + suffix)))
    monkeypatch.setenv("PATH", str(foreign))
    monkeypatch.setattr(local, "_HERMES_BIN_DIR", local._SENTINEL)
    assert Path(bot_relay.local_delivery_command("alpha", "query.txt")[0]) == owned / ("hebri" + suffix)
    assert Path(local._resolve_hermes_bin_dir()) == owned
    (owned / ("hebri" + suffix)).unlink()
    (foreign / ("hebri" + suffix)).unlink()
    monkeypatch.setattr(local, "_HERMES_BIN_DIR", local._SENTINEL)
    monkeypatch.setattr(sys, "argv", ["fixture.py"])
    assert bot_relay._hermes_cli() == "hebri"
    assert local._resolve_hermes_bin_dir() is None


def test_profile_alias_cannot_replace_public_command(tmp_path, monkeypatch):
    from hermes_cli import profiles

    monkeypatch.setattr(profiles, "_get_wrapper_dir", lambda: tmp_path)
    # Existing profile IDs remain valid; only the launcher filename is reserved.
    profiles.validate_profile_name("hebri")
    public = tmp_path / ("hebri.bat" if sys.platform == "win32" else "hebri")
    public.write_text("public launcher", encoding="utf-8")
    with pytest.raises(ValueError, match="reserved"):
        profiles.create_wrapper_script("hebri", "alpha")
    assert public.read_text() == "public launcher"


def test_public_help_and_bash_completion_use_hebri_profile_home(tmp_path):
    from hermes_cli._parser import build_top_level_parser
    from hermes_cli.completion import generate_bash

    env = {**os.environ, "HEBRI_HOME": tmp_path.as_posix()}
    result = subprocess.run([sys.executable, "-m", "hermes_cli.hebri", "--help"],
                            env=env, capture_output=True, text=True, timeout=30, check=True)
    assert result.stdout.startswith("usage: hebri ")
    bash = shutil.which("bash")
    if not bash:
        pytest.skip("Bash is needed to execute shell completion")
    (tmp_path / "profiles" / "alpha").mkdir(parents=True)
    (tmp_path / "profiles" / "beta").mkdir()
    script = generate_bash(build_top_level_parser()[0])
    script += '\ncomplete -p hebri\nCOMP_WORDS=(hebri -p a); COMP_CWORD=2\n_hebri_completion\nprintf "PROFILE:%s\\n" "${COMPREPLY[@]}"\n'
    completed = subprocess.run([bash, "--noprofile", "--norc"], input=script, env=env,
                               capture_output=True, text=True, timeout=30, check=True)
    assert "PROFILE:alpha" in completed.stdout
    assert "PROFILE:beta" not in completed.stdout


def test_renamed_commands_keep_existing_gateway_protections():
    from tools.approval_detection import detect_dangerous_command
    from cron.lifecycle_guard import contains_gateway_lifecycle_command_or_referenced_script

    for launcher in ("hebri", "hermes"):
        assert detect_dangerous_command(f"{launcher} gateway restart")[0]
        assert detect_dangerous_command(f"{launcher} update")[0]
        assert contains_gateway_lifecycle_command_or_referenced_script(f"{launcher} gateway stop")
    assert not contains_gateway_lifecycle_command_or_referenced_script("hebri gateway status")

