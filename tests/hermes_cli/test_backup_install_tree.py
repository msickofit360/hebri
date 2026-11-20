"""A profile archive carries user files across installations."""
from argparse import Namespace
from pathlib import Path
from zipfile import ZipFile

import pytest

from hermes_cli import backup


@pytest.fixture
def profile_home(tmp_path, monkeypatch):
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setattr(backup, "_revive_gateway_after_import", lambda home: None)

    def activate(name):
        home = tmp_path / name
        home.mkdir()
        monkeypatch.setenv("HEBRI_HOME", str(home))
        monkeypatch.setenv("HERMES_HOME", str(home))
        return home

    return activate


def test_backup_roundtrip_preserves_installation_and_restores_user_files(tmp_path, profile_home):
    source = profile_home("source")
    (source / "config.yaml").write_text("memory: {provider: ''}\n", encoding="utf-8")
    for name in ("hebri-agent", "hermes-agent"):
        (source / name).mkdir()
        (source / name / "app.py").write_bytes(b"old installation")
        skill = source / "skills" / name
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_bytes(b"user skill")

    archive = tmp_path / "profile.zip"
    assert backup.run_backup(Namespace(output=str(archive)))
    with ZipFile(archive) as zf:
        for name in ("hebri-agent", "hermes-agent"):
            assert f"{name}/app.py" not in zf.namelist()
            assert zf.read(f"skills/{name}/SKILL.md") == b"user skill"

    target = profile_home("target")
    (target / "hebri-agent").mkdir()
    app = target / "hebri-agent" / "app.py"
    app.write_bytes(b"new installation")
    backup.run_import(Namespace(zipfile=str(archive), force=True))
    assert app.read_bytes() == b"new installation"
    for name in ("hebri-agent", "hermes-agent"):
        assert (target / "skills" / name / "SKILL.md").read_bytes() == b"user skill"


@pytest.mark.parametrize("prefix", ["", ".hermes/"])
def test_import_skips_installation_files_in_existing_archives(tmp_path, profile_home, prefix):
    target = profile_home("target")
    archive = tmp_path / "older.zip"
    with ZipFile(archive, "w") as zf:
        zf.writestr(f"{prefix}config.yaml", "memory: {provider: ''}\n")
        for name in ("hebri-agent", "hermes-agent"):
            (target / name).mkdir()
            (target / name / "app.py").write_bytes(b"installed")
            zf.writestr(f"{prefix}{name}/app.py", b"obsolete")
            zf.writestr(f"{prefix}{name}/removed.py", b"obsolete")
            zf.writestr(f"{prefix}skills/{name}/SKILL.md", b"user skill")

    backup.run_import(Namespace(zipfile=str(archive), force=True))
    for name in ("hebri-agent", "hermes-agent"):
        assert (target / name / "app.py").read_bytes() == b"installed"
        assert not (target / name / "removed.py").exists()
        assert (target / "skills" / name / "SKILL.md").read_bytes() == b"user skill"
