from __future__ import annotations

import json
from pathlib import Path


def load_race_keys_from_races_txt(repo_root: str) -> list[str]:
    """
    Loads the selected one-day race keys from `Races.txt`.
    Supported formats:
    - JSON list of strings: ["milano-sanremo", ...]
    - Python-ish assignment: Races = ["milano-sanremo", ...]
    """
    p = Path(repo_root) / "Races.txt"
    if not p.exists():
        txt = ""
    else:
        txt = p.read_text(encoding="utf-8").strip()

    if not txt:
        # Fallback: use the canonical in-code list.
        from .megabike_rules import RACES

        return list(RACES)
    if txt.startswith("Races"):
        # Allow "Races = [...]"
        eq = txt.find("=")
        if eq != -1:
            txt = txt[eq + 1 :].strip()
    data = json.loads(txt)
    if not isinstance(data, list) or not all(isinstance(x, str) for x in data):
        raise ValueError("Races.txt must be a JSON list of strings")
    # normalize
    out = []
    for x in data:
        x = x.strip().strip('"').strip()
        if x:
            out.append(x)
    return out


