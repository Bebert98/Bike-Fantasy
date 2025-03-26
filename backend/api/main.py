from fastapi import FastAPI
from .routes import riders

app = FastAPI()

app.include_router(riders.router)
