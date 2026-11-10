#!/usr/bin/env python3
"""Bundle repository metadata for in-app browsing; never fetch or install code.

Run after reviewing catalog changes. --check rejects a stale snapshot.
Upstream tiers are omitted: they are not Synapsek endorsements.
"""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps/desktop/src/lib/plugin-catalog-bundled.json"


def build():
    removed = yaml.safe_load((ROOT / "plugin-catalog/removed.yaml").read_text(encoding="utf-8"))["removed"] or []
    rows = []
    for path in sorted((ROOT / "plugin-catalog").glob("*.yaml")):
        if path.name == "removed.yaml":
            continue
        row = yaml.safe_load(path.read_text(encoding="utf-8"))
        if any(item.get("name") == row["name"] or item.get("repo") == row["repo"] for item in removed):
            continue
        url = urlsplit(row["repo"])
        if not re.fullmatch(r"[a-z0-9_-]{1,64}", row["name"]) or not re.fullmatch(r"[a-f0-9]{40}", row["sha"]):
            raise ValueError(f"Invalid catalog identity or pin: {path.name}")
        if url.scheme != "https" or not url.hostname or url.username or url.password:
            raise ValueError(f"Invalid repository URL: {path.name}")
        subdir = row.get("subdir", "")
        if subdir.startswith(("/", "\\")) or ".." in subdir.replace("\\", "/").split("/"):
            raise ValueError(f"Invalid subdirectory: {path.name}")
        rows.append({key: row.get(key, "") for key in (
            "name", "repo", "sha", "subdir", "description", "maintainer", "category", "version", "requires_hermes"
        )} | {"platforms": row.get("platforms", [])})
    return json.dumps(rows, ensure_ascii=False, indent=2) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            raise SystemExit("Desktop plugin catalog is stale; run scripts/build_desktop_plugin_catalog.py")
    else:
        OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(f"Desktop plugin catalog: {len(json.loads(content))} pinned entries")
