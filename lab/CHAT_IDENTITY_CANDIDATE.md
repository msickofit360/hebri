# Chat identity and strict delegation candidate

Prepared on 6 November 2026 in the isolated Hebri Lab checkout.

## Changes

- Startup waits for remembered navigation to commit before initializing a draft,
  preserving the selected tab. An awaited explicit resume cannot be displaced by
  the old URL, and successful warm/cold resumes publish their destination.
- Hidden canonical Bit chats display their owner's name. Their exact owner route,
  caption scope and last observed display name survive restart, even when the
  Bits sidebar is unmounted. Live roster names override cached labels. Scope
  metadata follows local profile rename/deletion without touching remote owners.
  Canonical chat lookup still resolves the profile's registry by title on every
  Bit click; persisted presentation metadata is not a canonical pointer.
- Delegated tasks may explicitly select `stop_on_tool_error: true`. Their tools
  run sequentially; the first durably recorded tool failure ends the child,
  skips unstarted calls and returns a failed result without a further model turn
  or output-schema correction. Ordinary children retain recovery behavior.
- Terminal validation and timeout errors without an exit code count as failures.
- Failed terminal exits also appear as errors in child traces and output previews;
  strict-child results retain the actual tool failure instead of a missing-response error.

## Evidence and limits

Native quit/reopen checks preserved the selected exercise chat and hidden Bit
caption with both Bits and Team Chat as the startup sidebar. Hebri/Lead/Hebri
switching returned distinct canonical histories. Read-only checks preserved the
earlier A/B result owners, completion rows, delivery attempts and probe markers.

Two-home integration tests cover persona, synthetic secrets, builtin memory,
user notes and same-ID session history in both launch orders. This is profile
scoping, not an operating-system sandbox.

Caption/integration tests passed 124 cases; ownership/Team Chat UI tests passed
92; the final unmounted-roster checks passed 49. Strict-child execution tests
passed 11 and real two-home identity tests passed 2. Counts overlap. TypeScript,
targeted lint and the renderer build passed. Retained logs and source manifests:
`.lab-data/live-test/desktop-remaining-v1/`.

One user-approved cloud message was sent to Synapsek -> General and returned
unchanged under the human author after renderer reload and full restart.
Second-device synchronization is explicitly deferred. Cross-account denial was
not exercised live; local backend authorization tests are separate evidence.

The first live delegated-task qualification failed: the parent claimed the stop
policy was active but omitted its actual boolean argument and replaced the
requested output schema with `{}`. One probe invocation exited 17, but the child
made a second model call and reported `completed`. The runtime was not opted in.
This demonstrates why prose alone cannot guarantee activation. Preserved evidence:
`.lab-data/live-test/strict-child-live-v1/`.

The independent explicit-argument check passed the runtime stopping contract:
the actual task selected `stop_on_tool_error: true`; one child model call and one
terminal invocation ended at exit 17, with a failed result delivered exactly once
to its originating chat. Evidence: `.lab-data/live-test/strict-child-explicit-v1/`.
The parent again replaced the requested output schema with `{}`, so live schema
correction suppression remains unverified. Automated tests cover that path.
The live run preceded the two reporting fixes; the final canonical focused run
passed 13 tests with no failures after those fixes. See
`.lab-data/release-prep/chat-identity-20261106/verification-diagnostics.log`.

## Follow-up contract verification

The model-facing task schema now requires an explicit `stop_on_tool_error`
decision and advertises `output_schema` as JSON text. Existing callers may still
pass schema objects or omit the stop policy (ordinary recovery remains the
legacy default). Local argument handling did not strip the earlier fields;
the representation change improves model compliance without guaranteeing it.

Lab lacked `jsonschema`; its previous fallback could certify parsed JSON without
checking the contract. Requested contracts now fail before child creation when
the validator is unavailable. Validation also returns an explicit failure if
the dependency becomes unavailable later. Lab now has `jsonschema==4.26.0` and
its supporting packages from the lockfile; existing `attrs==26.1.0` and
`typing-extensions==4.16.0` were retained for compatibility. `pip check` passed.

The fresh native `strict-child-contract-v1` check preserved the exact schema and
true stop policy. One child model call, one terminal invocation and exit 17
produced a failed result, an error trace, the actual error text, and
`schema_valid=false` for the missing `outcome`, without a correction retry.
It was delivered once to the correct chat. This supersedes the earlier live
schema-verification gap, but does not prove universal parent compliance.

That completion exposed a formatter omission: stored schema evidence was not
included in the parent notification. Batch, single-child and early-failure
notifications now carry the recorded verdict and errors. The final formatter
was checked by replaying the retained native result without changing history or
making another model call. Its regression suite passed 6 cases; the final
combined run passed 21 with no failures. The separate two-home checks passed 2.
Evidence is in `.lab-data/release-prep/delegation-contract-20261106/` and
`.lab-data/live-test/strict-child-contract-v1/operator/qualification.json`.

## Packaging boundary

This candidate contains the reviewed chat/navigation/caption and strict-child
changes plus their tests. Existing automatic-learning, completion-retention and
other Lab-tooling edits remain in the working tree outside this candidate. No
production installation, profile migration, push or publication is included.
The patch is based on the Lab branch, so applying it to another branch requires
review and validation against that target; the Lab build is not a production
installer. A live parent that omits the opt-in must never be described as having
runtime-enforced stopping.


## Production-base command candidate (2026-11-06)

The isolated `codex/hebri-release-candidate-20261106` branch starts at production
main `f3521b52adcba32d9526ade0d3cdb8b259175b9a` and cherry-picks the two reviewed
chat/contract commits before applying the Hebri command audit. It does not include
the unrelated dirty Lab worktree edits.

Public help, bundled skill instructions, shell completions, profile aliases,
worker launchers, SSH auto-detection and MCP command imports use `hebri`.
Served child environments bridge HEBRI_HOME to the selected internal HERMES_HOME;
real A–B–A child launches verify that the public launcher preserves Bit identity.
Legacy executable recognition remains for durable deliveries and updater locks.
Internal module names, database/protocol keys and existing Bit handles remain
compatible. The Rust bootstrap source is updated, but no Rust toolchain is present
on this host, so its binary is not rebuilt or qualified by this Windows candidate.

Validation includes native Windows remote-discovery scripts against temporary
Hebri/Hermes fixtures, actual CLI help and Bash completion, the chat restoration
suite, Python identity/contract regressions, desktop type checks, lint, and
Python/Bash/PowerShell syntax checks. Packaging evidence is kept outside the
source tree under the Lab release-prep `hebri-command-20261106` directory.
Device-to-device Team Chat is deferred by the user; no publication or production
installation is part of this local candidate.

## Rust and KEEL qualification (2026-11-07)

This supersedes the earlier missing-toolchain note. Rust 1.99.1 and approved MSVC
Build Tools now build the native Tauri bootstrap. All 71 Rust tests pass, including
actual PowerShell child environments and A-to-B-to-A home resolution. The download
source is satoshilove/hebri, the checkout is hebri-agent, and its script cache is
namespaced to prevent reuse of an upstream Hermes script. HEBRI_HOME controls the
owned home; child processes receive matching public/internal home variables.
Existing updater helper filenames and legacy lock recognition remain compatible.

The unsigned 0.21.1 bootstrap candidate is built and its read-only --version check
passes. Its downloadable payload is explicitly pinned to published Hebri 0.17.24
commit f3521b52adcba32d9526ade0d3cdb8b259175b9a, not an unpublished local branch.
This executable therefore does not deliver the new KEEL or desktop changes yet.
No actual installation/upgrade was performed. The executable, locked Cargo inputs,
SHA-256 receipt and build log are outside the source tree in
../keel-evidence-20261107. Re-pin after the reviewed application source is published.

KEEL remains an external plugin repository, with profile-scoped memory and a
longwork CLI/handoff skill. Real host discovery, memory orchestration, session
SQLite databases, credential scope and CLI tests cover profile isolation.
Installation at immutable local commits passes the host scanner. It remains a
private repository; public catalog admission requires a reachable published pin.
Existing Bits are not switched to a new memory provider automatically.

Unknown-owner multiplex log records no longer fall into the launch profile's
normal logs. A fixed diagnostic counts withheld records without copying unscoped
message content or credentials. MCP is pinned to 2.2.0 with a frozen dependency
sync and real stdio client/server round trip. The Skills Hub picker accepts
canonical @owner identifiers while rejecting traversal segments.

The paired portal change lives in ../synapsek-skills-hub-20261107. Deploy its
/docs/api/skills-index.json endpoint before releasing Hebri's new index URL.
Portal and candidate changes are local review branches until explicitly published.
Device-to-device Team Chat remains deferred by the user.
