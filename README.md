# Mega Bike Fantasy

A fantasy cycling web application where users create teams, score points based on real-world race results, and compete on leaderboards.

## 🏗 System Architecture

The project consists of three main components:

1.  **Frontend (React + Vite)**
    *   **Location:** `/frontend`
    *   **Port:** `3000` (Docker) or `3001` (Local)
    *   **Role:** The web interface for users to manage teams, view leaderboards, and see race results.
    *   **Tech:** React, Tailwind CSS, Axios.

2.  **Backend (Node.js + Express)**
    *   **Location:** `/backend-node`
    *   **Port:** `8000`
    *   **Role:** REST API that connects the Frontend to the Supabase database. Handles user data, teams, and race info.
    *   **Tech:** Express.js, Supabase Client.

3.  **Data Ingestion (Python)**
    *   **Location:** `/ingest`
    *   **Role:** Scrapes race results from **ProCyclingStats (PCS)** and syncs them to Supabase.
    *   **Tech:** Python 3, Selectolax (HTML parsing), Supabase Python Client.

4.  **Database (Supabase/PostgreSQL)**
    *   **Role:** Stores all persistent data: Users, Teams, Races, Results, and Leaderboards.

---

## ⚙️ Configuration (.env)

Create a `.env` file in the root directory.

```ini
## Frontend
REACT_APP_API_URL=http://localhost:8000
# REACT_APP_OFFLINE=false (Set to true to use mock data)

## Node API
PORT=8000
MEGABIKE_JWT_SECRET=your_jwt_secret

## Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

## Ingestion (Optional)
# Required if ProCyclingStats blocks requests. Copy from browser cookies.
PCS_COOKIES_JSON='{"cf_clearance":"..."}'
```

---

## 🚀 How to Run the App

### Option A: Docker Compose (Recommended)
This runs both the Frontend and Backend services together.

1.  **Configure Environment**:
    *   Ensure `.env` exists in the root with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2.  **Start Services**:
    ```bash
    docker compose up --build
    ```
3.  **Access the App**:
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Backend API: [http://localhost:8000](http://localhost:8000)

### Option B: Manual Start (Development)
Run services individually for easier debugging.

**Backend:**
```bash
cd backend-node
npm install
node src/server.js
# Runs on Port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on Port 3001 (usually)
```

---

## 📊 Data Management & Updates

The application relies on accurate race data. Here is how to manage it.

### 1. Updating Race Data (Daily Sync)
To fetch the latest results from ProCyclingStats and update rider points:

```bash
# Run from root directory
python3 -m ingest.daily_sync --season-year 2025 --sync-all
```
*   **What this does**:
    1.  Reads the list of races from `references/Races.txt`.
    2.  Fetches results for each race from PCS.
    3.  Upserts race details and results to Supabase.
    4.  Recalculates points for all riders and teams.
*   **Note on Dates**: The script automatically attempts to find the race start date. If missing from the results page, it falls back to the race overview page.

### 2. Adding New Races
To add a new race to the season:
1.  Open `references/Races.txt`.
2.  Add the **PCS URL slug** of the race (e.g., `milano-sanremo` or `strade-bianche`).
3.  Run the `daily_sync` command above.

## 📂 Project Structure Breakdown

### `/frontend`
*   `src/pages/HomePage.jsx`: Main dashboard. Displays "Latest Race" and "Next Race".
*   `src/services/api.js`: All API calls (`getLatestRace`, `getNextRace`, `updateMe`, etc.).
*   `src/routes/`: Router configuration (App.jsx handles routing).

### `/backend-node`
*   `src/routes/races.js`: Endpoints for `/latest` and `/next` races.
*   `src/routes/users.js`: User profile management (`/me`).
*   `src/server.js`: Main entry point.

### `/ingest`
*   `daily_sync.py`: Main orchestration script for data updates.
*   `pcs_parse.py`: Parsing logic for scraping PCS HTML.
*   `megabike_rules.py`: Configuration for points and race tiers.

### `/supabase`
*   Contains schema definitions (managed via dashboard or migrations).