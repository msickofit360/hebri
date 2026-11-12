#!/usr/bin/env python3
"""Preview/import current curated memories. Historical journals are never replayed.

Use --profile-root PATH --profile NAME (repeatable), then --apply after backup and
review. --reconcile-curated retires stale mirrors of files actually present.
Optional MCP imports require an explicit DB, selected profiles, and matching YAML.
Dry runs open existing databases read-only; no profile directories/schema are created.
Exit: 0 success, 1 oversized facts (nothing applied), 2 invalid input/read failure.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import os
from pathlib import Path
import re
import sqlite3
import sys

from keel_admin import memory_servers, profiles

PROFILE_ROOT = os.environ.get('KEEL_PROFILE_ROOT')
MCP_DB = os.environ.get('KEEL_MCP_DB')
PLUGIN_DIR = Path(os.environ.get('KEEL_PLUGIN_DIR') or Path(__file__).resolve().parents[1] / 'src/keel')


def load_store_class(plugin_dir):
    spec = importlib.util.spec_from_file_location('keelindex_admin', Path(plugin_dir) / '__init__.py')
    if spec is None or spec.loader is None:
        raise ValueError('cannot load KEEL plugin')
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod.IndexedStore


def read_block(path, label):
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    for i, chunk in enumerate(re.split(r'(?m)^\s*§\s*$', text), 1):
        if chunk.strip():
            yield chunk.strip(), f'migrated from {label} block (fact {i})'


def read_mcp(path):
    db = sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True)
    try:
        rows = db.execute('SELECT id, mtype, content, tags FROM memories').fetchall()
    finally:
        db.close()
    for mid, mtype, content, tags in rows:
        if isinstance(content, str) and content.strip():
            yield content.strip(), f'migrated from shared MCP synapsek store ({str(mtype or "untyped")[:80]}, id {str(mid)[:80]})'


def declares_synapsek_mcp(profile):
    return 'synapsek' in memory_servers(profile)


def stable_id(body):
    return 'mcp-' + hashlib.sha256(body.encode('utf-8')).hexdigest()


def derive_key(body):
    return ' '.join(body.split()[:12]).encode('utf-8')[:200].decode('utf-8', errors='ignore')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--profile-root', default=PROFILE_ROOT)
    ap.add_argument('--plugin-dir', type=Path, default=PLUGIN_DIR)
    ap.add_argument('--profile', action='append')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--reconcile-curated', action='store_true')
    ap.add_argument('--alias-mode', choices=['off', 'template'], default='off')
    ap.add_argument('--include-mcp', action='store_true')
    ap.add_argument('--mcp-db', default=MCP_DB)
    args = ap.parse_args()
    if not args.profile_root:
        ap.error('--profile-root is required (or KEEL_PROFILE_ROOT)')
    if (args.apply or args.include_mcp) and not args.profile:
        ap.error('--apply/--include-mcp requires explicit --profile selection')
    if args.include_mcp and not args.mcp_db:
        ap.error('--include-mcp requires --mcp-db (or KEEL_MCP_DB)')

    try:
        targets = profiles(args.profile_root, args.profile)
        Store = load_store_class(args.plugin_dir)
        eligible_mcp = [p for p in targets if declares_synapsek_mcp(p)] if args.include_mcp else []
        mcp = list(read_mcp(args.mcp_db)) if eligible_mcp else []
        plans, oversized = [], 0
        for profile in targets:
            for directory in (profile / 'memories', profile / 'keelindex'):
                directory.resolve().relative_to(profile.resolve())
            db_path = profile / 'keelindex/entries.sqlite3'
            db_path.resolve().relative_to(profile.resolve())
            existing = Store(profile / 'keelindex', read_only=True).entries(include_deleted=True) if db_path.exists() else []
            active = [r for r in existing if r['kind'] != 'deleted']
            additions, removals = [], []
            for target, label in [('memory', 'MEMORY.md'), ('user', 'USER.md')]:
                path = profile / 'memories' / label
                path.resolve().relative_to(profile.resolve())
                facts = [body for body, _ in read_block(path, label)]
                owned = [r for r in active if Store.builtin_source(r['source'], target)]
                known = {r['body'].strip() for r in owned}
                additions += [(target, body, '') for body in dict.fromkeys(facts) if body not in known]
                if args.reconcile_curated and path.exists():
                    removals += [(target, body) for body in sorted(known - set(facts))]
            if profile in eligible_mcp:
                known = {r['body'].strip() for r in existing if r['source'].startswith('migrated from shared MCP synapsek store (')}
                for body, source in mcp:
                    if body not in known:
                        additions.append(('mcp', body, source))
                        known.add(body)
            oversized += sum(len(body.encode('utf-8')) > 2048 for _, body, _ in additions)
            legacy = sum(r['source'].startswith('migrated from appendonly journal') for r in active)
            print(f'{profile.name}: add={len(additions)}, retire={len(removals)}, legacy-journal-records={legacy}')
            if (profile / 'memory/appendonly_journal.jsonl').exists() or legacy:
                print('  Historical journal/imports require manual review: deletions were not recorded; no replay or automatic deletion.')
            plans.append((profile, additions, removals))
        if oversized:
            print(f'{oversized} oversized facts; nothing applied. Split current entries before retrying.')
            return 1
        if args.apply:
            for profile, additions, removals in plans:
                if not additions and not removals:
                    continue
                store = Store(profile / 'keelindex', alias_mode=args.alias_mode)
                for target, body in removals:
                    store.mirror_builtin('remove', target, previous_content=body)
                for target, body, source in additions:
                    if target == 'mcp':
                        store.add(stable_id(body), derive_key(body), body, source=source)
                    else:
                        store.mirror_builtin('add', target, body)
        print('APPLIED' if args.apply else 'DRY RUN — no profile writes')
        return 0
    except (OSError, ValueError, sqlite3.Error, ImportError) as exc:
        print(f'Cannot complete migration: {type(exc).__name__}: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
