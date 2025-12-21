## Supabase schema + seeds (Megabike)

This folder contains **SQL you can run in Supabase** (SQL Editor) to create the Postgres schema used by the new Node API and the Python ingestion worker.

### Apply order

1. Run `schema.sql`
2. Run `seed/seasons.sql`
3. (Optional) Run `seed/access_codes_example.sql` and/or generate your own access codes

### Notes

- The app server is intended to use the **Service Role key** (server-side only) to read/write all tables.
- You can enable/adjust RLS later if you decide to query Supabase directly from the browser.


