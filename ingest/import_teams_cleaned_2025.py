from __future__ import annotations

import argparse
import csv
import hashlib
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from .supabase_client import get_supabase
from .pcs_http import fetch_pcs_html
from .pcs_parse import parse_rankings_php_uci_one_day


def _stable_access_code(owner: str) -> str:
    """
    Deterministic access code per owner so reruns don't create duplicates.
    """
    owner_norm = (owner or "").strip().casefold().encode("utf-8")
    h = hashlib.sha1(owner_norm).hexdigest()[:10]
    return f"MB2025-{h}"


def _chunk(items: list[str], size: int = 200) -> Iterable[list[str]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


@dataclass(frozen=True)
class TeamKey:
    team_name: str
    owner: str


@dataclass
class TeamRow:
    team_name: str
    owner: str
    slot: int
    rider_slug: str
    price_hint: int


def _read_csv_rows(path: str) -> list[TeamRow]:
    p = Path(path)
    rows: list[TeamRow] = []
    with p.open("r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if not r:
                continue
            team_name = (r.get("team_name") or "").strip()
            owner = (r.get("owner") or "").strip()
            pos = (r.get("position") or "").strip()
            rider = (r.get("standardized_rider") or "").strip()
            pts = (r.get("points") or "").strip()
            if not team_name or not owner or not pos or not rider:
                continue
            try:
                slot = int(float(pos))
            except Exception:
                continue
            try:
                price_hint = int(float(pts)) if pts != "" else 0
            except Exception:
                price_hint = 0
            rows.append(TeamRow(team_name=team_name, owner=owner, slot=slot, rider_slug=rider, price_hint=price_hint))
    return rows


def _default_rank_date(season_year: int) -> str:
    # Keep this aligned with the date you used to seed prices/riders for 2025.
    if season_year == 2025:
        return "2025-12-21"
    return __import__("datetime").date.today().isoformat()


async def _seed_missing_riders_and_prices(
    sb,
    season_year: int,
    missing_slugs: list[str],
    rank_date: str,
    dry_run: bool,
) -> None:
    """
    Seed missing riders into `riders` and `rider_prices` using PCS:
    - Fetch UCI one-day ranking search results to get the rider row (points used as price).
    - Insert into riders with pcs_slug and rider_name/team_name if found.
    """
    if not missing_slugs:
        return
    if dry_run:
        return

    for slug in missing_slugs:
        # Query the rankings table with a search term derived from slug tail.
        term = slug.split("/", 1)[1] if "/" in slug else slug
        term = term.replace("-", " ")
        url = (
            "https://www.procyclingstats.com/rankings.php?"
            f"p=uci-one-day-races&s={term}&date={rank_date}&nation=&age=&page=smallerorequal&team=&offset=0&filter=Filter"
        )
        status, html = await fetch_pcs_html(url)
        if status != 200:
            continue
        rows = parse_rankings_php_uci_one_day(html)
        row = next((r for r in rows if r.get("rider_url") == slug), None)

        rider_name = None
        team_name = None
        points_int = 0
        if row:
            rider_name = row.get("rider_name")
            team_name = row.get("team_name")
            try:
                points_int = int(row.get("points") or 0)
            except Exception:
                points_int = 0

        # If ranking search didn’t return the exact rider, fall back to scraping rider page name.
        if not rider_name:
            rider_url = f"https://www.procyclingstats.com/{slug}"
            s2, html2 = await fetch_pcs_html(rider_url)
            if s2 == 200:
                # Very lightweight parse: extract <h1> inside page-title
                from selectolax.parser import HTMLParser

                tree = HTMLParser(html2)
                h1 = tree.css_first(".page-title h1")
                if h1 is not None:
                    rider_name = " ".join(h1.text().split())
                # Also try to extract UCI points as a fallback for pricing.
                m2 = re.search(r"UCI points:\\s*<b>\\s*([0-9]{1,6})", html2)
                if m2:
                    try:
                        points_int = int(m2.group(1))
                    except Exception:
                        pass
            if not rider_name:
                rider_name = slug

        # Insert rider if still missing
        exists = sb.table("riders").select("id").eq("pcs_slug", slug).limit(1).execute().data or []
        if not exists:
            sb.table("riders").insert(
                {
                    "pcs_slug": slug,
                    "rider_name": rider_name,
                    "team_name": team_name,
                    "nationality": None,
                    "active": True,
                }
            ).execute()

        rid_row = sb.table("riders").select("id").eq("pcs_slug", slug).limit(1).execute().data or []
        if not rid_row:
            continue
        rider_id = rid_row[0]["id"]

        # Price rule in this project: price == UCI one-day points
        sb.table("rider_prices").upsert(
            {"season_year": season_year, "rider_id": rider_id, "price": points_int},
            on_conflict="season_year,rider_id",
        ).execute()


def _group_teams(rows: list[TeamRow]) -> dict[TeamKey, list[TeamRow]]:
    grouped: dict[TeamKey, list[TeamRow]] = defaultdict(list)
    for r in rows:
        grouped[TeamKey(team_name=r.team_name, owner=r.owner)].append(r)
    # sort each roster by slot
    for k in list(grouped.keys()):
        grouped[k] = sorted(grouped[k], key=lambda x: x.slot)
    return grouped


def _get_or_create_access_code(sb, owner: str, dry_run: bool) -> str:
    code = _stable_access_code(owner)
    existing = sb.table("access_codes").select("id, code").eq("code", code).limit(1).execute().data or []
    if existing:
        return existing[0]["id"]
    if dry_run:
        return "DRY_RUN_ACCESS_CODE_ID"
    sb.table("access_codes").insert({"code": code, "is_active": True}).execute()
    created = sb.table("access_codes").select("id").eq("code", code).limit(1).execute().data or []
    if not created:
        raise RuntimeError("Failed to create access code")
    return created[0]["id"]


def _get_or_create_user(sb, owner: str, access_code_id: str, dry_run: bool) -> str:
    existing = sb.table("users").select("id").eq("access_code_id", access_code_id).limit(1).execute().data or []
    if existing:
        return existing[0]["id"]
    if dry_run:
        return "DRY_RUN_USER_ID"
    sb.table("users").insert({"access_code_id": access_code_id, "display_name": owner}).execute()
    created = sb.table("users").select("id").eq("access_code_id", access_code_id).limit(1).execute().data or []
    if not created:
        raise RuntimeError("Failed to create user")
    return created[0]["id"]


def _team_exists(sb, user_id: str, season_year: int) -> dict[str, Any] | None:
    existing = (
        sb.table("teams")
        .select("id, team_name, season_year, total_cost, points")
        .eq("user_id", user_id)
        .eq("season_year", season_year)
        .limit(1)
        .execute()
        .data
        or []
    )
    return existing[0] if existing else None


def _upsert_team(sb, user_id: str, season_year: int, team_name: str, dry_run: bool) -> str:
    if dry_run:
        return "DRY_RUN_TEAM_ID"
    sb.table("teams").upsert(
        {
            "user_id": user_id,
            "season_year": season_year,
            "team_name": team_name,
            "locked": True,
        },
        on_conflict="user_id,season_year",
    ).execute()
    row = (
        sb.table("teams")
        .select("id")
        .eq("user_id", user_id)
        .eq("season_year", season_year)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not row:
        raise RuntimeError("Failed to upsert team")
    return row[0]["id"]


def _replace_roster(sb, team_id: str, roster: list[tuple[int, str]], dry_run: bool) -> None:
    """
    roster: list of (slot, rider_id)
    """
    if dry_run:
        return
    sb.table("team_riders").delete().eq("team_id", team_id).execute()
    rows = [{"team_id": team_id, "slot": slot, "rider_id": rid} for slot, rid in roster]
    if rows:
        sb.table("team_riders").insert(rows).execute()


def _compute_totals(sb, season_year: int, rider_ids: list[str]) -> tuple[int, int, list[str]]:
    """
    Returns (total_cost, total_points, warnings)
    Missing prices/points are treated as 0 with warnings.
    """
    warnings: list[str] = []
    if not rider_ids:
        return 0, 0, warnings

    prices = (
        sb.table("rider_prices")
        .select("rider_id, price")
        .eq("season_year", season_year)
        .in_("rider_id", rider_ids)
        .execute()
        .data
        or []
    )
    price_by = {p["rider_id"]: int(p.get("price") or 0) for p in prices}
    missing_price = [rid for rid in rider_ids if rid not in price_by]
    if missing_price:
        warnings.append(f"missing_prices={len(missing_price)}")

    pts = (
        sb.table("rider_points")
        .select("rider_id, points")
        .eq("season_year", season_year)
        .in_("rider_id", rider_ids)
        .execute()
        .data
        or []
    )
    points_by = {p["rider_id"]: int(p.get("points") or 0) for p in pts}
    missing_pts = [rid for rid in rider_ids if rid not in points_by]
    if missing_pts:
        warnings.append(f"missing_points={len(missing_pts)}")

    total_cost = sum(price_by.get(rid, 0) for rid in rider_ids)
    total_points = sum(points_by.get(rid, 0) for rid in rider_ids)
    return total_cost, total_points, warnings


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--season-year", type=int, default=2025)
    ap.add_argument("--csv", type=str, default="references/teams_cleaned_mapped.csv")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-existing", action="store_true", default=True)
    ap.add_argument("--overwrite", action="store_true", help="Replace roster + totals even if a team already exists.")
    ap.add_argument("--max-riders", type=int, default=12)
    ap.add_argument("--min-riders", type=int, default=5)
    ap.add_argument(
        "--seed-missing-riders",
        action="store_true",
        help="If riders referenced in CSV are missing from Supabase, fetch from PCS and insert minimal rider + price.",
    )
    ap.add_argument("--rank-date", type=str, default=None, help="Rankings date for price seeding (YYYY-MM-DD).")
    args = ap.parse_args()

    sb = get_supabase()
    rows = _read_csv_rows(args.csv)
    grouped = _group_teams(rows)

    # Resolve rider_id by pcs_slug for all riders referenced in CSV
    slugs = sorted({r.rider_slug for r in rows})
    # For pricing fallback only: take the maximum provided hint per slug (safe if repeated).
    price_hint_by_slug: dict[str, int] = {}
    for r in rows:
        cur = price_hint_by_slug.get(r.rider_slug, 0)
        if r.price_hint > cur:
            price_hint_by_slug[r.rider_slug] = r.price_hint
    rider_id_by_slug: dict[str, str] = {}
    for batch in _chunk(slugs, 200):
        found = sb.table("riders").select("id, pcs_slug").in_("pcs_slug", batch).execute().data or []
        for r in found:
            rider_id_by_slug[str(r["pcs_slug"])] = str(r["id"])

    missing_slugs = [s for s in slugs if s not in rider_id_by_slug]
    if missing_slugs and args.seed_missing_riders:
        rank_date = args.rank_date or _default_rank_date(args.season_year)
        await _seed_missing_riders_and_prices(sb, args.season_year, missing_slugs, rank_date, args.dry_run)
        # re-resolve after seeding
        rider_id_by_slug = {}
        for batch in _chunk(slugs, 200):
            found = sb.table("riders").select("id, pcs_slug").in_("pcs_slug", batch).execute().data or []
            for r in found:
                rider_id_by_slug[str(r["pcs_slug"])] = str(r["id"])
        missing_slugs = [s for s in slugs if s not in rider_id_by_slug]

    if missing_slugs:
        print(f"Missing riders in Supabase (by pcs_slug): {len(missing_slugs)}")
        for s in missing_slugs[:80]:
            print(f"- {s}")
        raise SystemExit(2)

    # Ensure every referenced rider has a season price (required for budget/cost totals).
    # If a rider is missing from ranking-based seeding, fall back to CSV 'points' column as price.
    if not args.dry_run:
        all_rider_ids = list({rid for rid in rider_id_by_slug.values() if rid})
        existing_price_by_id: dict[str, int] = {}
        for batch in _chunk(all_rider_ids, 200):
            existing = (
                sb.table("rider_prices")
                .select("rider_id, price")
                .eq("season_year", args.season_year)
                .in_("rider_id", batch)
                .execute()
                .data
                or []
            )
            for row in existing:
                if row.get("rider_id"):
                    existing_price_by_id[row["rider_id"]] = int(row.get("price") or 0)

        # Backfill any missing price rows, and also replace price=0 when we have a better hint from CSV.
        for s in slugs:
            rid = rider_id_by_slug[s]
            hint = int(price_hint_by_slug.get(s, 0) or 0)
            existing_price = existing_price_by_id.get(rid)
            if existing_price is not None and (existing_price > 0 or hint == 0):
                continue
            sb.table("rider_prices").upsert(
                {"season_year": args.season_year, "rider_id": rid, "price": hint},
                on_conflict="season_year,rider_id",
            ).execute()

    # Import teams
    created = 0
    skipped_existing = 0
    warnings_count = 0

    for k, roster_rows in grouped.items():
        # Validate roster constraints
        slots = [r.slot for r in roster_rows]
        if len(set(slots)) != len(slots):
            raise SystemExit(f"Duplicate slot in roster: {k.team_name} / {k.owner}")

        # map to rider ids
        roster: list[tuple[int, str]] = []
        for r in roster_rows:
            rid = rider_id_by_slug.get(r.rider_slug)
            if not rid:
                raise SystemExit(f"Missing rider slug {r.rider_slug} for team {k.team_name}/{k.owner}")
            roster.append((r.slot, rid))

        # enforce 11–12 riders (configurable)
        if len(roster) < args.min_riders or len(roster) > args.max_riders:
            print(f"Skipping {k.team_name}/{k.owner}: roster size {len(roster)} not in [{args.min_riders},{args.max_riders}]")
            continue

        # Ensure deterministic owner user
        access_code_id = _get_or_create_access_code(sb, k.owner, args.dry_run)
        user_id = _get_or_create_user(sb, k.owner, access_code_id, args.dry_run)

        existing = None if args.dry_run else _team_exists(sb, user_id, args.season_year)
        if existing and args.skip_existing and not args.overwrite:
            skipped_existing += 1
            continue

        team_id = _upsert_team(sb, user_id, args.season_year, k.team_name, args.dry_run)

        # Replace roster
        roster_sorted = sorted(roster, key=lambda x: x[0])[: args.max_riders]
        _replace_roster(sb, team_id, roster_sorted, args.dry_run)

        # Compute totals
        rider_ids = [rid for _, rid in roster_sorted]
        total_cost, total_points, warns = _compute_totals(sb, args.season_year, rider_ids)
        if warns:
            warnings_count += 1
        if not args.dry_run:
            sb.table("teams").update({"total_cost": total_cost, "points": total_points}).eq("id", team_id).execute()
        created += 1

    print(
        f"teams_processed={len(grouped)} created_or_updated={created} "
        f"skipped_existing={skipped_existing} teams_with_warnings={warnings_count} dry_run={args.dry_run}"
    )


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())


