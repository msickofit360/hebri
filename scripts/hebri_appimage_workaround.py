#!/usr/bin/env python3
"""Install or roll back a persistent-extraction workaround for Hebri AppImage."""
import argparse
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tempfile


def replace_atomically(path, data, mode):
    fd, name = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
        os.chmod(name, mode)
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def replacement(original, image, destination):
    # Deliberately accept only a standalone exec of this exact AppImage.
    matches = []
    lines = original.splitlines(keepends=True)
    for index, line in enumerate(lines):
        if not line.lstrip().startswith('exec '):
            continue
        try:
            words = shlex.split(line)
        except ValueError:
            continue
        if words == ['exec', str(image), '$@'] and line.rstrip().endswith('"$@"'):
            matches.append(index)
    if len(matches) != 1:
        raise ValueError('Expected exactly one standalone exec of the supplied AppImage with "$@"; launcher left unchanged.')
    lines[matches[0]] = (
        '# Persistent files avoid AppImage teardown while Crashpad is still running.\n'
        'unset APPIMAGE APPDIR\n'
        f'exec {shlex.quote(str(destination / "AppRun"))} "$@"\n'
    )
    return ''.join(lines)


def install(image, launcher, destination):
    backup = launcher.with_name(launcher.name + '.before-crashpad-workaround')
    receipt = launcher.with_name(launcher.name + '.crashpad-workaround-installed')
    if destination.exists() or backup.exists() or receipt.exists():
        raise ValueError('Installation directory or backup already exists. Refusing to overwrite it.')
    original = launcher.read_bytes()
    updated = replacement(original.decode(), image, destination).encode()
    subprocess.run(['sh', '-n'], input=updated, check=True)
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Stage on the target filesystem so publication is atomic.
    with tempfile.TemporaryDirectory(prefix='.hebri-extract-', dir=destination.parent) as stage:
        log = Path(stage) / 'extract.log'
        with log.open('wb') as output:
            result = subprocess.run([str(image), '--appimage-extract'], cwd=stage,
                                    stdout=output, stderr=subprocess.STDOUT)
        if result.returncode:
            raise ValueError('AppImage extraction failed; launcher left unchanged.')
        root = Path(stage) / 'squashfs-root'
        for name in ('AppRun', 'Hebri', 'chrome_crashpad_handler'):
            if not (root / name).is_file() or not os.access(root / name, os.X_OK):
                raise ValueError(f'Extracted executable is missing: {name}')
        subprocess.run(['bash', '-n', str(root / 'AppRun')], check=True)
        if launcher.read_bytes() != original:
            raise ValueError('Launcher changed during extraction; refusing to overwrite it.')
        mode = launcher.stat().st_mode & 0o777
        with backup.open('xb') as stream:
            stream.write(original)
        os.chmod(backup, mode)
        with receipt.open('xb') as stream:
            stream.write(updated)
        root.rename(destination)
        replace_atomically(launcher, updated, mode)
    print(f'Installed. Future launches use {destination / "AppRun"}')
    print(f'Original launcher saved at {backup}')
    print('Running sessions were not restarted. Crash prevention still requires a launch/exit check.')


def rollback(launcher):
    backup = launcher.with_name(launcher.name + '.before-crashpad-workaround')
    receipt = launcher.with_name(launcher.name + '.crashpad-workaround-installed')
    if not receipt.exists():
        raise ValueError('No receipt from this script. Restore the existing backup manually after reviewing the launcher.')
    if launcher.read_bytes() != receipt.read_bytes():
        raise ValueError('Launcher has changed since installation; refusing to overwrite later edits.')
    subprocess.run(['sh', '-n', str(backup)], check=True)
    replace_atomically(launcher, backup.read_bytes(), backup.stat().st_mode & 0o777)
    print('Original launcher restored. Backup, receipt, and extracted files retained.')
    print('Do not delete extracted files while any application/helper process uses them.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    setup = commands.add_parser('install', help='Use only with a trusted AppImage')
    setup.add_argument('image', type=Path)
    setup.add_argument('launcher', type=Path)
    setup.add_argument('destination', type=Path)
    undo = commands.add_parser('rollback')
    undo.add_argument('launcher', type=Path)
    args = parser.parse_args()
    launcher = args.launcher.expanduser().absolute()
    if launcher.is_symlink():
        parser.error('Use the actual launcher file, not a symlink.')
    try:
        if args.command == 'install':
            install(args.image.expanduser().resolve(strict=True), launcher,
                    args.destination.expanduser().absolute())
        else:
            rollback(launcher)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Error: {error}\n')


if __name__ == '__main__':
    main()
