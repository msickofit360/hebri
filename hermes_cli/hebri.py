"""Public Hebri entry points: isolate the fork before loading the shared core.

Internal modules still use HERMES_HOME. A shell's upstream Hermes setting must
not redirect the public Hebri command into that application's credentials/data.
"""
import os
import sys
from pathlib import Path


def configure_home() -> Path:
    if os.environ.get("HEBRI_GIT_BASH_PATH"):
        os.environ["HERMES_GIT_BASH_PATH"] = os.environ["HEBRI_GIT_BASH_PATH"]
    explicit = os.environ.get("HEBRI_HOME", "").strip()
    if explicit:
        home = Path(os.path.expandvars(explicit)).expanduser()
    elif sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA", "").strip()
        home = (Path(base) if base else Path.home() / "AppData" / "Local") / "hebri"
    else:
        home = Path.home() / ".hebri"
    os.environ["HEBRI_HOME"] = str(home)
    os.environ["HERMES_HOME"] = str(home)
    return home


def main():
    configure_home()
    from hermes_cli.main import main as run
    return run()


def agent():
    configure_home()
    from agent.legacy_cli import main as run
    return run()


def acp():
    configure_home()
    from acp_adapter.entry import main as run
    return run()


if __name__ == "__main__":
    main()
