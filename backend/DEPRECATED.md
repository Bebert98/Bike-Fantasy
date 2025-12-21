## Deprecated backend (FastAPI + MongoDB)

This folder is retained only for historical reference.

Megabike’s active stack is now:
- `Bike-Fantasy/backend-node/` (Node/Express API)
- `Bike-Fantasy/supabase/` (Postgres schema + seeds)
- `Bike-Fantasy/ingest/` (Python ingestion worker using `procyclingstats`)

`docker-compose.yml` is configured to run the Node API, not this FastAPI app.


