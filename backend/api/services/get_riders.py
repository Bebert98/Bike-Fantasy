from api.models.rider import Rider
from db.db_config import get_db

db = get_db()
riders_collection = db["riders"]

def get_riders_by_name(query: str) -> Rider:
    """Fetch riders matching the query from MongoDB"""
    return list(riders_collection.find(
        {"rider_name": {"$regex": query, "$options": "i"}},
        {"_id": 0, "rider_name": 1, "points": 1}
    ).limit(10))