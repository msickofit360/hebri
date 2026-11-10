"""Fail closed when any locked PyPI artifact has an OSV advisory.

No package installation or third-party audit executable is needed. Optional
extras are included because they can be enabled after the desktop is installed.
"""
import json
from pathlib import Path
import sys
import tomllib
import urllib.request


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    with (root / "uv.lock").open("rb") as handle:
        packages = [
            package for package in tomllib.load(handle)["package"]
            if "registry" in package.get("source", {})
        ]
    with (root / "pyproject.toml").open("rb") as handle:
        build_requirements = tomllib.load(handle)["build-system"]["requires"]
    known = {(item["name"], item["version"]) for item in packages}
    for spec in build_requirements:
        name, separator, version = spec.partition("==")
        if not separator or not name or not version or any(char in version for char in ";,<>*"):
            print(f"Build requirement must have an exact version: {spec}", file=sys.stderr)
            return 2
        if (name, version) not in known:
            packages.append({"name": name, "version": version})
            known.add((name, version))
    payload = {"queries": [
        {"package": {"name": package["name"], "ecosystem": "PyPI"},
         "version": package["version"]}
        for package in packages
    ]}
    request = urllib.request.Request(
        "https://api.osv.dev/v1/querybatch",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Hebri-dependency-audit"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            results = json.load(response)["results"]
        if len(results) != len(packages):
            raise ValueError("Incomplete advisory response")
    except (OSError, ValueError, KeyError) as error:
        print(f"Dependency audit could not finish: {error}", file=sys.stderr)
        return 2
    findings = [
        {"package": package["name"], "version": package["version"],
         "advisories": [item["id"] for item in result.get("vulns", [])]}
        for package, result in zip(packages, results)
        if result.get("vulns")
    ]
    print(json.dumps({"packages_checked": len(packages), "findings": findings}, indent=2))
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
