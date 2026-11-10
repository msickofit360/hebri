# nix/tui.nix — Hermes TUI (Ink/React) compiled with tsc and bundled
{ hermesNpmLib, ... }:
hermesNpmLib.buildNpmPackage {
  dirs = [
    "ui-tui"
    "apps/shared"
    "scripts/synapsek-account-client.ts"
    "apps/desktop/electron/synapsek-account.ts"
    "apps/desktop/electron/synapsek-account-types.ts"
    "apps/desktop/electron/synapsek-inference-bridge.ts"
    "apps/desktop/electron/native-oauth.ts"
    "apps/desktop/electron/native-auth-decisions.ts"
    "apps/desktop/electron/api-transport.ts"
  ];

  doCheck = false;

  buildPhase = ''
    # esbuild bundles everything — no need for tsc or vite.
    # Run from the workspace root where node_modules/ lives.
    node ui-tui/scripts/build.mjs
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/hermes-tui
    # esbuild writes to ui-tui/dist/ from the source root (no cd).
    cp -r ui-tui/dist $out/lib/hermes-tui/dist

    # package.json kept for "type": "module" resolution on `node dist/entry.js`.
    cp ui-tui/package.json $out/lib/hermes-tui/

    runHook postInstall
  '';
}
