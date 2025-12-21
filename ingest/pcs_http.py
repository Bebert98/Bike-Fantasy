from __future__ import annotations

import json
from typing import Any

import httpx

from .env import PCS_COOKIE, PCS_COOKIES_JSON


def _parse_cookie_header(cookie_header: str) -> dict[str, str]:
    """
    Parse a simple Cookie header string like:
      "a=b; c=d"
    into {"a": "b", "c": "d"}.
    """
    out: dict[str, str] = {}
    for part in (cookie_header or "").split(";"):
        p = part.strip()
        if not p or "=" not in p:
            continue
        k, v = p.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def pcs_cookies() -> dict[str, str]:
    """
    Optional cookies for fetching PCS HTML.
    Useful when PCS serves a Cloudflare challenge to non-browser clients.
    """
    if PCS_COOKIES_JSON:
        try:
            parsed: Any = json.loads(PCS_COOKIES_JSON)
            if isinstance(parsed, dict):
                return {str(k): str(v) for k, v in parsed.items()}
        except Exception:
            return {}
    if PCS_COOKIE:
        return _parse_cookie_header(PCS_COOKIE)
    return {}


async def fetch_pcs_html(relative_or_absolute_url: str) -> tuple[int, str]:
    """
    Fetch PCS HTML with basic browser-like headers and optional cookies.
    Returns (status_code, html_text).
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    cookies = pcs_cookies()

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(30.0, connect=30.0),
        headers=headers,
        cookies=cookies,
    ) as client:
        r = await client.get(relative_or_absolute_url)
        return r.status_code, r.text


