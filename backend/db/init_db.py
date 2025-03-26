from db_config import get_db

db = get_db()

db.create_collection("riders", validator={
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["rider_name", "rank", "points", "rider_url", "team_url"],
        "properties": {
            "rider_name": {"bsonType": "string", "description": "Must be a string"},
            "rank": {"bsonType": "double", "description": "Must be a float"},
            "points": {"bsonType": "double", "description": "Must be a float (double) value"},
            "rider_url": {
                "bsonType": "string",
                "description": "Must be a valid URL starting with 'http://' or 'https://'"
            },
            "team_url": {
                "bsonType": "string",
                "description": "Must be a valid URL starting with 'http://' or 'https://'"
            }
        }
    }
})

print("Collection with schema successfully created!")