"""Native Linux launcher management through real config and filesystem I/O."""
from pathlib import Path

import pytest

from hermes_cli import linux_desktop_entry


@pytest.mark.linux_only
def test_launcher_optout_preserves_custom_entry_but_creates_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(linux_desktop_entry, "is_supported", lambda: True)
    home = tmp_path / "home"
    home.mkdir()
    monkeypatch.setenv("HOME", str(home))
    monkeypatch.setenv("HERMES_HOME", str(home))
    monkeypatch.setenv("XDG_DATA_HOME", str(tmp_path / "xdg"))
    monkeypatch.setenv("PATH", "/usr/bin:/bin")
    monkeypatch.setattr(Path, "home", lambda: home)
    config = home / "config.yaml"
    config.write_text("desktop:\n  manage_launcher_entry: false\n", encoding="utf-8")
    root = tmp_path / "checkout"
    root.mkdir()
    entry = tmp_path / "xdg/applications/hebri.desktop"
    entry.parent.mkdir(parents=True)
    custom = b"[Desktop Entry]\nType=Application\nName=Custom Hebri\nExec=/opt/custom-hebri desktop\n"
    for setting in ("false", '"false"'):
        config.write_text(f"desktop:\n  manage_launcher_entry: {setting}\n", encoding="utf-8")
        entry.write_bytes(custom)
        assert linux_desktop_entry.install_desktop_entry(root) == entry
        assert entry.read_bytes() == custom
    entry.unlink()
    assert linux_desktop_entry.install_desktop_entry(root) == entry
    assert "Name=Hebri" in entry.read_text(encoding="utf-8").splitlines()
    config.write_text("desktop: {}\n", encoding="utf-8")
    entry.write_bytes(custom)
    assert linux_desktop_entry.install_desktop_entry(root) == entry
    assert entry.read_bytes() != custom
