"""Profile-scoped operator entry point for the pinned KEEL maintenance tools."""
from pathlib import Path
import subprocess
import sys
import zipfile
from uuid import uuid4


def _backup_before_apply(home):
    from hermes_cli.backup import _write_full_zip_backup
    directory = home / 'backups'
    directory.mkdir(parents=True, exist_ok=True)
    backup = _write_full_zip_backup(directory / f'keel-upgrade-{uuid4().hex}.zip', home)
    if backup is None:
        raise RuntimeError('Backup failed; memory import was not started.')
    required = [p for p in (home / 'config.yaml', home / 'memories/MEMORY.md',
                           home / 'memories/USER.md', home / 'keelindex/entries.sqlite3') if p.is_file()]
    with zipfile.ZipFile(backup) as archive:
        names = set(archive.namelist())
        if archive.testzip() or any(p.relative_to(home).as_posix() not in names for p in required):
            raise RuntimeError('Backup verification failed; memory import was not started.')
        for path in required:
            if path.suffix != '.sqlite3' and archive.read(path.relative_to(home).as_posix()) != path.read_bytes():
                raise RuntimeError('Profile changed during backup; stop its writers and retry.')
    return backup


def keelindex_command(args):
    from hermes_constants import get_hermes_home
    from tools.environments.local import served_profile_child_env
    home = get_hermes_home().resolve()
    plugin = Path(__file__).resolve().parent
    operation = getattr(args, 'keel_command', None) or 'status'
    apply = operation == 'migrate' and getattr(args, 'apply', False)
    if apply and not getattr(args, 'writers_stopped', False):
        raise SystemExit('Stop this profile’s chats and gateway first, then use --apply --writers-stopped. Preview makes no changes.')
    script = 'keel_unify.py' if operation == 'migrate' else 'keel_doctor.py'
    cmd = [sys.executable, '-X', 'utf8', str(plugin / 'maintenance' / script), '--plugin-dir', str(plugin),
           '--profile-root', str(home.parent), '--profile', home.name]
    if getattr(args, 'reconcile_curated', False):
        cmd.append('--reconcile-curated')
    if apply:
        # Reuse the full-profile backup path; never proceed on a failed/partial snapshot.
        try:
            backup = _backup_before_apply(home)
        except (OSError, RuntimeError, zipfile.BadZipFile) as exc:
            raise SystemExit(f'Cannot import KEEL memory: {exc}') from exc
        print(f'Backup verified: {backup}', flush=True)
        cmd.append('--apply')
    result = subprocess.run(cmd, env=served_profile_child_env(target_home=home, inherit_credentials=False),
                            capture_output=True, text=True, encoding='utf-8',
                            **({'creationflags': subprocess.CREATE_NO_WINDOW} if sys.platform == 'win32' else {}))
    # Hidden Windows children do not reliably inherit console/redirected handles.
    # Relay the read-only plan and doctor report explicitly so review is possible.
    sys.stdout.write(result.stdout)
    sys.stderr.write(result.stderr)
    if result.returncode:
        raise SystemExit(result.returncode)


def register_cli(subparser):
    sub = subparser.add_subparsers(dest='keel_command')
    sub.add_parser('status', help='Inspect this profile’s KEEL store without changing it')
    migration = sub.add_parser('migrate', help='Preview importing current memory blocks into KEEL')
    migration.add_argument('--apply', action='store_true', help='Back up this profile, then apply the import')
    migration.add_argument('--writers-stopped', action='store_true', help='Confirm this profile’s chats and gateway are stopped')
    migration.add_argument('--reconcile-curated', action='store_true', help='Retire stale mirrors of present curated blocks')
    subparser.set_defaults(func=keelindex_command)
