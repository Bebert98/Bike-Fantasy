from __future__ import annotations

from supabase import create_client

from .env import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL


def get_supabase():
    # Service role key (server-side only)
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


