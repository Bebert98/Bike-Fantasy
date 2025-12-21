from __future__ import annotations

import argparse
import json
from typing import Any

from procyclingstats import Race, Rider

from .pcs_async import run_blocking


def _summarize(obj: Any, max_list: int = 3) -> Any:
    if isinstance(obj, dict):
        return {k: _summarize(v, max_list=max_list) for k, v in list(obj.items())[:20]}
    if isinstance(obj, list):
        return [_summarize(x, max_list=max_list) for x in obj[:max_list]]
    return obj


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rider-slug", type=str, default="rider/tadej-pogacar")
    ap.add_argument("--race-slug", type=str, default="race/milano-sanremo")
    args = ap.parse_args()

    rider = Rider(args.rider_slug)
    race = Race(args.race_slug)

    rider_parsed = await run_blocking(lambda: rider.parse())
    race_parsed = await run_blocking(lambda: race.parse())

    print("=== Rider.parse() keys ===")
    print(sorted(list(rider_parsed.keys())))
    print("=== Rider.parse() sample ===")
    print(json.dumps(_summarize(rider_parsed), indent=2, ensure_ascii=False))

    print("\n=== Race.parse() keys ===")
    print(sorted(list(race_parsed.keys())))
    print("=== Race.parse() sample ===")
    print(json.dumps(_summarize(race_parsed), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())


