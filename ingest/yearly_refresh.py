from __future__ import annotations

import argparse
import csv
import hashlib
import sys
from datetime import datetime
from typing import Any

from .pcs_http import fetch_pcs_html
from .pcs_parse import parse_rankings_php_uci_one_day, parse_rider_ranking_table
from .supabase_client import get_supabase


def _derive_price_from_points(rank_points: int) -> int:
    """
    Pricing rule (Megabike):
    - price == PCS points from the configured ranking source.
    """
    return max(0, int(rank_points))


def _stable_slug(name: str, nationality: str | None) -> str:
    # If we don't have a PCS URL slug, use a stable hash-based slug.
    base = f"{name}|{nationality or ''}".encode("utf-8")
    h = hashlib.sha1(base).hexdigest()[:12]
    return f"rider/{h}"


def _load_seed_csv(path: str) -> list[dict[str, Any]]:
    """
    CSV columns (minimal):
      - rider_name (required)
      - price (optional int) OR points (optional int; used to derive price)
      - pcs_slug (optional)
      - team_name (optional)
      - nationality (optional)
    """
    out: list[dict[str, Any]] = []
    with open(path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row:
                continue
            name = (row.get("rider_name") or row.get("name") or "").strip()
            if not name:
                continue
            out.append({k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()})
    return out


async def _try_parse_ranking(slug: str) -> dict[str, Any] | None:
    try:
        # Support both relative slugs ("rankings/me/individual") and absolute URLs
        url = slug if slug.startswith("http") else f"https://www.procyclingstats.com/{slug}"
        status, html = await fetch_pcs_html(url)
        if status != 200:
            return None
        # Prefer rankings.php parser when applicable; otherwise use generic ranking table parser.
        if "rankings.php" in url and "uci-one-day-races" in url:
            rows = parse_rankings_php_uci_one_day(html)
        else:
            rows = parse_rider_ranking_table(html)
        return {"ranking": rows}
    except Exception:
        return None


def _chunked(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


async def _fetch_rankings_php_uci_one_day(date_str: str, limit: int = 1000) -> list[dict[str, Any]]:
    """
    Fetch and parse the UCI one-day races ranking via rankings.php with offset pagination.
    PCS uses offsets in steps of 100: 0, 100, 200, ...
    """
    out: list[dict[str, Any]] = []
    for offset in range(0, 10000, 100):
        if len(out) >= limit:
            break
        url = (
            "https://www.procyclingstats.com/rankings.php?"
            f"p=uci-one-day-races&s=&date={date_str}&nation=&age=&page=smallerorequal&team=&"
            f"offset={offset}&filter=Filter"
        )
        parsed = await _try_parse_ranking(url)
        rows = (parsed or {}).get("ranking") or []
        if not isinstance(rows, list) or not rows:
            break
        out.extend(rows)
        # If PCS returns fewer than 100 rows, we're likely at the end.
        if len(rows) < 50:
            break
    return out[:limit]


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--season-year", type=int, default=datetime.utcnow().year)
    ap.add_argument(
        "--ranking-slug",
        type=str,
        default="rankings.php?mode=uci_one_day",
        help="PCS ranking slug to seed riders from (can be changed later).",
    )
    ap.add_argument(
        "--date",
        type=str,
        default=datetime.utcnow().date().isoformat(),
        help="Date for PCS rankings.php pages (YYYY-MM-DD). Defaults to today.",
    )
    ap.add_argument(
        "--seed-csv",
        type=str,
        default=None,
        help="Fallback: seed riders/prices from a CSV if PCS scraping fails.",
    )
    ap.add_argument("--limit", type=int, default=800)
    args = ap.parse_args()

    sb = get_supabase()

    rows: list[Any] = []

    # Preferred: seed riders from a broad PCS ranking list.
    if not args.seed_csv:
        parsed: dict[str, Any] | None = None

        # New default: UCI one-day races ranking via rankings.php offsets.
        if args.ranking_slug in ("rankings.php?mode=uci_one_day", "uci-one-day-races"):
            rows = await _fetch_rankings_php_uci_one_day(args.date, limit=args.limit)
            parsed = {"ranking": rows} if rows else None
        else:
            candidates = [
                args.ranking_slug,
                # Common PCS patterns (try a couple in case the default slug is wrong)
                "rankings/me/individual",
                "rankings/me/individual?date=" + args.date,
            ]
            for slug in candidates:
                parsed = await _try_parse_ranking(slug)
                if parsed:
                    break

        if not parsed or not (parsed.get("ranking") or parsed.get("riders") or parsed.get("results")):
            print(
                "Failed to fetch/parse PCS ranking HTML.\n"
                "This can happen if the slug is wrong or PCS serves a challenge/blocked page.\n"
                "Fix options:\n"
                "  1) Try another slug: --ranking-slug 'rankings/me/individual'\n"
                "  2) Use CSV fallback: --seed-csv /path/to/riders.csv\n",
                file=sys.stderr,
            )
            sys.exit(1)

        # The exact structure depends on PCS HTML; keep this defensive.
        rows_any = parsed.get("ranking") or parsed.get("riders") or parsed.get("results") or []
        if isinstance(rows_any, list):
            rows = rows_any

    # Fallback: seed from CSV
    seed_csv_rows: list[dict[str, Any]] = []
    if args.seed_csv:
        seed_csv_rows = _load_seed_csv(args.seed_csv)
        rows = seed_csv_rows

    riders_to_upsert: list[dict[str, Any]] = []
    prices_to_upsert: list[dict[str, Any]] = []

    for row in rows[: args.limit]:
        if not isinstance(row, dict):
            continue

        name = row.get("rider_name") or row.get("name")
        if not name:
            continue

        nationality = row.get("nationality")
        team_name = row.get("team") or row.get("team_name")
        pts = row.get("points") or row.get("pcs_points") or 0
        try:
            pts_int = int(pts)
        except Exception:
            pts_int = 0

        # CSV can provide explicit price
        price = row.get("price")
        price_int: int | None = None
        if price is not None and price != "":
            try:
                price_int = int(price)
            except Exception:
                price_int = None

        pcs_slug = row.get("rider_url") or row.get("url") or row.get("rider") or _stable_slug(
            str(name), str(nationality) if nationality else None
        )

        riders_to_upsert.append(
            {
                "pcs_slug": pcs_slug,
                "rider_name": name,
                "team_name": team_name,
                "nationality": nationality,
                "active": True,
            }
        )

    # Upsert riders by pcs_slug in chunks (safe for 1000+ riders)
    for batch in _chunked(riders_to_upsert, 500):
        if batch:
            sb.table("riders").upsert(batch, on_conflict="pcs_slug").execute()

    # Fetch ids back for pricing upsert, keyed by pcs_slug (avoid duplicate names)
    pcs_slugs = [r["pcs_slug"] for r in riders_to_upsert if r.get("pcs_slug")]
    id_by_slug: dict[str, str] = {}
    for batch in _chunked([{"pcs_slug": s} for s in pcs_slugs], 500):
        sl = [x["pcs_slug"] for x in batch]
        fetched = sb.table("riders").select("id, pcs_slug").in_("pcs_slug", sl).execute().data or []
        for r in fetched:
            if r.get("pcs_slug") and r.get("id"):
                id_by_slug[str(r["pcs_slug"])] = str(r["id"])

    # Compute and upsert prices for *all* seeded riders
    for row in rows[: args.limit]:
        if not isinstance(row, dict):
            continue
        pcs_slug = row.get("rider_url") or row.get("url") or row.get("rider")
        if not pcs_slug:
            # last resort: try to map via name to the stable slug; skip if can't
            name = row.get("rider_name") or row.get("name")
            nationality = row.get("nationality")
            if not name:
                continue
            pcs_slug = _stable_slug(str(name), str(nationality) if nationality else None)

        rider_id = id_by_slug.get(str(pcs_slug))
        if not rider_id:
            continue

        price = row.get("price")
        if price is not None and price != "":
            try:
                price_int = int(price)
            except Exception:
                price_int = None
        else:
            price_int = None

        pts = row.get("points") or row.get("pcs_points") or 0
        try:
            pts_int = int(float(pts))
        except Exception:
            pts_int = 0

        final_price = price_int if price_int is not None else _derive_price_from_points(pts_int)
        prices_to_upsert.append(
            {
                "season_year": args.season_year,
                "rider_id": rider_id,
                "price": final_price,
            }
        )

    for batch in _chunked(prices_to_upsert, 500):
        if batch:
            sb.table("rider_prices").upsert(batch, on_conflict="season_year,rider_id").execute()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())


