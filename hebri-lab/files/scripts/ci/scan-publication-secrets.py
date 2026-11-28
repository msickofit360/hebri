"""Scan publishable working files and all locally stored Git blobs/commit/tag bodies.

Offline and read-only. Emits JSON counts; --locations adds locations and detector
names. Never emits matched bytes, commit messages, git error output or credentials.
Run in the checkout root using Python 3.10+ and Git.
"""
import argparse
import collections
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import subprocess
import sys


PATTERNS = {
    "model-provider": rb"\b(?:sk-or-v1-[A-Za-z0-9]{40,}|sk-ant-[A-Za-z0-9_-]{48,}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}|gsk_[A-Za-z0-9]{40,}|hf_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{35})\b",
    "source-control": rb"\b(?:gh[pousr]_[A-Za-z0-9]{32,}|github_pat_[A-Za-z0-9_]{50,}|glpat-[A-Za-z0-9_-]{16,}|xox[baprs]-[0-9A-Za-z-]{18,})\b",
    "cloud-key-id": rb"\b(?:AKIA|ASIA)[A-Z2-7]{16}\b",
    "cloud-or-service-token": rb"\b(?:[sr]k_(?:live|test)_[A-Za-z0-9]{16,}|npm_[A-Za-z0-9]{35,}|pypi-[A-Za-z0-9_-]{40,}|SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{30,}|dop_v1_[a-f0-9]{64}|GOCSPX-[A-Za-z0-9_-]{20,}|xapp-[A-Za-z0-9-]{32,})\b",
    "bot-token": rb"\b[0-9]{7,13}:[A-Za-z0-9_-]{34,}\b",
    "webhook-url": rb"https://(?:hooks\.slack\.com/services/[A-Za-z0-9]+/[A-Za-z0-9]+/[A-Za-z0-9]{16,}|(?:discord(?:app)?\.com)/api/webhooks/[0-9]{12,}/[A-Za-z0-9_-]{35,})",
    "jwt": rb"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{16,}",
    "private-key-body": rb"-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\\nr]{1,12}[A-Za-z0-9+/=]{40,}",
    "url-userinfo": rb"(?i)\b(?:https?|postgres(?:ql)?|mongodb(?:\+srv)?|redis|mysql)://[^/\s@:$<>]{1,64}:([a-z0-9_+.%!~-]{10,})@",
    "credential-assignment": rb"""(?im)(?:api[_-]?key|token|password|passwd|secret(?:[_-]?access[_-]?key)?|client[_-]?key)["']?[ \t]*[:=][ \t]*["']?([a-z0-9+_/=.!~-]{16,256})(?=["'\s,;}\]]|$)""",
    "bearer-literal": rb"""(?i)\b(?:Bearer|Basic)[ ]+([a-z0-9+/=_~-]{20,200})\b""",
}
RULES = [(kind, re.compile(pattern)) for kind, pattern in PATTERNS.items()]
SAMPLE = re.compile(rb"(?i)(?:example|your[_-]|replace[_-]|placeholder|dummy|fake|mock|sample|redacted|not[_-]a[_-]|test[_-](?:api|token|secret|key)|0123456789|abcdefghijklmnopqrstuvwxyz|xxxxxxxx|00000000)")
SAFE_PATH = re.compile(r"^[\w \-./@()+,\[\]]{1,400}$")
CHUNK = 1024 * 1024
OVERLAP = 4096
GIT_ENV = {**os.environ, "GIT_NO_LAZY_FETCH": "1", "GIT_TERMINAL_PROMPT": "0", "GIT_NO_REPLACE_OBJECTS": "1"}


def git(*args):
    result = subprocess.run(["git", *args], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=GIT_ENV)
    if result.returncode:
        raise RuntimeError("Local Git inventory failed")
    return result.stdout


def safe_path(name):
    if name and SAFE_PATH.fullmatch(name) and not any(pattern.search(name.encode()) for _, pattern in RULES):
        return name
    return "[path withheld]" if name else "[unmapped object]"


def findings(data):
    for kind, pattern in RULES:
        for hit in pattern.finditer(data):
            val = hit.group(hit.lastindex or 0)
            if kind in ("credential-assignment", "bearer-literal", "url-userinfo"):
                quoted = hit.start(1) > 0 and data[hit.start(1) - 1:hit.start(1)] in (b'"', b"'")
                if not quoted and not any(c in b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" for c in val):
                    continue
                if not SAMPLE.search(val):
                    counts = collections.Counter(val)
                    entropy = -sum(n / len(val) * math.log2(n / len(val)) for n in counts.values())
                    if entropy < 3.4:
                        continue
            shape = "sample-pattern" if SAMPLE.search(val) else "review"
            yield hit.start(), kind, shape


def scan_stream(stream, size, with_hash=False):
    remaining = size
    before = b""
    previous_lines = 0
    hits = set()
    digest = hashlib.sha1(f"blob {size}\0".encode()) if with_hash else None
    while remaining:
        block = stream.read(min(CHUNK, remaining))
        if not block:
            raise RuntimeError("Incomplete file or object")
        if digest:
            digest.update(block)
        remaining -= len(block)
        frame = before + block
        for start, kind, shape in findings(frame):
            hits.add((previous_lines + frame.count(b"\n", 0, start) + 1, kind, shape))
        keep = min(OVERLAP, len(frame))
        previous_lines += frame.count(b"\n", 0, len(frame) - keep)
        before = frame[-keep:]
    return sorted(hits), digest.hexdigest() if digest else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--locations", action="store_true", help="List file/line and object IDs, never values")
    parser.add_argument("--history-only", action="store_true", help="Scan objects only, including bare repositories")
    args = parser.parse_args()
    root = Path.cwd() if args.history_only else Path(git("rev-parse", "--show-toplevel").decode().strip()).resolve()
    os.chdir(root)
    object_format = git("rev-parse", "--show-object-format").decode().strip()
    if object_format != "sha1":
        raise RuntimeError("This scanner currently supports SHA-1 Git repositories")
    paths = set() if args.history_only else {os.fsdecode(x) for x in git("ls-files", "-z", "--cached", "--others", "--exclude-standard").split(b"\0") if x}
    tracked = set() if args.history_only else {os.fsdecode(x) for x in git("ls-files", "-z", "--cached").split(b"\0") if x}
    refs = {}
    for line in git("-c", "core.quotePath=false", "rev-list", "--objects", "--all", "--reflog").splitlines():
        oid, _, name = line.partition(b" ")
        refs.setdefault(oid.decode(), os.fsdecode(name))
    inventory = git("cat-file", "--batch-all-objects", "--unordered", "--batch-check=%(objectname) %(objecttype) %(objectsize)").decode().splitlines()
    cache = {}
    scope = collections.Counter()
    rules = collections.Counter()
    locations = []
    def record(area, name, oid, hits):
        for line, kind, shape in hits:
            rules[(area, kind, shape)] += 1
            if args.locations:
                locations.append({"area": area, "path": safe_path(name), "oid": oid, "line": line, "rule": kind, "shape": shape})
    for name in sorted(paths):
        file = root / name
        try:
            info = file.lstat()
            if not stat.S_ISREG(info.st_mode) or file.is_symlink() or root not in file.resolve().parents:
                scope["worktree_nonregular_or_external"] += 1
                continue
            with file.open("rb") as stream:
                hits, oid = scan_stream(stream, info.st_size, True)
        except FileNotFoundError:
            scope["worktree_missing"] += 1
            continue
        cache[oid] = hits
        scope["worktree_tracked" if name in tracked else "worktree_untracked"] += 1
        scope["worktree_bytes"] += info.st_size
        record("worktree", name, oid, hits)
    process = subprocess.Popen(["git", "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                               stderr=subprocess.DEVNULL, env=GIT_ENV)
    try:
        for row in inventory:
            oid, obj_type, length = row.split()
            size = int(length)
            area = "refs_or_reflogs" if oid in refs else "unreachable"
            scope[f"{area}_{obj_type}"] += 1
            if obj_type == "tree":
                continue
            scope["object_content_bytes"] += size
            if oid in cache:
                hits = cache[oid]
            else:
                process.stdin.write(oid.encode() + b"\n")
                process.stdin.flush()
                header = process.stdout.readline().split()
                if len(header) != 3 or header[0].decode() != oid or int(header[2]) != size:
                    raise RuntimeError("Git object not locally readable")
                hits, _ = scan_stream(process.stdout, size)
                if process.stdout.read(1) != b"\n":
                    raise RuntimeError("Invalid local Git object stream")
            record(area + "_" + obj_type, refs.get(oid, ""), oid, hits)
    finally:
        process.stdin.close()
        process.stdout.close()
        process.wait()
    if process.returncode:
        raise RuntimeError("Git object scan did not finish")
    result = {"head": git("rev-parse", "HEAD").decode().strip(),
              "shallow": git("rev-parse", "--is-shallow-repository").strip() == b"true",
              "git_refs": len(git("for-each-ref", "--format=%(refname)").splitlines()),
              "scope": scope, "candidates": [{"area": a, "rule": k, "shape": s, "count": n} for (a,k,s),n in sorted(rules.items())]}
    if args.locations:
        result["locations"] = locations
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError) as exc:
        print("Scan incomplete: " + type(exc).__name__ + ". Inspect local Git/repository access.", file=sys.stderr)
        sys.exit(2)
