"""Release catalog must reflect its source manifests and current removal list."""
from scripts.build_desktop_plugin_catalog import OUTPUT, build


def test_desktop_catalog_matches_repository_manifests():
    assert OUTPUT.read_text(encoding="utf-8") == build(), (
        "Regenerate with python scripts/build_desktop_plugin_catalog.py"
    )
