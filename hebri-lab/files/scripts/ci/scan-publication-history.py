"""Accelerated offline history scan for large bare mirrors. Requires a trusted PCRE2 8-bit library."""
import argparse
import collections
import ctypes as c
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

spec = importlib.util.spec_from_file_location("publication_scan", Path(__file__).with_name("scan-publication-secrets.py"))
scan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scan)


def matcher(library):
    lib = c.CDLL(str(Path(library).resolve(strict=True)))
    def function(name, args, result):
        fn = getattr(lib, name + "_8")
        fn.argtypes = args
        fn.restype = result
        return fn
    ptr, word, integer = c.c_void_p, c.c_size_t, c.c_int
    compile_re = function("pcre2_compile", [c.c_char_p, word, c.c_uint, c.POINTER(integer), c.POINTER(word), ptr], ptr)
    compile_jit = function("pcre2_jit_compile", [ptr, c.c_uint], integer)
    make_data = function("pcre2_match_data_create_from_pattern", [ptr, ptr], ptr)
    match = function("pcre2_match", [ptr, c.c_char_p, word, word, c.c_uint, ptr, ptr], integer)
    vector = function("pcre2_get_ovector_pointer", [ptr], c.POINTER(word))
    # One compiled union locates candidate spans. The canonical Python detector
    # identifies each candidate and applies its entropy/placeholder rules.
    raw = b"|".join(b"(?:" + pattern + b")" for pattern in scan.PATTERNS.values())
    err, loc = integer(), word()
    code = compile_re(raw, len(raw), 0, c.byref(err), c.byref(loc), None)
    if not code or compile_jit(code, 1) != 0:
        raise RuntimeError("Could not compile the native detector")
    obj = make_data(code, None)
    offsets = vector(obj)
    def find(data):
        cursor = 0
        if not data: return
        while cursor < len(data):
            result = match(code, data, len(data), cursor, 0, obj, None)
            if result == -1: break
            if result < 0: raise RuntimeError("Native pattern scan incomplete")
            start, end = offsets[0], offsets[1]
            # Include boundaries when verifying, and shift reported offsets back.
            base = max(0, start - 1)
            window = data[base:min(len(data), end + 1)]
            for i, kind, shape in scan.findings(window):
                if i + base == start: yield start, kind, shape
            # A broad assignment can surround a provider-specific secret. Start
            # at the next byte to preserve independent, overlapping detectors.
            cursor = start + 1
    return find


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("library", help="Absolute path to a trusted PCRE2 8-bit library (Git for Windows includes one).")
    ap.add_argument("--locations", action="store_true")
    args = ap.parse_args()
    matches = matcher(args.library)
    scope, counts = collections.Counter(), collections.Counter()
    paths = {}
    for line in scan.git("-c", "core.quotePath=false", "rev-list", "--objects", "--all", "--reflog").splitlines():
        oid, _, name = line.partition(b" ")
        paths.setdefault(oid.decode(), os.fsdecode(name))
    proc = subprocess.Popen(["git", "cat-file", "--batch-all-objects", "--unordered", "--batch"],
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=scan.GIT_ENV)
    locations = []
    for header in proc.stdout:
        oid, kind_b, size_b = header.rstrip().split(b" ")
        kind = kind_b.decode()
        size = int(size_b)
        relative = "refs_or_reflogs" if oid.decode() in paths else "unreachable"
        area = relative + "_" + kind
        raw = proc.stdout.read(size)
        if len(raw) != size or proc.stdout.read(1) != b"\n":
            raise RuntimeError("Incomplete Git content")
        scope[area] += 1
        if kind == "tree": continue
        scope["object_content_bytes"] += size
        line_number = 1
        last = 0
        prev = None
        for pos, detector, shape in matches(raw):
            line_number += raw.count(b"\n", last, pos)
            last = pos
            current = (line_number, detector, shape)
            if current == prev: continue
            prev = current
            counts[area, detector, shape] += 1
            if args.locations:
                locations.append({"area": area, "oid": oid.decode(), "path": scan.safe_path(paths.get(oid.decode(), "")),
                                  "line": line_number, "rule": detector, "shape": shape})
    if proc.wait() != 0: raise RuntimeError("Incomplete Git inventory")
    print(json.dumps({"head": scan.git("rev-parse","HEAD").strip().decode(), "scope": scope,
                      "shallow": scan.git("rev-parse","--is-shallow-repository").strip()==b"true",
                      "candidates":[{"area":a,"rule":k,"shape":s,"count":n} for (a,k,s),n in sorted(counts.items())],
                      **({"locations":locations} if args.locations else {})}))


if __name__ == "__main__":
    try: main()
    except (ValueError, OSError, RuntimeError) as exc:
        print("Scan incomplete (" + type(exc).__name__ + ").", file=sys.stderr)
        sys.exit(2)
