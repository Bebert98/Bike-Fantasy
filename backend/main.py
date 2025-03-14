from fastapi import FastAPI
from .routes import teams, leaderboard, cyclists

app = FastAPI()

app.include_router(teams.router, prefix="/teams", tags=["Teams"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(cyclists.router, prefix="/cyclists", tags=["Cyclists"])

@app.get("/")
async def root():
    return {"message": "Welcome to Cycling Fantasy API"}