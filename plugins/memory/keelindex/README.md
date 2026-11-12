# KEEL memory in Hebri

Hebri bundles Synapsek KEEL 0.6.1 from commit
`b6d5faff00470b264becedfb4c33c331c9f57d38`. No GitHub credentials,
separate service, model download or extra API key are needed for local recall.
The pinned source, license and file hashes are recorded in `UPSTREAM.json`.

## New and existing profiles

New installations and fresh Bits select `memory.provider: keelindex`.
An existing configuration retains its provider, including built-in-only memory.
Clones retain the source configuration. Installing this version does not import
or rewrite an existing profile's memories.

To opt an existing profile in, use **Advanced → Settings → Memory & Context**
and choose `keelindex`, or run:

```sh
hebri memory setup keelindex
```

Start a new session after changing providers. In-progress sessions keep their
original prompt and provider. Bundled code takes precedence over an older
user-installed plugin with the same name: profiles already using `keelindex`
will use this reviewed version on their next start.

## Import existing curated memory

Stop chats and gateways using the selected profile, then preview:

```sh
hebri keelindex migrate
```

Preview does not change memory or provider settings (normal CLI startup may
create identity/log metadata). It lists additions from the current `memories/MEMORY.md`
and `memories/USER.md`. It never replays historical journals, which can contain
deleted facts without a deletion record. Review its output, then explicitly apply:

```sh
hebri keelindex migrate --apply --writers-stopped
hebri keelindex status
```

Apply first creates and verifies a full ZIP backup under that profile's
`backups/keel-upgrade-<unique-id>.zip`. SQLite snapshots include committed WAL
changes. A failed backup stops import. Backups contain private profile data;
keep them private. Repeating the import does not duplicate the same facts.

For a named Bit, put `-p NAME` before the command, for example
`hebri -p research keelindex migrate`. Only that selected home is imported.
`--writers-stopped` acknowledges that you stopped its writers; it is not an
automatic process stop or an exclusive lock against other agents.

If an older KEEL installation has stale curated mirrors, first preview with
`--reconcile-curated`, then use the same option on apply. Reconciliation retires
only recognized mirrors absent from a currently present curated block. Direct
KEEL facts, absent files and ambiguous legacy journal imports require separate
review. Oversized entries must be split before import; the tool refuses the
whole plan instead of silently losing them.

`hebri memory off` returns to built-in-only memory without deleting KEEL data.
Restore a migration backup only with profile writers stopped, using Hebri's
normal backup restore flow. Restore also restores the backed-up configuration;
select the intended provider afterwards.

## What stays local and what is recalled

Each profile has its own `keelindex/entries.sqlite3`. KEEL supplements the
built-in curated blocks with lexical/BM25 fact recall and bounded episode
recall. It is not a semantic search or a long-running job scheduler.
Committed built-in adds, replacements and removals are mirrored with exact
previous-entry provenance. Retired revisions remain audit history but are
excluded from recall; removal is not secure erasure. Child agents cannot write
through KEEL's primary-agent-only save operation.

Alias generation defaults off. Template aliases are local. Explicitly enabling
`plugins.keelindex.alias_mode: model` sends alias-generation input through the
selected profile's configured model provider. Likewise, facts retrieved for a
conversation are included in that conversation's model input; local storage
does not mean cloud inference receives no recalled information.

## Provenance and maintenance

KEEL's code is distributed under the included **GNU AGPL v3** license; the
repository's MIT license does not replace that license. Corresponding source
is shipped here, including the maintenance tools. No runtime fetch from the
private upstream repository is needed.

The only patch to upstream 0.6.1 is in `maintenance/keel_admin.py`: explicitly
selected hidden homes such as `.hebri` and `.hermes` are permitted. Implicit
multi-profile discovery still excludes hidden directories. `UPSTREAM.json`
records both the upstream hash and the patched bundled hash. `cli.py` is Hebri's
profile-scoped wrapper, adding backup-before-apply and writer acknowledgment.

The upstream lifecycle correction fixed stale correction/deletion recall,
target/provenance collisions, read-only previews, portable profile selection,
and unsafe journal replay. Hebri integration tests exercise the real provider
loader, committed memory hooks, restart/profile isolation, backup and import.
The CI matrix runs those tests natively on Windows, macOS and Linux.
