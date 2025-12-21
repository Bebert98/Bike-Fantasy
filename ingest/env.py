import os

from dotenv import load_dotenv


load_dotenv()


def require_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing required env var: {name}")
    return v


SUPABASE_URL = require_env("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = require_env("SUPABASE_SERVICE_ROLE_KEY")

# Optional: if PCS blocks scraping (Cloudflare), you can supply a browser
# clearance cookie. Format examples:
# - "cf_clearance=...; other=..."
# - JSON: {"cf_clearance":"...","other":"..."} (if PCS_COOKIES_JSON set)
PCS_COOKIE = os.getenv("PCS_COOKIE", "")
PCS_COOKIES_JSON = os.getenv("PCS_COOKIES_JSON", "")


