## Megabike Node API (Supabase-backed)

This service replaces the old FastAPI + Mongo backend.

### Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `MEGABIKE_JWT_SECRET`
- `MEGABIKE_ADMIN_KEY` (optional; enables `/api/admin/*`)
- `PORT` (optional; default `8000`)

### Routes (consumed by the existing React app)

- `POST /api/auth/verify-code`
- `GET /api/users/me`
- `PATCH /api/users/me` (optional settings)
- `GET /api/users/me/team`
- `POST /api/users/me/team`
- `GET /api/riders/autocomplete?query=...`
- `GET /api/leaderboard/current`
- `GET /api/history`
- `GET /api/races/latest`


