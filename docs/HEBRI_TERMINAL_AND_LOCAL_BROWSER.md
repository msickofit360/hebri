# Hebri in the terminal and local browser

The local browser is part of the installed Hebri runtime. Start it with
`hebri dashboard`; it uses that installation's backend, tools, configuration,
Bits and local sessions. It does not require the Desktop app or a hosted chat
service. Its displayed product version comes from the installed release manifest;
the separately maintained Python engine version remains available for compatibility.

## Independent Synapsek sign-in

```sh
hebri auth synapsek login
hebri auth synapsek status
hebri --tui
hebri dashboard
hebri auth synapsek logout
```

The login command opens the existing Synapsek browser consent flow. Complete both
the account and device-binding consent steps if prompted. `--no-browser` prints
the links instead of opening them. The browser must be able to return to the
terminal machine's loopback callback; this is not an SSH device-code flow.

In the local browser, open **Models → Synapsek account** to sign in, refresh
status or sign out. Terminal and browser share the account of the selected Bit.
Use `hebri --profile NAME auth synapsek login` for a specific Bit. Other Bits do
not inherit its account or credentials. Desktop keeps its existing separate
account store; it does not need to be running.

When the account has managed inference enabled, successful login selects
`synapsek-auto` for new chats. Use `hebri model` or the browser's model settings
to change models. Existing chats retain their session choices. Signing in alone
does not grant a paid plan or bypass server eligibility, consent or budget checks.
Purchases and plan management continue through the existing Synapsek billing page.

`hebri auth add synapsek`, `hebri auth status synapsek`, and
`hebri auth logout synapsek` use the same secure account flow. Synapsek account
credentials are not entries in the generic API-key pool.

## Credential protection and installation requirements

- Windows uses Credential Manager; macOS uses Keychain.
- Linux requires an available, unlocked Secret Service keyring and its session
  D-Bus service. Headless Linux without that service is not supported by this
  account store. There is no plaintext fallback.
- Each Bit has its own encryption key in the OS store and encrypted account file
  in its local home. Cross-process locking protects refresh-token rotation.
- The terminal uses a small Node helper built from the same account controller
  as Desktop, without importing or launching Electron. Source installations build
  it with the TUI; packaged installations must ship `account-client.js` alongside
  the TUI entry. An older package missing that helper needs an update.
- Inference uses a temporary authenticated loopback bridge. OAuth credentials
  stay out of model settings, browser storage and agent configuration. A running
  bridge stays bound to its first account; restart the chat/runtime after switching
  accounts so old sessions cannot silently spend the new account's balance.
- Browser account actions require the local dashboard session token and loopback
  access. They are disabled on remotely exposed dashboard instances.
- Logout verifies server revocation before clearing the saved session. If
  revocation fails, retry; a failed revoke is not reported as successful sign-out.

## Candidate verification and remaining release gates

This implementation is a local candidate, not a released feature. Windows testing
covered the native keychain, terminal query, ConPTY browser chat, stored-session
resume after restart, account isolation, model selection and bridge security.
The shared account controller's existing protocol tests also pass.

Production login succeeded with a native-enabled account after browser MFA
verification. A fresh terminal process restored the OS-encrypted session, and
the local browser displayed the same account and plan. The optional shared-credit
and collaboration permissions were left unchecked for this account-only test.
Model access was correctly denied without that consent. Browser sign-out completed
server revocation, cleared the encrypted session file, and a fresh terminal status
command confirmed the signed-out state.
The existing approved-account restriction remains intact.
Paid inference has not been exercised by these local tests. macOS Keychain,
Linux Secret Service, Nix packaging and cross-platform release CI still require
qualification before publication.
