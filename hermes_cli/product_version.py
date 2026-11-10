"""Product version shared by Hebri's CLI, browser and desktop-backed sessions.

Keep the engine's Python package version independent: plugin compatibility uses it.
The desktop manifest is the release pipeline's authoritative product version.
"""

import json
import re
from pathlib import Path


def product_version(root: Path | None = None) -> str:
    root = root or Path(__file__).resolve().parent.parent
    try:
        manifest = json.loads((root / "apps" / "desktop" / "package.json").read_text(encoding="utf-8"))
        version = manifest.get("version")
        if isinstance(version, str) and re.fullmatch(r"\d+\.\d+\.\d+(?:-[\w.-]+)?", version):
            return version
    except (OSError, ValueError, AttributeError):
        pass
    # A standalone engine wheel may not ship the desktop release manifest.
    # Never invent a desktop release number for that distribution.
    from hermes_cli import __version__
    return f"{__version__}-engine"
