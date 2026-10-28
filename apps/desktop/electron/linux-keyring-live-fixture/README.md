# Linux keyring startup rehearsal

This fixture exercises the real Electron safeStorage API and the Synapsek
sign-in rejection path. Use a disposable HOME/userData directory and a private
`dbus-run-session`, with an unlocked test Secret Service keyring. Never point it
at a personal keyring. No real account or provider calls are needed.

Bundle from `apps/desktop`:

```sh
npx esbuild electron/linux-keyring-live-fixture/main.ts --bundle --platform=node \
  --format=cjs --external:electron --outfile=/tmp/hebri-keyring-fixture.cjs
```

Within the isolated session set `XDG_CURRENT_DESKTOP=Hyprland`, unset
`HERMES_DESKTOP_PASSWORD_STORE` and `GNOME_KEYRING_CONTROL`, and run the bundle
with the project's Linux Electron binary:

```sh
electron /tmp/hebri-keyring-fixture.cjs /absolute/disposable/baseline baseline
electron /tmp/hebri-keyring-fixture.cjs /absolute/disposable/fixed fixed
electron /tmp/hebri-keyring-fixture.cjs /absolute/disposable/fixed fixed
electron /tmp/hebri-keyring-fixture.cjs /absolute/disposable/basic basic
```

The baseline reproduces the unrecognized-desktop backend without the new
resolver. Fixed must select `gnome_libsecret`, encrypt a synthetic string, and
decrypt it after a second process starts. Basic must still deny Synapsek sign-in
before any network request or token-file write. Each invocation has a 30-second
deadline. A healthy Secret Service is still required; this fix does not install
or unlock a user's keyring, migrate credentials, or enable plaintext fallback.

Verified on 2026-10-25 using the published Hebri 0.17.19 Linux x86_64
Electron runtime, Ubuntu under WSL, an isolated D-Bus session, and a disposable
GNOME Keyring 46.1. The four runs returned:

```json
{"mode":"baseline","backend":"basic_text","available":false,"passed":true}
{"mode":"fixed","backend":"gnome_libsecret","available":true,"passed":true}
{"mode":"fixed","backend":"gnome_libsecret","available":true,"passed":true}
{"mode":"basic","backend":"basic_text","available":false,"passed":true}
```

This verifies real Linux encryption and the rejection path with Hyprland session
metadata; it does not replace a packaged-app test on an actual Omarchy desktop.
