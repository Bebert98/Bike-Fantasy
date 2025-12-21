from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class MegabikeConfig:
    races: list[str]
    races_rank: dict[str, int]
    rank_points: dict[int, list[int]]


def _exec_py_assignments(path: str) -> dict[str, Any]:
    """
    Loads local, repo-controlled python-like config files (Races.txt / Rankpoints.txt).
    These files are trusted inputs in this project.
    """
    namespace: dict[str, Any] = {}
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    exec(compile(content, path, "exec"), {}, namespace)  # noqa: S102 (trusted local file)
    return namespace


def load_megabike_config(project_root: str | None = None) -> MegabikeConfig:
    """
    Reads:
    - Bike-Fantasy/Races.txt  -> variable: Races (list[str])
    - Bike-Fantasy/Rankpoints.txt -> variables: races_rank (dict[str,int]), rank_points (dict[int,list[int]])
    """
    root = project_root or os.getcwd()
    races_path = os.path.join(root, "Races.txt")
    rankpoints_path = os.path.join(root, "Rankpoints.txt")

    races_ns = _exec_py_assignments(races_path)
    points_ns = _exec_py_assignments(rankpoints_path)

    races = races_ns.get("Races")
    races_rank = points_ns.get("races_rank")
    rank_points = points_ns.get("rank_points")

    if not isinstance(races, list) or not all(isinstance(x, str) for x in races):
        raise RuntimeError("Invalid Races.txt format: expected `Races = [..]`")
    if not isinstance(races_rank, dict):
        raise RuntimeError("Invalid Rankpoints.txt format: expected `races_rank = {...}`")
    if not isinstance(rank_points, dict):
        raise RuntimeError("Invalid Rankpoints.txt format: expected `rank_points = {...}`")

    # Normalize keys
    races_rank_norm: dict[str, int] = {}
    for k, v in races_rank.items():
        if isinstance(k, str) and isinstance(v, int):
            races_rank_norm[k] = v

    rank_points_norm: dict[int, list[int]] = {}
    for k, v in rank_points.items():
        if isinstance(k, int) and isinstance(v, list) and all(isinstance(p, int) for p in v):
            rank_points_norm[k] = v

    return MegabikeConfig(races=races, races_rank=races_rank_norm, rank_points=rank_points_norm)


