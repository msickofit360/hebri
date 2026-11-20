"""Full backup and import must preserve SQLite rows under URI-sensitive paths."""

import argparse
import sqlite3
import sys
from contextlib import closing

import pytest

from hermes_cli import backup
from hermes_constants import reset_hermes_home_override, set_hermes_home_override
from hermes_state_holders import read_only_db_uri


@pytest.mark.parametrize(
    ("source_name", "target_name"),
    [("source#1", "target"), ("source", "target#2")],
)
def test_backup_import_preserves_rows(tmp_path, monkeypatch, source_name, target_name):
    source = tmp_path / source_name
    target = tmp_path / target_name
    for home, value in ((source, "archived"), (target, "outdated")):
        home.mkdir()
        with closing(sqlite3.connect(home / "state.db")) as db:
            db.execute("CREATE TABLE records (value TEXT)")
            db.execute("INSERT INTO records VALUES (?)", (value,))
            db.commit()

    monkeypatch.setenv("HERMES_HOME", str(source))
    monkeypatch.setenv("HEBRI_HOME", str(source))
    monkeypatch.setattr(backup, "_revive_gateway_after_import", lambda home: None)
    archive = tmp_path / "backup.zip"
    token = set_hermes_home_override(source)
    try:
        assert backup.run_backup(argparse.Namespace(output=str(archive)))
    finally:
        reset_hermes_home_override(token)

    token = set_hermes_home_override(target)
    try:
        backup.run_import(argparse.Namespace(zipfile=str(archive), force=True))
    finally:
        reset_hermes_home_override(token)

    with closing(sqlite3.connect(target / "state.db")) as restored:
        assert restored.execute("SELECT value FROM records").fetchall() == [("archived",)]


@pytest.mark.windows_only
@pytest.mark.skipif(sys.platform != "win32", reason="UNC filenames use Windows path semantics")
def test_unc_uri_preserves_native_sqlite_filename():
    native = r"\\share.invalid\backups\state.db"
    uri, separator, options = read_only_db_uri(native).partition("?")
    assert separator and options == "mode=ro"
    # Two connections to a named in-memory database let SQLite compare the
    # native and encoded filenames without opening a file or contacting a share.
    memory_options = "?mode=memory&cache=shared"
    with closing(sqlite3.connect("file:" + native + memory_options, uri=True)) as original:
        original.execute("CREATE TABLE records (value TEXT)")
        original.execute("INSERT INTO records VALUES ('archived')")
        original.commit()
        with closing(sqlite3.connect(uri + memory_options, uri=True)) as encoded:
            assert encoded.execute("SELECT value FROM records").fetchall() == [("archived",)]
