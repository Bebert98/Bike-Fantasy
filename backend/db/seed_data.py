from db_config import get_db  

def seed_riders(collection):
    riders_data = [
        {"first_name": "John", "last_name": "Doe", "age": 28, "uci_points": 240.5, "url": "https://johncycling.com"},
        {"first_name": "Alice", "last_name": "Smith", "age": 31, "uci_points": 315.8, "url": "https://alicesmith.com"},
        {"first_name": "Mark", "last_name": "Johnson", "age": 24, "uci_points": 150.0, "url": "https://markjohnson.com"}
    ]

    if collection.count_documents({}) == 0:  # Avoid duplicate seeding
        collection.insert_many(riders_data)
        print("✅ Riders data successfully seeded!")
    else:
        print("⚠️ Riders data already exists. Skipping seeding.")


def main():
    db = get_db()

    seed_riders(db["riders"])

    print("🎯 Database seeding completed successfully!")

if __name__ == "__main__":
    main()