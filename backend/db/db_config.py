import os
from pymongo import MongoClient
from dotenv import load_dotenv


load_dotenv()

def get_db():
    username = os.getenv("MONGO_USERNAME")
    password = os.getenv("MONGO_PASSWORD")
    cluster = os.getenv("MONGO_CLUSTER")
    db_name = os.getenv("DB_NAME")

    connection_string = f"mongodb+srv://{username}:{password}@{cluster}/?retryWrites=true&w=majority"

    try:
        client = MongoClient(connection_string)
        return client[db_name]
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise