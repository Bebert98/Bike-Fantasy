# Deployment Guide

This app is split into two parts that need to be deployed separately:
1.  **Backend API** (Node.js/Express) -> Deploy to **Render**
2.  **Frontend** (React/Vite) -> Deploy to **Vercel**

---

## Part 1: Deploy Backend (Render)

We deploy the backend first because the frontend needs the backend's URL.

1.  **Create Account**: Go to [render.com](https://render.com) and sign up/login.
2.  **New Web Service**: Click **New +** -> **Web Service**.
3.  **Connect Repo**: Connect your GitHub repository.
4.  **Configure Service**:
    *   **Root Directory**: `backend-node` (Important!)
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/server.js`
5.  **Environment Variables**:
    *   Scroll down to **Advanced** -> **Environment Variables**. Add these keys from your local `.env`:
        *   `SUPABASE_URL`: (Your Supabase URL)
        *   `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase Service Role Key)
        *   `MEGABIKE_JWT_SECRET`: (A random secret string)
    *   *Note: Render automatically creates a `PORT` variable, so you don't need to add it.*
6.  **Deploy**: Click **Create Web Service**.
7.  **Get URL**: Once deployed, copy the **onrender.com URL** (e.g., `https://megabike-api.onrender.com`). You will need this for the frontend.

---

## Part 2: Deploy Frontend (Vercel)

1.  **Create Account**: Go to [vercel.com](https://vercel.com) and sign up/login.
2.  **Add New Project**: Click **Add New...** -> **Project**.
3.  **Import Repo**: Import your `Bike-Fantasy` repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vite (should detect automatically).
    *   **Root Directory**: Click **Edit** and select `frontend`.
5.  **Environment Variables**:
    *   Add the following variable:
        *   `REACT_APP_API_URL`: Paste your **Backend URL** from Part 1 (e.g., `https://megabike-api.onrender.com`).
6.  **Deploy**: Click **Deploy**.

---

## Part 3: Database & Ingestion

*   **Database**: Your Supabase database is already in the cloud, so no action is needed there.
*   **Ingestion (Updates)**:
    *   Currently, the ingestion script (`ingest/daily_sync.py`) runs locally on your machine.
    *   **To run in cloud**: You can set up a **Cron Job** on Render pointing to the `ingest` folder, but that requires setting up Python.
    *   **Simplest for now**: Continue running the sync script locally from your terminal (`python -m ingest.daily_sync ...`) whenever you want to update race results.
