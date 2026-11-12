"""Native-platform migration, backup and first-run behavior; disposable profiles only."""
import argparse
from pathlib import Path
import sqlite3
import subprocess
import sys
import zipfile

import pytest
import yaml

from hermes_constants import set_hermes_home_override, reset_hermes_home_override
from plugins.memory.keelindex import IndexedStore
from plugins.memory.keelindex.cli import keelindex_command as keel_command, _backup_before_apply
from hermes_cli.memory_setup import seed_fresh_memory


def snapshot(home):
    return {p.relative_to(home).as_posix(): p.read_bytes() for p in home.rglob('*') if p.is_file()}


def test_preview_apply_backup_and_repeated_import_are_profile_scoped(tmp_path, monkeypatch):
    # Default homes are hidden; named Bits may contain spaces and Unicode.
    home, other = tmp_path / '.hebri', tmp_path / 'Other Bit'
    for path in (home, other):
        (path / 'memories').mkdir(parents=True)
        (path / 'config.yaml').write_text('memory: {provider: keelindex}\n', encoding='utf-8')
        (path / 'memories/MEMORY.md').write_text('Launch colour is violet', encoding='utf-8')
    monkeypatch.setenv('HERMES_HOME', str(other))
    monkeypatch.setenv('HEBRI_HOME', str(other))
    monkeypatch.setattr(Path, 'home', lambda: tmp_path)
    token = set_hermes_home_override(home)
    args = argparse.Namespace(keel_command='migrate', apply=False, writers_stopped=False)
    before, other_before = snapshot(home), snapshot(other)
    try:
        keel_command(args)
        assert snapshot(home) == before  # Maintenance itself performs no profile writes.
        from tools.environments.local import served_profile_child_env
        preview = subprocess.run([sys.executable, '-m', 'hermes_cli.hebri', 'keelindex', 'migrate'],
                                 env=served_profile_child_env(target_home=home, inherit_credentials=False),
                                 capture_output=True, text=True, encoding='utf-8', timeout=60,
                                 **({'creationflags': subprocess.CREATE_NO_WINDOW} if sys.platform == 'win32' else {}))
        assert preview.returncode == 0, preview.stdout + preview.stderr
        assert 'DRY RUN' in preview.stdout
        # The public CLI also performs its normal first-launch identity/log setup.
        # It must not change any existing file or create/import the KEEL store.
        after_cli = snapshot(home)
        assert all(after_cli[name] == data for name, data in before.items())
        assert not (home / 'keelindex').exists()
        before = after_cli
        args.apply = True
        with pytest.raises(SystemExit, match='writers-stopped'):
            keel_command(args)
        assert snapshot(home) == before
        args.writers_stopped = True
        keel_command(args)
        with zipfile.ZipFile(next((home / 'backups').glob('*.zip'))) as backup:
            assert backup.read('memories/MEMORY.md') == before['memories/MEMORY.md']
        first = IndexedStore(home / 'keelindex', read_only=True).entries()
        assert [r['body'] for r in first] == ['Launch colour is violet']
        keel_command(args)
        assert IndexedStore(home / 'keelindex', read_only=True).entries() == first
        assert len(list((home / 'backups').glob('*.zip'))) == 2
        assert snapshot(other) == other_before
    finally:
        reset_hermes_home_override(token)


def test_backup_snapshots_sqlite3_wal_and_aborts_on_failure(tmp_path, monkeypatch):
    from hermes_cli import backup
    home = tmp_path / 'profile'
    (home / 'keelindex').mkdir(parents=True)
    (home / 'config.yaml').write_text('{}', encoding='utf-8')
    database = home / 'keelindex/entries.sqlite3'
    with sqlite3.connect(database) as connection:
        connection.execute('PRAGMA journal_mode=WAL')
        connection.execute('CREATE TABLE facts(body TEXT)')
        connection.execute("INSERT INTO facts VALUES ('committed in WAL')")
        connection.commit()
        assert database.with_name(database.name + '-wal').stat().st_size > 0
        archive_path = _backup_before_apply(home)
        with zipfile.ZipFile(archive_path) as archive:
            assert not any(n.endswith(('-wal', '-shm')) for n in archive.namelist())
            restored = tmp_path / 'restored.sqlite3'
            restored.write_bytes(archive.read('keelindex/entries.sqlite3'))
        with sqlite3.connect(restored) as restored_connection:
            assert restored_connection.execute('SELECT body FROM facts').fetchall() == [('committed in WAL',)]
    monkeypatch.setattr(backup, '_safe_copy_db', lambda *args: False)
    with pytest.raises(RuntimeError, match='Backup failed'):
        _backup_before_apply(home)


@pytest.mark.parametrize('clone_all', [False, True])
def test_cloned_keel_has_committed_wal_and_independent_storage(tmp_path, clone_all):
    from hermes_cli.profile_memory_config import clone_memory_provider_config
    from hermes_cli.profiles import _clone_all_into
    source, clone = tmp_path / 'source', tmp_path / 'clone'
    (source / 'keelindex').mkdir(parents=True)
    if not clone_all:
        clone.mkdir()
    with sqlite3.connect(source / 'keelindex/entries.sqlite3') as db:
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('CREATE TABLE facts(body TEXT)')
        db.execute("INSERT INTO facts VALUES ('original')")
        db.commit()
        if clone_all:
            _clone_all_into(source, clone, 'clone')
        else:
            clone_memory_provider_config(source, clone, 'keelindex')
        assert not (clone / 'keelindex/entries.sqlite3-wal').exists()
        with sqlite3.connect(clone / 'keelindex/entries.sqlite3') as independent:
            assert independent.execute('SELECT body FROM facts').fetchall() == [('original',)]
            independent.execute("UPDATE facts SET body='clone only'")
        assert db.execute('SELECT body FROM facts').fetchall() == [('original',)]


def test_new_setup_opts_in_but_existing_profile_and_provider_are_preserved(tmp_path):
    fresh = {'memory': {'provider': ''}}
    assert seed_fresh_memory(fresh, tmp_path / 'fresh')
    assert fresh['memory']['provider'] == 'keelindex'
    existing = tmp_path / 'existing'
    (existing / 'memories').mkdir(parents=True)
    (existing / 'memories/USER.md').write_text('Keep me', encoding='utf-8')
    config = {'memory': {'provider': ''}}
    assert not seed_fresh_memory(config, existing)
    assert config == {'memory': {'provider': ''}}
    selected = {'memory': {'provider': 'other'}}
    assert not seed_fresh_memory(selected, tmp_path / 'fresh')
    assert selected['memory']['provider'] == 'other'


def test_fresh_bit_default_and_clone_preserves_provider(tmp_path, monkeypatch):
    from hermes_cli.profiles import _bootstrap_profile_dir
    source, fresh, clone = [tmp_path / n for n in ('source', 'fresh', 'clone')]
    source.mkdir()
    (source / 'config.yaml').write_text('memory: {provider: ""}\nmodel: {default: fixture-model}', encoding='utf-8')
    monkeypatch.setenv('HERMES_HOME', str(source))
    monkeypatch.setenv('HEBRI_HOME', str(source))
    token = set_hermes_home_override(source)
    try:
        _bootstrap_profile_dir(fresh, None)
        _bootstrap_profile_dir(clone, source)
        assert yaml.safe_load((fresh / 'config.yaml').read_text(encoding='utf-8'))['memory']['provider'] == 'keelindex'
        assert yaml.safe_load((clone / 'config.yaml').read_text(encoding='utf-8'))['memory']['provider'] == ''
        assert yaml.safe_load((source / 'config.yaml').read_text(encoding='utf-8'))['memory']['provider'] == ''
    finally:
        reset_hermes_home_override(token)


@pytest.mark.parametrize('name', ['../outside', 'x/../../outside', '..\\outside', '/outside', 'C:\\outside'])
def test_profile_path_cannot_escape_configured_root(name):
    from hermes_cli.profiles import get_profile_dir
    with pytest.raises(ValueError):
        get_profile_dir(name)


def test_clone_refuses_keel_symlink_outside_profile(tmp_path):
    from hermes_cli.profile_memory_config import snapshot_cloned_keel
    source, clone, outside = [tmp_path / n for n in ('source', 'clone', 'outside')]
    for folder in (source, clone, outside):
        folder.mkdir()
    (outside / 'entries.sqlite3').write_bytes(b'outside profile; must remain untouched')
    try:
        (source / 'keelindex').symlink_to(outside, target_is_directory=True)
    except OSError:
        pytest.skip('Creating a symlink requires OS permission on this host')
    with pytest.raises(ValueError):
        snapshot_cloned_keel(source, clone)
    assert not (clone / 'keelindex').exists()
    assert (outside / 'entries.sqlite3').read_bytes() == b'outside profile; must remain untouched'
