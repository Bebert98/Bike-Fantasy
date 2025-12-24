from __future__ import annotations

from typing import Any

from selectolax.parser import HTMLParser


def _clean_text(s: str) -> str:
    return " ".join((s or "").split()).strip()


def parse_race_result_table(html: str) -> list[dict[str, Any]]:
    """
    Parse a PCS one-day results page like:
      https://www.procyclingstats.com/race/milano-sanremo/2025/result

    Returns rows with at least:
      - rank (int)
      - rider_name (str)
      - rider_url (str, like 'rider/tadej-pogacar')
      - team_name (str)
    """
    tree = HTMLParser(html)
    table = tree.css_first("table")
    if table is None:
        return []

    out: list[dict[str, Any]] = []
    rows = table.css("tr") or []
    for tr in rows[1:]:
        tds = tr.css("td") or []
        if not tds:
            continue

        # Rank is usually first col
        try:
            rank = int(_clean_text(tds[0].text()))
        except Exception:
            continue

        rider_url = None
        rider_name = None
        rider_td_idx = None
        for i, td in enumerate(tds):
            a = td.css_first("a")
            if a is None:
                continue
            href = a.attributes.get("href", "")
            if href.startswith("rider/"):
                rider_url = href
                rider_td_idx = i
                rider_name = _clean_text(a.text())
                break

        if not rider_url or not rider_name:
            continue

        team_name = ""
        if rider_td_idx is not None and rider_td_idx + 1 < len(tds):
            team_name = _clean_text(tds[rider_td_idx + 1].text())

        out.append(
            {
                "rank": rank,
                "rider_name": rider_name,
                "rider_url": rider_url,
                "team_name": team_name,
            }
        )
    return out


def parse_rider_ranking_table(html: str) -> list[dict[str, Any]]:
    """
    Parse PCS rider ranking table page like:
      https://www.procyclingstats.com/rankings/me/individual

    Returns rows with:
      - rider_name, rider_url, team_name, points (int)
    """
    tree = HTMLParser(html)
    table = tree.css_first("table")
    if table is None:
        return []

    out: list[dict[str, Any]] = []
    for tr in (table.css("tr") or [])[1:]:
        tds = tr.css("td") or []
        if not tds:
            continue

        rider_url = None
        rider_name = None
        team_name = ""
        points_int = 0

        # find rider link + team link
        for td in tds:
            a = td.css_first("a")
            if a is None:
                continue
            href = a.attributes.get("href") or ""
            if href.startswith("rider/") and rider_url is None:
                rider_url = href
                rider_name = _clean_text(a.text())
            if href.startswith("team/") and not team_name:
                team_name = _clean_text(a.text())

        # points usually last numeric cell
        for td in reversed(tds):
            txt = _clean_text(td.text()).replace(",", "")
            if not txt:
                continue
            try:
                points_int = int(float(txt))
                break
            except Exception:
                continue

        if rider_url and rider_name:
            out.append(
                {
                    "rider_name": rider_name,
                    "rider_url": rider_url,
                    "team_name": team_name,
                    "points": points_int,
                }
            )
    return out


def parse_rankings_php_uci_one_day(html: str) -> list[dict[str, Any]]:
    """
    Parse PCS rankings.php pages like:
      https://www.procyclingstats.com/rankings.php?p=uci-one-day-races&...&offset=100&filter=Filter

    Table headers observed:
      ['#', 'Prev.', 'Diff.', 'Rider', 'Team', 'Points']

    Returns rows with:
      - rider_name, rider_url, team_name, points (int)
    """
    tree = HTMLParser(html)
    table = tree.css_first("table")
    if table is None:
        return []

    out: list[dict[str, Any]] = []
    for tr in (table.css("tr") or [])[1:]:
        tds = tr.css("td") or []
        if not tds:
            continue

        rider_url = None
        rider_name = None
        team_name = ""
        points_int = 0

        for td in tds:
            a = td.css_first("a")
            if a is None:
                continue
            href = a.attributes.get("href") or ""
            if href.startswith("rider/") and rider_url is None:
                rider_url = href
                rider_name = _clean_text(a.text())
            if href.startswith("team/") and not team_name:
                team_name = _clean_text(a.text())

        # Points is typically the last cell.
        if tds:
            txt = _clean_text(tds[-1].text()).replace(",", "")
            try:
                points_int = int(float(txt))
            except Exception:
                points_int = 0

        if rider_url and rider_name:
            out.append(
                {
                    "rider_name": rider_name,
                    "rider_url": rider_url,
                    "team_name": team_name,
                    "points": points_int,
                }
            )

    return out


def parse_races_php_one_day_2025(html: str) -> dict[str, dict[str, Any]]:
    """
    Parse PCS races listing page for one-day circuit:
      https://www.procyclingstats.com/races.php?year=2025&circuit=1...

    Returns mapping keyed by race_key (slug without year), values:
      - race_key
      - pcs_result_slug (e.g. 'race/milano-sanremo/2025/result')
      - name (display)
      - date (YYYY-MM-DD) best-effort from the leading dd.mm token
    """
    tree = HTMLParser(html)
    out: dict[str, dict[str, Any]] = {}
    table = tree.css_first("table")
    if table is None:
        return out

    for tr in table.css("tr") or []:
        a = tr.css_first("a")
        if a is None:
            continue
        href = a.attributes.get("href") or ""
        if not href.startswith("race/") or "/2025/" not in href:
            continue

        parts = href.split("/")
        if len(parts) < 3:
            continue
        race_key = parts[1]

        # date is first token like "22.03" in row text
        tokens = _clean_text(tr.text()).split()
        date_token = tokens[0] if tokens else ""
        date_iso = None
        if len(date_token) == 5 and date_token[2] == ".":  # dd.mm
            dd, mm = date_token.split(".")
            if dd.isdigit() and mm.isdigit():
                date_iso = f"2025-{int(mm):02d}-{int(dd):02d}"

        name = _clean_text(a.text())

        out[race_key] = {
            "race_key": race_key,
            "pcs_result_slug": href,
            "name": name,
            "date": date_iso,
        }

    return out


def parse_race_details(html: str) -> dict[str, Any]:
    """
    Parse PCS race details page (results page often has this info in header).
    Extracts 'startdate'.
    """
    tree = HTMLParser(html)
    out = {}
    
    # Try to find date in the info list
    # Snippet: <ul class="list keyvalueList fs14"> <li class=""><div class="title ">Startdate: </div><div class=" value" >2025-04-27</div></li> ...
    
    # Try multiple common selectors for robustness
    for selector in ["ul.infolist", "ul.keyvalueList", "ul.list"]:
        infolist = tree.css_first(selector)
        if infolist:
            for li in infolist.css("li"):
                title_div = li.css_first(".title")
                if title_div and "Startdate" in title_div.text():
                    val_div = li.css_first(".value")
                    if val_div:
                        out["startdate"] = _clean_text(val_div.text())
                        return out
    return out


