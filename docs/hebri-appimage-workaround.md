# Hebri AppImage: persistent extraction workaround

For the suspected Crashpad/AppImage shutdown race in [#34](https://github.com/satoshilove/hebri/issues/34),
an opt-in workaround is to run Hebri from persistent extracted files. This avoids
relying on a temporary mount for the executable backing files. It is **not a
verified root-cause fix** and does not change normal installation or startup.

## Install

Use a trusted AppImage and an existing shell launcher containing a standalone
`exec /absolute/path/to/Hebri.AppImage "$@"` (the executable path may be quoted).
Other launcher environment settings are preserved. Python 3, `sh`, and `bash`
are required. Run as the user who owns the installation, without `sudo`.

```sh
python3 scripts/hebri_appimage_workaround.py install \
  /absolute/path/to/Hebri.AppImage \
  /absolute/path/to/hebri-desktop \
  /absolute/path/to/hebri-persistent-version
```

Replace all three paths with your installation paths. The destination must be
new. The script refuses to overwrite an existing backup or installation and
rejects launcher layouts it cannot safely recognize. It saves the original
launcher alongside it as `.before-crashpad-workaround` and records the installed
launcher as `.crashpad-workaround-installed`.

The replacement clears inherited `APPIMAGE` and `APPDIR` values and executes the
persistent `AppRun`, forwarding arguments. Existing application data is not
modified, and running sessions are not restarted.

## Verify

Save your work, quit Hebri normally, and reopen through the usual launcher.
Check that the executable path uses the persistent directory. Quit normally and
check for new `chrome_crashpad_handler` crashes:

```sh
coredumpctl list --since '10 minutes ago' --no-pager
```

Repeat normal launch/exit cycles before claiming the suspected race is fixed.
Installer tests cover extraction, argument/environment preservation, overwrite
protection, and rollback with a fixture executable. They do not prove real
AppImage startup, crash prevention, or updater compatibility.

## Roll back

```sh
python3 scripts/hebri_appimage_workaround.py rollback /absolute/path/to/hebri-desktop
```

Rollback restores the original launcher but refuses to overwrite later edits.
It retains backups, the installation receipt, and extracted files. Do not remove
an extracted directory while any application or helper process uses it. If the
launcher has subsequently changed, review and restore the backup manually.

## Updates and limitations

The extracted copy is pinned to a release: updating the original AppImage does
not refresh it. AppImage auto-update and relaunch integration are unverified in
this layout. For a new release, restore the original launcher, retain old
directories while processes use them, archive the backup/receipt, and install
the new trusted release into a new directory. Review the launcher before every
change. This workaround is not a permanent updater design.
