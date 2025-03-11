from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_teams():
    return [{"team_name": "Team Sky", "points": 1250}, {"team_name": "Jumbo-Visma", "points": 1100}]