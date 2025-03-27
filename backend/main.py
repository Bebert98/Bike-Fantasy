from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import riders

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, change it for production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


app.include_router(riders.router)
