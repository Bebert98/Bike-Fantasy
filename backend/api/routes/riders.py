from fastapi import APIRouter, Query
from typing import List
from api.services.get_riders import get_riders_by_name
from api.models.rider import Rider

router = APIRouter()

@router.get("/api/riders/autocomplete", response_model=List[Rider])
async def autocomplete_riders(query: str = Query(..., min_length=2)):
    """Autocomplete riders by name and fetch their points"""
    return get_riders_by_name(query)