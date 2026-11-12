#!/usr/bin/env python3
"""keel_doctor.py — verify the unified KEEL memory store is actually healthy.

A migration that reports success is not evidence the memory works. This runs the checks
that would catch a silent failure:

  1. STORE     — the store opens and its revisions are readable
  2. INTEGRITY — no duplicate facts; every entry has a non-empty body
  3. SELF-FIND — sample existing facts and try to retrieve them by three words;
                 this is not a semantic/paraphrase benchmark
  4. SURFACES  — reports which of the four original surfaces are still live, so a
                 "consolidated" claim is checked against what is still wired up
  5. PROVIDER  — report each profile's configured provider, without requiring uniformity

USAGE
    python scripts/keel_doctor.py --profile-root PATH --profile NAME

EXIT CODES
    0  all checks passed
    1  one or more checks failed
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sqlite3
import sys
from pathlib import Path
from keel_admin import config, memory_servers, profiles
from keel_unify import load_store_class

PROFILE_ROOT = os.environ.get('KEEL_PROFILE_ROOT')
PLUGIN_DIR = Path(os.environ.get('KEEL_PLUGIN_DIR') or Path(__file__).resolve().parents[1] / 'src/keel')

def provider_of(prof: Path):
    memory = config(prof).get("memory", {})
    if not isinstance(memory, dict):
        raise ValueError("memory configuration must be a mapping")
    return memory.get("provider")


def check_profile(prof: Path, IndexedStore, verbose: bool) -> list:
    """Return a list of (check_name, ok, detail) tuples."""
    results = []
    store_dir = prof / "keelindex"
    if not (store_dir / "entries.sqlite3").exists():
        return [("STORE", False, "no entries.sqlite3")]

    store_dir.resolve().relative_to(prof.resolve())
    (store_dir / 'entries.sqlite3').resolve().relative_to(prof.resolve())
    store = IndexedStore(store_dir, read_only=True)
    entries = store.entries()
    entries = [e for e in entries if e['kind'] == 'fact']
    results.append(("STORE", True, f"{len(entries)} active facts (empty is valid)"))

    # -- INTEGRITY ---------------------------------------------------------
    seen, dups, empty = set(), 0, 0
    for e in entries:
        body = (e.get("body") or "").strip()
        if not body:
            empty += 1
            continue
        h = (e['source'], hashlib.sha256(body.encode("utf-8")).hexdigest())
        if h in seen:
            dups += 1
        seen.add(h)
    ok = dups == 0 and empty == 0
    results.append(("INTEGRITY", ok, f"{dups} duplicate(s), {empty} empty"))

    # -- SELF-FIND ---------------------------------------------------------
    # The one retrieval check that is valid for every profile: can it find its OWN facts?
    # Query with several words drawn from the fact, the way a real query is worded. A
    # SINGLE word is a bad probe: a common term ("breakthrough") can appear in several
    # facts, so top-3 fills with a sibling and the miss says nothing about memory health.
    sample = []
    for e in entries:
        body = (e.get("body") or "").strip()
        if len(body) < 60:
            continue
        words = [t.strip(".,:;()[]`'\"") for t in body.split()]
        alpha = sorted({w for w in words if len(w) > 4 and w.isalpha()},
                       key=len, reverse=True)
        if len(alpha) >= 3:
            sample.append((" ".join(alpha[:3]), body))
    sample = sample[:5]
    s_hits = 0
    for query, body in sample:
        r = store.knn(query, k=3)
        if any((hit[1].get("body") or "").strip() == body for hit in r):
            s_hits += 1
    if sample:
        results.append(("SELF-FIND", s_hits == len(sample),
                        f"{s_hits}/{len(sample)} own facts retrieved by a 3-word query"))
    return results


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify the unified KEEL memory store.")
    ap.add_argument("--profile", action="append")
    ap.add_argument('--profile-root', default=PROFILE_ROOT)
    ap.add_argument('--plugin-dir', type=Path, default=PLUGIN_DIR)
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    if not args.profile_root:
        ap.error('--profile-root is required (or KEEL_PROFILE_ROOT)')
    IndexedStore = load_store_class(args.plugin_dir)
    targets = profiles(args.profile_root, args.profile)

    failures = 0
    print(f"{'profile':<20} {'check':<10} {'':<4} detail")
    print("-" * 78)
    for prof in targets:
        for name, ok, detail in check_profile(prof, IndexedStore, args.verbose):
            flag = "ok  " if ok else "FAIL"
            if not ok:
                failures += 1
            print(f"{prof.name:<20} {name:<10} {flag} {detail}")

    # -- SURFACES ----------------------------------------------------------
    print("-" * 78)
    print("surfaces still wired up (a consolidation is only as good as what is left):")
    mcp_left = sorted({n for p in targets for n in memory_servers(p)})
    markers = {
        "keelindex store": any((p / 'keelindex/entries.sqlite3').is_file() for p in targets),
        "appendonly plugin installed (not necessarily active)": any((p / 'plugins/appendonly').exists() for p in targets),
        "MCP memory server": bool(mcp_left),
        "MEMORY.md block":  any((p / "memories" / "MEMORY.md").exists() for p in targets),
    }
    for label, present in markers.items():
        detail = ""
        if label == "MCP memory server" and mcp_left:
            detail = " -> " + ", ".join(mcp_left)
        print(f"   {'LIVE' if present else 'gone':<6} {label}{detail}")

    # -- PROVIDER ----------------------------------------------------------
    print("-" * 78)
    providers = {}
    for prof in targets:
        providers.setdefault(provider_of(prof), []).append(prof.name)
    for prov, names in sorted(providers.items(), key=lambda kv: str(kv[0])):
        label = prov or "(none)"
        print(f"   provider {label:<12} {len(names)} profile(s): {', '.join(names)}")
    if len(providers) > 1:
        print("   NOTE: different profiles may intentionally use different providers")

    print("-" * 78)
    if failures:
        print(f"RESULT: {failures} check(s) FAILED")
        return 1
    print("RESULT: all checks passed")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, sqlite3.Error, ImportError) as exc:
        print(f"Doctor failed: {exc}", file=sys.stderr)
        sys.exit(2)
