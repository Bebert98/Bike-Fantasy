# Mega Bike Fantasy

A fantasy cycling web application where users create teams, score points based on real-world race results, and compete on leaderboards.

## 🏗 Architecture (Serverless)

The project uses a **Serverless Architecture**:

1.  **Frontend**: React + Vite (communicates directly with Supabase via `@supabase/supabase-js`).
2.  **Auth**: Vercel Serverless Function (`/api/verify-code`) validates Access Codes and issues secure JWTs.
3.  **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) to protect data.
4.  **Ingestion**: Python scripts (`/ingest`) run periodically (e.g., via GitHub Actions) to sync race data.

## 🚀 How to Run Locally

### Option 1: Vercel CLI (Recommended)
This emulates the production environment (Frontend + API Functions).

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run:
    ```bash
    vercel dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000).

### Option 2: Frontend Only (No Login)
If you only need to work on the UI and don't need to log in (or use offline mode):

```bash
cd frontend
npm run dev
```

---

## ⚙️ Configuration (.env)

Create a `.env` file in the root.

```ini
## Supabase (Public)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=public-anon-key

## Supabase (Secrets - Serverless Only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_JWT_SECRET=jwt-secret-from-supabase

## Ingestion (Python)
# Optional: PCS Cookies if scraping is blocked
PCS_COOKIES_JSON='{"cf_clearance":"..."}'
```

---

## 📂 Project Structure

*   `/api`: Serverless functions (e.g., `verify-code.js`).
*   `/frontend`: React application.
*   `/ingest`: Python data collection scripts.
*   `/supabase`: SQL schemas and policies.