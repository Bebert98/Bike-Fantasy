Tech stack : 

	•   Front-end: React (good balance of power and simplicity) + Tailwind CSS (easy styling)
	•	Back-end: Node.js with Express (minimal boilerplate, great for APIs)
	•	Database: MongoDB (flexible, beginner-friendly)
	•	Hosting: Vercel for the front-end and Railway or Render for the back-end (easy deployment).


Key Folder Explanation

✅ /backend/api (FastAPI Code)
	•	routes/: Defines FastAPI endpoints for teams, leaderboards, etc.
	•	services/: Contains logic for handling ProCyclingStats API calls and data processing.
	•	models/: Defines data models for cyclists, teams, and users.
	•	utils/: Useful for helper functions like formatting, date handling, etc.

✅ /frontend (React Code)
	•	/components/: Reusable UI components.
	•	/pages/: Page-level components for routing.
	•	/services/: Manages API calls to FastAPI backend.

✅ /db/ (Database Utilities)
	•	db_config.py: Connects MongoDB to the Python backend.
	•	init_db.py: Initializes database with schemas.
	•	seed_data.py: Adds sample data to simplify testing.

✅ docker-compose.yml
	•	Simplifies local development by running FastAPI, Node.js, and MongoDB services in separate containers.

✅ .env
	•	Keeps sensitive data like API keys, MongoDB URIs, and secret keys secure.

✅ uvicorn_start.sh
	•	A simple shell script for launching FastAPI server with uvicorn (handy for Docker deployment).