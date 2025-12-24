# Deployment Guide (Vercel)

The app is optimized for deployment on [Vercel](https://vercel.com), which handles both the Frontend (React) and the Serverless Back-end (API functions).

## Prerequisites

1.  **Vercel Account**: Sign up at vercel.com.
2.  **Supabase Project**: You already have this.
3.  **GitHub Repository**: Push this code to a GitHub repository.

## Step-by-Step Deployment

1.  **Import to Vercel**
    *   Go to Vercel Dashboard -> **Add New...** -> **Project**.
    *   Select your GitHub repository.

2.  **Project Configuration**
    *   **Framework Preset**: Vite (should detect automatically).
    *   **Root Directory**: `./` (Root of the repo).
    *   **Build Command**: `cd frontend && npm install && npm run build` 
        *   *Note: Since `frontend` is in a subdirectory, Vercel might auto-detect it if you set the Root Directory to `frontend`. However, our API functions are in `/api` (root). Use Root Directory = `.`.*
        *   **Better Setting**:
            *   **Root Directory**: `.`
            *   **Build Command**: `cd frontend && npm install && npm run build`
            *   **Output Directory**: `frontend/dist`

3.  **Environment Variables**
    Add the following variables in the Vercel Project Settings:

    | Variable | Value | Description |
    | :--- | :--- | :--- |
    | `REACT_APP_SUPABASE_URL` | `https://your-project.supabase.co` | From Supabase |
    | `REACT_APP_SUPABASE_ANON_KEY` | `eyJ...` | From Supabase |
    | `SUPABASE_URL` | `https://your-project.supabase.co` | *Same as above (for API)* |
    | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **Secret key** (for API) |
    | `SUPABASE_JWT_SECRET` | `super-secret-jwt` | Found in Supabase -> Settings -> API |

4.  **Deploy**
    *   Click **Deploy**.
    *   Vercel will build the frontend and deploy the `/api` functions.

## Local Development (Serverless)

To run the app locally with Serverless Functions, use the Vercel CLI:

1.  Install Vercel CLI: `npm i -g vercel`
2.  Link Project: `vercel link`
3.  Run Dev: `vercel dev`

This will start a local server (usually port 3000) that handles both the frontend and the `/api/verify-code` function.
