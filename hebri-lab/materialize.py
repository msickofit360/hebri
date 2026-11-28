"""Reconstruct the reviewed source from a local Git checkout and the source overlay."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys


PACKAGE = Path(__file__).resolve().parent
PINNED_BASE = "0a1bb501a9b426e27baff1dccb33ea0870cb5b3b"
MODES = {"100644", "100755"}


def git(cwd, *args, data=None):
    # A local object transfer needs no hooks, external transport, account or credentials.
    env = {key: val for key, val in os.environ.items() if not key.upper().startswith("GIT_")}
    env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull, GIT_ALLOW_PROTOCOL="file",
               GIT_TERMINAL_PROMPT="0", GIT_NO_REPLACE_OBJECTS="1", GIT_NO_LAZY_FETCH="1",
               GIT_OPTIONAL_LOCKS="0")
    return subprocess.run(["git", "-c", "core.hooksPath=" + os.devnull, "-c", "core.protectNTFS=true",
                           "-c", "core.autocrlf=false", "-C", cwd, *args],
                          env=env, input=data, stdout=subprocess.PIPE, check=True).stdout


def safe_path(value):
    if not isinstance(value, str) or not value or "\\" in value or ":" in value:
        raise ValueError("Invalid manifest path")
    parts = PurePosixPath(value).parts
    if not parts or PurePosixPath(value).is_absolute() or str(PurePosixPath(value)) != value:
        raise ValueError("Invalid manifest path")
    if any(part.lower() in {".", "..", ".git"} or part.endswith((".", " ")) or
           any(ord(c) < 32 for c in part) for part in parts):
        raise ValueError("Invalid manifest path")
    return value


def checked_bytes(path, expected):
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError(f"Content hash mismatch: {path.name}")
    return raw


def apply_edits(old_bytes, edits):
    text = old_bytes.decode("utf-8")
    fragments = []
    pos = 0
    for start, count, replacement in edits:
        if (type(start) is not int or type(count) is not int or not isinstance(replacement, str) or
                start < pos or count < 0 or start + count > len(text)):
            raise ValueError("Invalid redaction offsets")
        fragments.extend((text[pos:start], replacement))
        pos = start + count
    fragments.append(text[pos:])
    return "".join(fragments).encode("utf-8")


def materialize(source, destination):
    source = source.resolve(strict=True)
    destination = destination.resolve()
    if destination.exists() or not destination.parent.is_dir():
        raise ValueError("Provide an unused directory name under an existing parent")
    if destination.is_relative_to(source) or destination.is_relative_to(PACKAGE):
        raise ValueError("Choose a destination outside the source and overlay")
    manifest = json.loads((PACKAGE / "manifest.json").read_bytes())
    if manifest["format"] != 1 or manifest["base"] != PINNED_BASE:
        raise ValueError("This version requires its pinned Hebri base")
    source_tree = git(source, "rev-parse", "--verify", PINNED_BASE + "^{tree}").decode().strip()
    if source_tree != manifest["base_tree"]:
        raise ValueError("The local checkout does not contain the expected upstream tree")
    checked_bytes(PACKAGE / "UPSTREAM-LICENSE.txt", manifest["upstream_license_sha256"])
    redactions = json.loads(checked_bytes(PACKAGE / "redactions.json", manifest["redactions_sha256"]))
    bodies = {}
    files_dir = PACKAGE / "files"
    for entry in manifest["files"]:
        name = safe_path(entry["path"])
        src = files_dir / name
        if src.is_symlink() or not src.resolve(strict=True).is_relative_to(files_dir):
            raise ValueError("Source path outside the overlay")
        bodies[name] = checked_bytes(src, entry["sha256"])
    for entry in redactions:
        name = safe_path(entry["path"])
        old = git(source, "rev-parse", "--verify", PINNED_BASE + ":" + name).decode().strip()
        if old != entry["base_blob"]:
            raise ValueError(f"Upstream reference mismatch: {name}")
        result = apply_edits(git(source, "cat-file", "blob", old), entry["edits"])
        if hashlib.sha256(result).hexdigest() != entry["sha256"]:
            raise ValueError(f"Redaction verification failed: {name}")
        bodies[name] = result
    removed = [safe_path(path) for path in manifest["omit_from_reconstruction"]]
    if len(bodies) != len(manifest["files"]) + len(redactions) or len(set(removed) | set(bodies)) != len(removed) + len(bodies):
        raise ValueError("Duplicate manifest entry")
    # Validate input and reconstruction before creating any working files.
    destination.mkdir()
    git(destination, "init", "--quiet", "--template=")
    git(destination, "fetch", "--quiet", "--no-tags", "--no-recurse-submodules", "--depth=1",
        "--no-write-fetch-head", source.as_uri(), PINNED_BASE)
    git(destination, "update-ref", "--no-deref", "HEAD", PINNED_BASE)
    git(destination, "read-tree", PINNED_BASE)
    updates = bytearray()
    for entry in [*manifest["files"], *redactions]:
        name = entry["path"]
        mode = entry["mode"]
        if mode not in MODES:
            raise ValueError(f"Unsupported file mode: {name}")
        blob = git(destination, "hash-object", "-w", "--stdin", data=bodies[name]).decode().strip()
        if blob != entry.get("blob", entry.get("result_blob")):
            raise ValueError(f"Git blob mismatch: {name}")
        updates.extend(f"{mode} {blob}\t{name}\0".encode())
    for name in removed:
        updates.extend(("0 " + "0" * 40 + "\t" + name + "\0").encode())
    git(destination, "update-index", "-z", "--index-info", data=bytes(updates))
    tree = git(destination, "write-tree").decode().strip()
    if tree != manifest["source_tree"] or not re.fullmatch("[0-9a-f]{40}", tree):
        raise ValueError("Final tree failed its integrity check")
    git(destination, "checkout-index", "--all")
    print("Verified source tree:", tree)
    print("Open the reconstructed checkout at", destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("local_upstream", type=Path, help="local Git repository containing the pinned Hebri revision")
    parser.add_argument("new_directory", type=Path, help="unused checkout path outside the upstream and overlay")
    args = parser.parse_args()
    try:
        materialize(args.local_upstream, args.new_directory)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
