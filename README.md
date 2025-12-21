Tech stack : 

	•   Front-end: React (good balance of power and simplicity) + Tailwind CSS (easy styling)
	•	Back-end: Node.js with Express (minimal boilerplate, great for APIs)
	•	Database: Supabase Postgres (replaces MongoDB)
	•	Hosting: Vercel for the front-end and Railway or Render for the back-end (easy deployment).


Key Folder Explanation

✅ /backend/api (FastAPI Code)
	•	routes/: Defines FastAPI endpoints for teams, leaderboards, etc.
	•	services/: Contains logic for handling ProCyclingStats API calls and data processing.
	•	models/: Defines data models for cyclists, teams, and users.
	•	utils/: Useful for helper functions like formatting, date handling, etc.

✅ /backend-node (Node/Express API)
	•	Production API used by the React app.
	•	Reads/writes Supabase using the Service Role key (server-side only).

✅ /frontend (React Code)
	•	/components/: Reusable UI components.
	•	/pages/: Page-level components for routing.
	•	/services/: Manages API calls to the Node API backend.

✅ /db/ (Database Utilities)
	•	db_config.py: Connects MongoDB to the Python backend.
	•	init_db.py: Initializes database with schemas.
	•	seed_data.py: Adds sample data to simplify testing.

Note: `/backend` + `/db` are legacy MongoDB-era utilities and are deprecated.

✅ /supabase (SQL schema + seeds)
	•	schema.sql: Postgres schema for Megabike
	•	seed/: Hall of Fame podium history, example access codes

✅ docker-compose.yml
	•	Simplifies local development by running Node API + React (Supabase is external).

✅ .env
	•	Keeps sensitive data like API keys, MongoDB URIs, and secret keys secure.

✅ uvicorn_start.sh
	•	A simple shell script for launching FastAPI server with uvicorn (handy for Docker deployment).

Environment template: `env.example`