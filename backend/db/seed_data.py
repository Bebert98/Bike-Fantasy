from db_config import get_db
from pymongo.collection import Collection
from datetime import datetime

import procyclingstats as pcs
import pandas as pd


def seed_riders(collection: Collection):
    riders_data_list = [] 
    for idx in range(10):
        new_data = pd.DataFrame(
                pcs.Ranking(
                    f"rankings.php?date={datetime.now().year}-02-25&nation=&age=&zage=&page=smallerorequal&team=&offset={100*idx}&filter=Filter&p=me&s=uci-one-day-races"
                ).individual_ranking(
                    "rank", "rider_name", "rider_url", "points", "team_url"
                )
            )
        new_data['rank'] = new_data['rank'].astype(float)
        new_data['points'] = new_data['points'].astype(float)
        
        riders_data_list.append(new_data)

    riders_data = pd.concat(riders_data_list, ignore_index=True)

    if collection.count_documents({}) == 0:  # Avoid duplicate seeding
        collection.insert_many(riders_data.to_dict(orient='records'))
        print("✅ Riders data successfully seeded!")
    else:
        print("⚠️ Riders data already exists. Skipping seeding.")


def main():
    db = get_db()
    seed_riders(db["riders"])

    print("🎯 Database seeding completed successfully!")


if __name__ == "__main__":
    main()
