from __future__ import annotations

import argparse
import hashlib
from datetime import datetime
from typing import Any

from .pcs_async import run_blocking
from .megabike_rules import RACES, RACES_RANK, RANK_POINTS
from .pcs_http import fetch_pcs_html
from .pcs_parse import parse_race_result_table, parse_races_php_one_day_2025
from .races_list import load_race_keys_from_races_txt
from .scoring import points_for_rank
from .supabase_client import get_supabase


def _stable_rider_slug(name: str) -> str:
    h = hashlib.sha1(name.encode("utf-8")).hexdigest()[:12]
    return f"rider/{h}"


async def _fetch_html(slug: str) -> tuple[int, str]:
    return await fetch_pcs_html(f"https://www.procyclingstats.com/{slug}")


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--season-year", type=int, default=datetime.utcnow().year)
    ap.add_argument(
        "--verbose",
        action="store_true",
        help="Print debug logs (HTTP status, parsed counts, and skipped reasons).",
    )
    ap.add_argument(
        "--race-slug",
        type=str,
        default=None,
        help="Optional: PCS race slug to sync (e.g., 'race/tour-de-france/2025').",
    )
    ap.add_argument(
        "--sync-all",
        action="store_true",
        help="Sync all Megabike races from Races.txt for this season (recommended).",
    )
    args = ap.parse_args()

    sb = get_supabase()

    def log(msg: str) -> None:
        if args.verbose:
            print(msg, flush=True)

    # Decide what to sync
    slugs: list[tuple[str, str]] = []
    if args.sync_all:
        # Use the selected race list from repo root `Races.txt`
        race_keys = load_race_keys_from_races_txt(".")
        for race_key in race_keys:
            slugs.append((race_key, f"race/{race_key}/{args.season_year}"))
    elif args.race_slug:
        slugs.append(("_custom_", args.race_slug))
    else:
        return

    # If syncing many races for 2025, seed race name/date from PCS listing page.
    listing_by_key: dict[str, dict[str, Any]] = {}
    if args.season_year == 2025 and args.sync_all:
        list_url = "https://www.procyclingstats.com/races.php?s=&year=2025&circuit=1&class=&filter=Filter"
        log(f"[pcs] fetch races listing: {list_url}")
        status, html = await fetch_pcs_html(list_url)
        log(f"[pcs] races listing http status: {status} (len={len(html)})")
        if status == 200:
            listing_by_key = parse_races_php_one_day_2025(html)

    # Process races: upsert race + results + riders, then recompute season totals idempotently.
    for race_key, slug in slugs:
        # 1) Preferred: one-day results page HTML (custom parser)
        result_slug = slug
        if race_key != "_custom_":
            result_slug = f"race/{race_key}/{args.season_year}/result"

        log(f"[pcs] fetch results: {result_slug}")
        status, html = await _fetch_html(result_slug)
        log(f"[pcs] http status: {status} (len={len(html)})")

        if status != 200:
            # Fallback: some pages exist without year segment
            if race_key != "_custom_":
                fallback_slug = f"race/{race_key}/result"
                log(f"[pcs] fetch fallback results: {fallback_slug}")
                status, html = await _fetch_html(fallback_slug)
                log(f"[pcs] http status: {status} (len={len(html)})")
                result_slug = fallback_slug
            if status != 200:
                log("[pcs] could not fetch results page (likely blocked); skipping")
                continue

        race_name: str = result_slug
        race_date: str = datetime.utcnow().date().isoformat()

        # Prefer race name/date from listing page when available.
        if race_key != "_custom_" and listing_by_key.get(race_key):
            meta = listing_by_key[race_key]
            if meta.get("name"):
                race_name = str(meta["name"])
            if meta.get("date"):
                race_date = str(meta["date"])

        # Race title (best effort)
        try:
            from selectolax.parser import HTMLParser

            tree = HTMLParser(html)
            h1 = tree.css_first(".page-title h1")
            if h1 is not None:
                race_name = " ".join(h1.text().split())
        except Exception:
            pass

        # Parse details (date)
        from .pcs_parse import parse_race_details
        details = parse_race_details(html)
        if details.get("startdate"):
            race_date = details["startdate"]
        else:
            # Fallback: if results page didn't have date, try overview page
            # Result slug: race/foo/2025/result -> Overview: race/foo/2025
            if "/result" in result_slug:
                overview_slug = result_slug.replace("/result", "")
                log(f"[pcs] date missing, try overview: {overview_slug}")
                st_ov, html_ov = await _fetch_html(overview_slug)
                if st_ov == 200:
                    details_ov = parse_race_details(html_ov)
                    if details_ov.get("startdate"):
                        race_date = details_ov["startdate"]
                        log(f"[pcs] found date in overview: {race_date}")

        results = parse_race_result_table(html)
        log(f"[pcs] parsed results rows: {len(results)}")

        if not results:
            log("[sync] no results rows; skipping DB upserts for this race")

        # Upsert race
        sb.table("races").upsert(
            {
                "pcs_slug": result_slug if race_key == "_custom_" else f"race/{race_key}/{args.season_year}",
                "name": race_name,
                "race_date": race_date,
            },
            on_conflict="pcs_slug",
        ).execute()

        race_row = (
            sb.table("races")
            .select("id, pcs_slug")
            .eq("pcs_slug", result_slug if race_key == "_custom_" else f"race/{race_key}/{args.season_year}")
            .single()
            .execute()
            .data
        )
        race_id = race_row["id"]

        # Determine tier and points
        tier = RACES_RANK.get(race_key, 1) if race_key != "_custom_" else 1

        # Upsert riders from results (so we don't rely on a separate yearly seed)
        riders_to_upsert = []
        for row in results:
            if not isinstance(row, dict):
                continue
            name = row.get("rider_name") or row.get("rider") or row.get("name")
            if not name:
                continue
            rider_slug = row.get("rider_url") or row.get("rider") or row.get("url") or _stable_rider_slug(str(name))
            team_name = row.get("team") or row.get("team_name")
            nationality = row.get("nationality")
            riders_to_upsert.append(
                {
                    "pcs_slug": rider_slug,
                    "rider_name": name,
                    "team_name": team_name,
                    "nationality": nationality,
                    "active": True,
                }
            )

        if riders_to_upsert:
            sb.table("riders").upsert(riders_to_upsert, on_conflict="pcs_slug").execute()

        # Fetch rider ids for mapping
        slugs_for_lookup = [r["pcs_slug"] for r in riders_to_upsert]
        fetched = (
            sb.table("riders")
            .select("id, pcs_slug")
            .in_("pcs_slug", slugs_for_lookup)
            .execute()
            .data
            or []
        )
        id_by_slug = {r["pcs_slug"]: r["id"] for r in fetched}

        rr_rows = []
        for row in results:
            if not isinstance(row, dict):
                continue
            name = row.get("rider_name") or row.get("rider") or row.get("name")
            if not name:
                continue
            rider_slug = row.get("rider_url") or row.get("rider") or row.get("url") or _stable_rider_slug(str(name))
            rider_id = id_by_slug.get(rider_slug)
            if not rider_id:
                continue
            rank = row.get("rank") or row.get("position")
            try:
                rank_int = int(rank)
            except Exception:
                continue

            pts = points_for_rank(rank_int, tier, RANK_POINTS)
            rr_rows.append({"race_id": race_id, "rider_id": rider_id, "rank": rank_int, "points_awarded": pts})

        if rr_rows:
            sb.table("race_results").upsert(rr_rows, on_conflict="race_id,rider_id").execute()

    # Idempotent recompute of rider_points for the season (sum all race_results in the season year)
    start = f"{args.season_year}-01-01"
    end = f"{args.season_year}-12-31"
    # NOTE: Filtering on embedded resources (races.race_date) is not reliable across
    # PostgREST client versions. Instead: fetch race ids for the season, then filter
    # race_results by race_id.
    races_in_season = (
        sb.table("races")
        .select("id")
        .gte("race_date", start)
        .lte("race_date", end)
        .execute()
        .data
        or []
    )
    race_ids = [r["id"] for r in races_in_season if r.get("id")]
    rr: list[dict[str, Any]] = []
    if race_ids:
        start_idx = 0
        limit = 1000
        while True:
            batch = (
                sb.table("race_results")
                .select("rider_id, points_awarded")
                .in_("race_id", race_ids)
                .range(start_idx, start_idx + limit - 1)
                .execute()
                .data
                or []
            )
            rr.extend(batch)
            if len(batch) < limit:
                break
            start_idx += limit
    totals: dict[str, int] = {}
    for row in rr:
        rid = row.get("rider_id")
        pts = int(row.get("points_awarded") or 0)
        if rid:
            totals[rid] = totals.get(rid, 0) + pts

    rp_rows = [{"season_year": args.season_year, "rider_id": rid, "points": pts} for rid, pts in totals.items()]
    if rp_rows:
        sb.table("rider_points").upsert(rp_rows, on_conflict="season_year,rider_id").execute()

    # Recompute team totals for the season
    teams = sb.table("teams").select("id").eq("season_year", args.season_year).execute().data or []
    for t in teams:
        team_id = t["id"]
        roster = sb.table("team_riders").select("rider_id").eq("team_id", team_id).execute().data or []
        rids = [r["rider_id"] for r in roster]
        if not rids:
            sb.table("teams").update({"points": 0}).eq("id", team_id).execute()
            continue
        pts_rows = (
            sb.table("rider_points")
            .select("rider_id, points")
            .eq("season_year", args.season_year)
            .in_("rider_id", rids)
            .execute()
            .data
            or []
        )
        total = sum(int(r.get("points") or 0) for r in pts_rows)
        sb.table("teams").update({"points": total}).eq("id", team_id).execute()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())


