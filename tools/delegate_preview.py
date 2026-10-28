"""Delegate only renderer-checked browser access, never general desktop callbacks."""
from tools.registry import tool_error


def child_preview_callbacks(parent) -> dict:
    callbacks = {}
    for attr, tool in (("read_preview_callback", "desktop_preview"), ("drive_preview_callback", "drive_preview")):
        original = getattr(parent, attr, None)
        if not callable(original) or tool not in getattr(parent, "valid_tool_names", ()):
            continue

        def forward(payload, *, _attr=attr, _original=original, _tool=tool):
            # No tab inference, grant requests, UI focus, or open/close from children.
            if (getattr(parent, _attr, None) is not _original
                    or _tool not in getattr(parent, "valid_tool_names", ())
                    or not payload.get("tab_id")
                    or payload.get("action", "read") in {"open", "close", "select", "allow_background"}):
                return tool_error("A delegated agent needs an explicitly approved browser tab_id from its parent.")
            scoped = {**payload, "delegated": True}
            return _original(**scoped) if _attr == "read_preview_callback" else _original(scoped)

        if attr == "read_preview_callback":
            callbacks[attr] = lambda _forward=forward, **payload: _forward(payload)
        else:
            callbacks[attr] = forward
    return callbacks
