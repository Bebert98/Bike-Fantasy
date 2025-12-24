from __future__ import annotations


def points_for_rank(rank: int, race_tier: int, rank_points: dict[int, list[int]]) -> int:
    """
    Megabike scoring:
    - `race_tier` is 0/1/2 (from Rankpoints.txt `races_rank`)
    - `rank_points` is the table from Rankpoints.txt
    - rank is 1-based
    """
    if rank <= 0:
        return 0
    table = rank_points.get(race_tier)
    if not table:
        return 0
    idx = rank - 1
    if idx < 0:
        return 0
    # If rank is beyond the table, give the last value (participation points).
    if idx >= len(table):
        return int(table[-1])
    return int(table[idx])


