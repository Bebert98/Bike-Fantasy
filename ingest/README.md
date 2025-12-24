## Megabike ingestion worker (Python)

This worker populates Supabase using the `procyclingstats` Python package ([docs](https://procyclingstats.readthedocs.io/en/stable/index.html)).

### Env vars (server-side only)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (only if PCS blocks scraping with a challenge page):
- `PCS_COOKIE` (Cookie header string, e.g. `cf_clearance=...; ...`)
- `PCS_COOKIES_JSON` (JSON dict, e.g. `{"cf_clearance":"..."}`)

### Commands

- `python -m ingest.yearly_refresh --season-year 2026` (refresh riders + seed prices for the season)
- CSV fallback: `python -m ingest.yearly_refresh --season-year 2026 --seed-csv ingest/seed/riders_seed_example.csv`
- `python -m ingest.daily_sync --season-year 2026 --sync-all` (sync all Megabike races, recompute points, update leaderboard)
- Debug the scraper output shape: `python -m ingest.debug_dump --rider-slug rider/tadej-pogacar --race-slug race/milano-sanremo`
- Import 2025 teams from cleaned mapping CSV (creates users/access codes + teams + rosters):
  - Dry run: `python -m ingest.import_teams_cleaned_2025 --season-year 2025 --csv references/teams_cleaned_mapped.csv --dry-run`
  - Real: `python -m ingest.import_teams_cleaned_2025 --season-year 2025 --csv references/teams_cleaned_mapped.csv --seed-missing-riders --rank-date 2025-12-21`
  - Recompute/update existing imported teams: add `--overwrite`

### Notes

- The worker is designed to be **idempotent**: it upserts rows into Supabase.
- `daily_sync` currently expects a `--race-slug` input (simple and explicit). The cron can pass the latest race slug, or you can extend it to auto-discover recent races.
- If you see a LibreSSL/urllib3 warning on macOS system Python, re-run `pip install -r ingest/requirements.txt` after we pinned `urllib3<2` (or use Python 3.11+).
-
  PCS is not a public JSON API; `procyclingstats` scrapes HTML. On some networks,
  PCS responds with a Cloudflare challenge page ("Just a moment..."), which breaks parsing.
  In that case, supply `PCS_COOKIE` / `PCS_COOKIES_JSON` from a browser session, or use CSV seeding.

