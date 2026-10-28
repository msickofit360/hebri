"""Exercise the public launcher and actual Linux path-install stage beside Hermes."""
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]


def test_public_home_does_not_inherit_hermes_and_switches_without_cached_state(tmp_path, monkeypatch):
    from hermes_cli.hebri import configure_home
    from hermes_constants import get_hermes_home

    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "original-hermes"))
    monkeypatch.delenv("HEBRI_HOME", raising=False)
    selected = configure_home()
    assert selected != tmp_path / "original-hermes"
    assert selected.name in ("hebri", ".hebri")
    for name in ("A", "B", "A"):
        target = tmp_path / name
        monkeypatch.setenv("HEBRI_HOME", str(target))
        assert configure_home() == target
        assert get_hermes_home() == target


@pytest.mark.skipif(sys.platform != "linux", reason="Runs the real Linux installer")
def test_path_stage_and_uninstall_leave_original_hermes_intact(tmp_path):
    home = tmp_path / "user"
    bin_dir = home / ".local" / "bin"
    bin_dir.mkdir(parents=True)
    original = bin_dir / "hermes"
    original.write_text("#!/bin/sh\necho original-hermes\n", encoding="utf-8")
    original.chmod(0o755)
    data = home / ".hebri"
    checkout = data / "hebri-agent"
    (checkout / "venv" / "bin").mkdir(parents=True)
    (checkout / "venv" / "bin" / "python").symlink_to(sys.executable)
    owned_old_alias = bin_dir / "hermes-agent"
    owned_old_alias.write_text(f'#!/bin/bash\nexec "{checkout}/venv/bin/python" -m agent.legacy_cli "$@"\n')
    # Real Python invoked by the generated shell wrapper reports its environment.
    (checkout / "hermes").write_text(
        "import json, os; print(json.dumps([os.environ['HEBRI_HOME'], os.environ['HERMES_HOME']]))",
        encoding="utf-8",
    )
    env = {**os.environ, "HOME": str(home), "SHELL": "/bin/bash",
           "HEBRI_HOME": str(data), "HERMES_HOME": str(home / ".hermes")}
    for _ in range(2):
        run = subprocess.run(["bash", str(ROOT / "scripts/install.sh"), "--stage", "path",
                              "--dir", str(checkout), "--hermes-home", str(data), "--non-interactive"],
                             env=env, text=True, capture_output=True, timeout=30)
        assert run.returncode == 0, run.stdout + run.stderr
        assert original.read_text() == "#!/bin/sh\necho original-hermes\n"
        assert not owned_old_alias.exists()
        result = subprocess.check_output([str(bin_dir / "hebri")], env=env, text=True)
        assert json.loads(result) == [str(data), str(data)]
    # Import and run the real wrapper remover in a fresh process/home.
    env["PYTHONPATH"] = str(ROOT)
    env["HERMES_HOME"] = str(data)
    subprocess.run([sys.executable, "-c",
                    "from hermes_cli.uninstall import remove_wrapper_script; remove_wrapper_script()"],
                   cwd=ROOT, env=env, check=True, capture_output=True, text=True)
    assert original.exists()
    assert not (bin_dir / "hebri").exists()


@pytest.mark.skipif(sys.platform != "linux", reason="Linux service and XDG identity")
def test_service_identity_adopts_only_its_own_legacy_home(tmp_path, monkeypatch):
    from hermes_cli import gateway, gui_uninstall, linux_desktop_entry
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path / "config"))
    monkeypatch.setenv("XDG_DATA_HOME", str(tmp_path / "share"))
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / ".hebri"))
    suffix = gateway._profile_suffix()
    legacy = "hermes-gateway" + (f"-{suffix}" if suffix else "")
    current = "hebri-gateway" + (f"-{suffix}" if suffix else "")
    units = gateway.user_systemd_unit_dir()
    units.mkdir(parents=True)
    unit = units / f"{legacy}.service"
    unit.write_text(f'[Service]\nEnvironment="HERMES_HOME={tmp_path / ".hermes"}"\n')
    assert gateway.get_service_name() == current
    unit.write_text(f'[Service]\nEnvironment="HERMES_HOME={tmp_path / ".hebri"}"\n')
    assert gateway.get_service_name() == legacy
    unit.unlink()
    assert gateway.get_service_name() == current
    original = tmp_path / "share/applications/hermes.desktop"
    original.parent.mkdir(parents=True)
    original.write_text("Original Hermes")
    assert not linux_desktop_entry._remove_legacy_branding()
    assert original.read_text() == "Original Hermes"
    assert original not in gui_uninstall.packaged_gui_app_paths()
    assert gui_uninstall.legacy_desktop_userdata_dirs() == []


@pytest.mark.skipif(sys.platform != "win32", reason="Native Windows launcher paths")
def test_windows_task_identity_requires_owned_launcher_and_registration(tmp_path, monkeypatch):
    from hermes_cli import gateway, gateway_windows as windows
    home = tmp_path / "hebri"
    monkeypatch.setenv("HERMES_HOME", str(home))
    monkeypatch.setenv("APPDATA", str(tmp_path / "roaming"))
    suffix = gateway._profile_suffix()
    legacy = "Hermes_Gateway" + (f"_{suffix}" if suffix else "")
    current = "Hebri_Gateway" + (f"_{suffix}" if suffix else "")
    folder = home / "gateway-service"
    folder.mkdir(parents=True)
    script = folder / f"{legacy}.cmd"
    script.write_text(f'set "HERMES_HOME={home}"\n', encoding="utf-8")
    # External scheduler is the only seam: real paths, launcher contents and
    # identity resolution remain native. No user task is created or changed.
    monkeypatch.setattr(windows, "_exec_schtasks", lambda args: (0, r"<Command>C:\Hermes\gateway-service\run.cmd</Command>", ""))
    assert windows.get_task_name() == current

    monkeypatch.setattr(windows, "_exec_schtasks", lambda args: (0, f"<Command>{script}</Command>", ""))
    assert windows.get_task_name() == legacy
    script.write_text(f'set "HERMES_HOME={tmp_path / "other"}"\n', encoding="utf-8")
    assert windows.get_task_name() == current


@pytest.mark.skipif(sys.platform != "linux", reason="Runs a Linux service-manager fixture")
def test_cold_recovery_restarts_only_services_with_a_pinned_hebri_home(tmp_path, monkeypatch):
    from hermes_cli.update_restart_recovery import restart_serve_units
    home = tmp_path / "hebri"
    monkeypatch.setenv("HERMES_HOME", str(home))
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    record = tmp_path / "restarted"
    command = bin_dir / "systemctl"
    command.write_text(f'''#!{sys.executable}
import sys
from pathlib import Path
args = sys.argv[1:]
record = Path({str(record)!r})
if 'list-units' in args:
    if '--user' in args:
        print('hermes-serve.service loaded active running')
        print('hebri-serve.service loaded active running')
elif '--property=Environment' in args:
    home = {str(home)!r} if 'hebri-serve.service' in args else {str(tmp_path / 'original-hermes')!r}
    print('HERMES_HOME=' + home)
elif 'is-active' in args:
    print('active')
elif '--property=MainPID' in args:
    print('102' if record.exists() else '101')
elif 'restart' in args:
    with record.open('a') as out: out.write(args[-1] + '\\n')
''', encoding="utf-8", newline="\n")
    command.chmod(0o755)
    monkeypatch.setenv("PATH", str(bin_dir) + os.pathsep + os.environ.get("PATH", ""))
    result = restart_serve_units()
    assert result == {"verified": ["user/hebri-serve"], "failed": []}
    assert record.read_text() == "hebri-serve.service\n"


@pytest.mark.skipif(sys.platform != "win32", reason="Runs the actual PowerShell launcher installer")
def test_windows_path_install_retires_only_proven_owned_aliases(tmp_path):
    checkout = tmp_path / "hebri-agent"
    scripts = checkout / "venv/Scripts"
    scripts.mkdir(parents=True)
    destination = tmp_path / "bin"
    destination.mkdir()
    for name in ("hebri", "hebri-agent", "hebri-acp", "hermes", "hermes-agent", "hermes-acp"):
        (scripts / f"{name}.exe").write_bytes(name.encode())
    (destination / "hermes.exe").write_bytes(b"original Hermes, different install")
    (destination / "hermes-agent.exe").write_bytes(b"hermes-agent")
    (destination / "hermes-acp.cmd").write_text(f'@echo off\n"{scripts / "hermes-acp.exe"}" %*')
    harness = tmp_path / "install-launchers.ps1"
    harness.write_text('''param($Installer, $Root, $Destination)
$tokens = $null; $parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($Installer, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw "Installer parse failed" }
$node = $ast.Find({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Install-HermesCommandLaunchers' }, $true)
if (-not $node) { throw "Launcher installer missing" }
Invoke-Expression $node.Extent.Text
Install-HermesCommandLaunchers -Root $Root -Destination $Destination
''', encoding="utf-8")
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-File", str(harness),
                             str(ROOT / "scripts/install.ps1"), str(checkout), str(destination)],
                            capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stdout + result.stderr
    assert (destination / "hermes.exe").read_bytes() == b"original Hermes, different install"
    assert not (destination / "hermes-agent.exe").exists()
    assert not (destination / "hermes-acp.cmd").exists()
    for name in ("hebri", "hebri-agent", "hebri-acp"):
        assert (destination / f"{name}.exe").read_bytes() == name.encode()
