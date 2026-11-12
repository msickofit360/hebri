"""Write-time lexical alias expansion (doc2query-style, arXiv 1904.08375).

Given a stored fact, generate the QUESTIONS that fact answers, so a lexical matcher can hit a
later paraphrase it structurally cannot hit from the fact text alone. Generation happens ONLY at
write time; retrieval never mutates the prompt prefix.

Two modes:
  'model'    -- one cheap LLM one-shot per fact (SUBprocess, tools disabled by the caller's flags).
  'template' -- deterministic question templates (free, no model; generalises little).
  'off'      -- no aliases.

The model call is deliberately generic (a standard doc2query prompt); it is never shown the
evaluation questions, only the fact.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path



PROMPT = (
    "You maintain a personal fact store. A fact is given. Write {n} SHORT, varied questions a user "
    "might ask LATER that this stored fact directly answers. Use everyday synonyms and indirect "
    "phrasing; do NOT reuse the fact's own wording where you can avoid it. Output ONLY a JSON array "
    "of {n} strings, no prose.\n\nKey: {key}\nFact: {body}"
)


def _extract_json_array(text):
    text = text.strip()
    # find the first [...] block
    m = re.search(r"\[.*\]", text, re.S)
    if not m:
        return []
    try:
        arr = json.loads(m.group(0))
    except Exception:
        return []
    return [s.strip() for s in arr if isinstance(s, str) and s.strip()]


def _model_generate(key, body, *, n=8, home=None, timeout=120, usage_file=None):
    prompt = PROMPT.format(n=n, key=key, body=body)
    from hermes_constants import get_hermes_home
    from tools.environments.local import served_profile_child_env
    active = get_hermes_home().resolve()
    if home is None or Path(home).resolve() != active:
        raise ValueError("alias generation must belong to the active profile")
    env = served_profile_child_env(target_home=active, inherit_credentials=True)
    cmd = [sys.executable, "-m", "hermes_cli.hebri", "--toolsets", "none", "-z", prompt]
    if usage_file:
        cmd += ["--usage-file", str(usage_file)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=timeout, env=env,
                           **({"creationflags": subprocess.CREATE_NO_WINDOW} if sys.platform == "win32" else {}))
    except subprocess.TimeoutExpired:
        return []
    if r.returncode:
        return []
    out = r.stdout or ""
    return _extract_json_array(out)


_TEMPLATES = [
    "{key}?",
    "What is the {key}?",
    "Can you tell me the {key}?",
    "Remind me about the {key}.",
    "{body}",
]


def _template_generate(key, body, *, n=8):
    out = []
    for t in _TEMPLATES:
        out.append(t.format(key=key, body=body))
    return out[:n]


def generate(key, body, *, mode="model", n=8, home=None, usage_file=None, runner=None):
    """Return a list of alias strings for a fact. Never raises; returns [] on failure."""
    if mode == "off":
        return []
    if mode == "template":
        return _template_generate(key, body, n=n)
    if runner is not None:
        try:
            return [s for s in runner(key, body) if isinstance(s, str) and s.strip()][:n]
        except Exception:
            return []
    try:
        return _model_generate(key, body, n=n, home=home, usage_file=usage_file)
    except Exception:
        return []
