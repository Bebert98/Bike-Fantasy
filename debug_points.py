from ingest.supabase_client import get_supabase
import json

def debug_pogacar():
    sb = get_supabase()
    
    print("--- Searching for Pogacar ---")
    # 1. Find Pogacar
    riders = sb.table("riders").select("*").ilike("rider_name", "%Tadej%").execute().data
    if not riders:
        print("Pogacar not found")
        return
    
    pogi = riders[0]
    print(f"Rider: {pogi['rider_name']} (ID: {pogi['id']})")
    
    # 2. Get 2025 results
    print("\n--- Race Results in DB ---")
    # Note: select(..., count='exact') not directly supported in this client wrapper usually, but simple select works
    results = sb.table("race_results").select("*, races(name, race_date, pcs_slug)").eq("rider_id", pogi['id']).execute().data
    
    total_calc = 0
    for r in results:
        pts = r['points_awarded']
        race = r.get('races') or {}
        race_name = race.get('name') or "Unknown"
        race_date = race.get('race_date') or "Unknown"
        slug = race.get('pcs_slug') or "Unknown"
        
        print(f" - {race_date} {race_name} ({slug}): Rank {r['rank']} -> {pts} pts")
        
        # Check if race is in 2025
        if str(race_date).startswith('2025'):
            total_calc += pts
            
    print(f"\nCalculated Total (2025 races only): {total_calc}")
    
    # 3. Get stored points
    print("\n--- Stored RiderPoints table ---")
    rp = sb.table("rider_points").select("*").eq("rider_id", pogi['id']).eq("season_year", 2025).execute().data
    if rp:
        print(f"Stored RiderPoints (2025): {rp[0]['points']}")
    else:
        print("No entry in rider_points for 2025")

if __name__ == "__main__":
    debug_pogacar()
