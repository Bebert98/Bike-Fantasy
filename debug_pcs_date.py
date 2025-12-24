
import asyncio
from ingest.pcs_http import fetch_pcs_html
from ingest.pcs_parse import parse_race_details

async def main():
    slug = "race/omloop-het-nieuwsblad/2025"
    print(f"Fetching {slug}...")
    status, html = await fetch_pcs_html(f"https://www.procyclingstats.com/{slug}")
    print(f"Status: {status}")
    if status == 200:
        print("Parsing details...")
        details = parse_race_details(html)
        print("Parsed Details:", details)
        
        # Also print raw HTML snippet around "Startdate" to verify structure
        if "Startdate" in html:
            idx = html.find("Startdate")
            print("\nSnippet around 'Startdate':")
            print(html[idx-100:idx+200])
        else:
            print("\n'Startdate' not found in HTML.")

if __name__ == "__main__":
    asyncio.run(main())
