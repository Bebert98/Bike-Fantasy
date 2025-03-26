1.	models/:
	•	This folder will contain Pydantic models and MongoDB schema-related code.
	•	Pydantic Models: Pydantic models define the shape of data being passed to/from the API.
	•	MongoDB Schema: If you define any MongoDB-specific schemas, they would live here.
Example:
	•	rider.py would define the Rider Pydantic model for validation (which you return as a response from the API).
	•	You could also have team.py if you want to define a model for the cycling team.

2.	routes/:
	•	This folder contains the API endpoints or routers that handle requests and responses.
	•	It defines the URL paths and routes, making it the interface layer of your FastAPI app.
Example:
	•	riders.py could have routes like /api/riders/autocomplete.
	•	teams.py could have routes like /api/teams/create, where a user submits their team.
3.	services/:
	•	The services layer is where you handle all the business logic. It’s abstracted from the routes layer and contains functions that interact with the database, perform calculations, etc.
	•	You can structure this to include specific logic for your models (e.g., team creation, cost calculation, etc.).
    
Example:
	•	rider_service.py: Functions like get_riders_by_name(query) for the autocomplete feature, interacting directly with MongoDB to fetch the riders.
	•	team_service.py: Functions for creating a team, calculating the total cost of the team, etc.