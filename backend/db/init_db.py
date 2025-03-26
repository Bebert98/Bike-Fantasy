from db_config import get_db

db = get_db()

db.create_collection("riders", validator={
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["first_name", "last_name", "age", "uci_points", "url"],
        "properties": {
            "first_name": {"bsonType": "string", "description": "Must be a string"},
            "last_name": {"bsonType": "string", "description": "Must be a string"},
            "age": {
                "bsonType": "int",
                "minimum": 18,
                "description": "Must be an integer greater than or equal to 18"
            },
            "uci_points": {"bsonType": "double", "description": "Must be a float (double) value"},
            "url": {
                "bsonType": "string",
                "description": "Must be a valid URL starting with 'http://' or 'https://'"
            }
        }
    }
})

print("Collection with schema successfully created!")