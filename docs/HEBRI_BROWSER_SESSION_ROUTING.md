# Hebri browser session routing

## Report and cause

Reproduced in installed Desktop 0.17.28 on Windows: a new session tab could see
the browser on screen, but `desktop_preview(action="tabs")` returned an empty
list. Reading returned `Background browser access requires an explicit tab_id`;
`drive_preview` reported that the chat had no access.

The primary route's session and the focused chat are different identities.
New session tabs and canonical Bit chats are session tiles. Browser permission
checks, the rail profile, and the route check for `desktop_preview(action="open")` still used the
primary session. The visible tile was therefore classified as background work,
and sharing a page could select the primary profile instead of the Bit's profile.
Clicking browser chrome also discarded the focused chat context.

Two additional failures were reproduced during qualification:

- With progressive tool discovery enabled, `agent.tools` contains `tool_call`
  instead of the concrete browser schemas. The Codex app-server bridge inspected
  only direct schemas and consequently advertised no embedded-browser tools.
  It now resolves those two schemas within the owning agent's permitted toolsets
  at thread creation, and rechecks permissions when invoked. The cached agent
  tool list remains unchanged; disabled tools and missing callbacks stay denied.
- A real link click could finish navigation before the read-back. The new
  document no longer held the old pointer witness, causing a false “nothing was
  clicked” error. An action-specific document marker now distinguishes this from
  input that genuinely failed to reach an unchanged page.

## Fix contract

- The focused runtime session determines foreground browser access and the
  profile used by **Let Hebri manage the page**.
- Browser and sidebar keyboard focus retain the last visible chat
  context. Switching chats changes that context; closing the chat does not leave
  a dangling session reference.
- Clearing pane focus or selecting another application page retains normal
  sidebar navigation behavior; it does not revive the last focused chat.
- Opening a preview compares the source route against the focused chat's route.
  Profile names alone never authorize a different remote connection.
- Reads and actions use the same foreground decision. Asynchronous work still
  rechecks its owner, tab object, profile epoch, interruption and grant state.
- Background/delegated work still needs human consent, an exact tab ID and an
  unexpired origin-bound grant. Switching profiles, closing a tab, changing its
  ownership or origin, or revoking access invalidates the existing grant.

## User flow

Open the chat or Bit that should work with the page. Open a browser tab or ask
that chat to open it. If the page belongs to a different Bit, use **Let Hebri
manage the page** to hand it to the current chat's profile. The agent can then
read and interact with the visible page using `desktop_preview` and
`drive_preview`. If tools are deferred, normal API-backed agents discover them
with `tool_describe` and invoke them with `tool_call`; Codex-backed chats receive
the session-bound browser tools directly. Background access remains a separate
approval. Start a new chat after updating: existing Codex threads retain their
stored tool definitions rather than replacing tools mid-conversation.

The embedded browser is separate from the standalone `browser_exec` backend.
The latter does not inherit an embedded tab merely because it is open in Hebri.
The default Browser Use backend intentionally replaces the older `browser_*`
tools, so their availability checks returning false is not by itself a launch
failure.

## Validation

`preview-access.test.ts` exercises the real session, layout, sharing and request
stores with a focused tile and a parked primary from another profile. It covers
read/action dispatch, browser-chrome focus and denial after switching away.
The new regression failed before the fix because the rail retained the primary
profile. It verifies denial before human sharing and an A→B→A profile switch
without reviving stale requests. Existing consent, delegated-access, expiry and
stale-work tests remain.

`preview-open.test.tsx` checks a focused Bit's open request against a parked
primary and a same-name profile on another connection.

`e2e/browser-focused-chat.spec.ts` runs a separate Electron instance, real Python
gateway and real Chromium guest against temporary homes, a local test website
and a deterministic inference fixture. It checks that the browser tools are
advertised or discoverable, opening and reading a page, element discovery, typing, trusted click
delivery, navigation and back. It uses no customer accounts or installed profiles.

Windows live qualification on 2026-11-12: the isolated Electron/Python/Chromium
sequence passed with a selected session tile. The local page recorded
`event.isTrusted === true` on the submitted click and the tool read back the
changed content. The link-navigation failure was reproduced before its fix.
`tests/agent/test_codex_browser_tools.py` also reproduced the missing deferred
Codex browser tools before its fix, then passed with session-scoped callbacks,
disabled-tool rejection, security hooks and unchanged tool-schema bytes.

Re-run the integration spec from `apps/desktop` after building the renderer and
development Electron bundle. Set `HERMES_DESKTOP_PYTHON` to a development Python
environment with the repository dependencies, then run
`npx playwright test e2e/browser-focused-chat.spec.ts --workers=1`.
The fixture uses manual approval mode, declines browser-profile import, and
attaches the tool receipts and a screenshot. The model response is scripted;
this is an execution-path test, not an evaluation of every model's planning.

These checks do not claim that every external website, login flow or standalone
browser backend has been qualified.

## PR CI follow-up

The first full renderer CI run found two failures after 8,587 passing tests.
The no-page history test still expected the retired `open_preview` tool name;
its assertion now checks failure and the current `desktop_preview` guidance.
The sidebar integration test exposed an overbroad focus fallback: clearing
focus retained the last chat instead of restoring route navigation. The fallback
now applies only to browser panes and the sidebar, preserving the existing
navigation assertion. Both failures were reproduced locally before correction.

Follow-up validation: all 1,034 renderer test files passed locally (8,588 tests
passed, one platform-conditional skip), including the unchanged sidebar
integration assertions. Renderer type-checking and focused lint passed. The
rebuilt Electron/Python/Chromium browser sequence passed again with manual
approval mode enabled.
