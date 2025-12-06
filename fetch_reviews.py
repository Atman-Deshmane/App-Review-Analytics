"""
fetch_reviews.py - App Review Fetcher with Scan & Filter Strategy

Fetches app metadata and reviews from Google Play Store using a chronological
"Scan & Filter" approach to solve the missing reviews date issue.
"""

import argparse
import json
import os
from datetime import datetime, timedelta
from google_play_scraper import Sort, reviews, app
import pandas as pd

# ============== CONFIGURATION ==============
DEFAULT_APP_ID = 'com.nextbillion.groww'
DEFAULT_COUNT = 200
DEFAULT_WEEKS_BACK = 2
COUNTRY = 'in'
LANGUAGE = 'en'

# Fetch Strategy Config
BATCH_SIZE = 500
MAX_FETCH_SAFEGUARD = 5000

# ============== PART A: APP METADATA ==============

def fetch_app_metadata(app_id: str) -> dict | None:
    """
    Fetches high-level app metadata (logo, title, developer, etc.)
    and saves it to app_metadata.json.
    """
    print(f"[METADATA] Fetching app details for {app_id}...")
    try:
        details = app(app_id, lang=LANGUAGE, country=COUNTRY)
        
        metadata = {
            "appId": details.get("appId"),
            "title": details.get("title"),
            "summary": details.get("summary"),
            "icon": details.get("icon"),
            "developer": details.get("developer"),
            "score": details.get("score"),
            "installs": details.get("realInstalls") or details.get("installs"),
            "fetchedAt": datetime.now().isoformat()
        }
        
        # Save to file
        with open("app_metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"[METADATA] ✅ App metadata saved to app_metadata.json")
        print(f"[METADATA] App: {metadata['title']} | Rating: {metadata['score']} | Installs: {metadata['installs']}")
        return metadata
        
    except Exception as e:
        print(f"[METADATA] ⚠️ Warning: Failed to fetch app metadata: {e}")
        print("[METADATA] Proceeding with review fetch...")
        return None


# ============== PART B: REVIEW FETCH (SCAN STRATEGY) ==============

def fetch_reviews_chronologically(app_id: str, start_date: datetime, end_date: datetime) -> list:
    """
    Fetches reviews using Sort.NEWEST and paginates backward until:
    - The oldest review in a batch is older than start_date, OR
    - MAX_FETCH_SAFEGUARD is hit.
    
    Returns a list of raw review dicts.
    """
    print(f"\n[FETCH] Starting chronological scan for {app_id}")
    print(f"[FETCH] Target window: {start_date.date()} to {end_date.date()}")
    print(f"[FETCH] Using batch size: {BATCH_SIZE}, max safeguard: {MAX_FETCH_SAFEGUARD}")
    
    all_reviews = []
    continuation_token = None
    batch_num = 0
    
    while len(all_reviews) < MAX_FETCH_SAFEGUARD:
        batch_num += 1
        print(f"[FETCH] Batch {batch_num}: Fetching {BATCH_SIZE} reviews...")
        
        try:
            result, continuation_token = reviews(
                app_id,
                lang=LANGUAGE,
                country=COUNTRY,
                sort=Sort.NEWEST,
                count=BATCH_SIZE,
                continuation_token=continuation_token
            )
        except Exception as e:
            print(f"[FETCH] ❌ Error fetching batch {batch_num}: {e}")
            break
        
        if not result:
            print(f"[FETCH] No more reviews available. Stopping.")
            break
        
        all_reviews.extend(result)
        
        # Check oldest review in this batch
        oldest_in_batch = min(r['at'] for r in result)
        newest_in_batch = max(r['at'] for r in result)
        print(f"[FETCH] Batch {batch_num}: Got {len(result)} reviews ({oldest_in_batch.date()} to {newest_in_batch.date()})")
        
        # Stop condition: if oldest review is before our start_date
        if oldest_in_batch < start_date:
            print(f"[FETCH] ✅ Reached reviews older than {start_date.date()}. Stopping scan.")
            break
        
        # No more pages
        if not continuation_token:
            print(f"[FETCH] No continuation token. Reached end of reviews.")
            break
    
    print(f"[FETCH] Total raw reviews collected: {len(all_reviews)}")
    return all_reviews


# ============== PART C: LOCAL PROCESSING (FILTER & RANK) ==============

def process_and_save(raw_reviews: list, start_date: datetime, end_date: datetime, target_count: int) -> None:
    """
    Filters, ranks, and saves reviews to CSV.
    
    1. Filter: Keep only reviews within [start_date, end_date]
    2. Rank: Sort by thumbsUpCount (desc) + date (desc)
    3. Cut: Slice to top N (target_count)
    4. Save: Output to temp_reviews_raw.csv with exact schema
    """
    if not raw_reviews:
        print("[PROCESS] ❌ No reviews to process.")
        return
    
    print(f"\n[PROCESS] Processing {len(raw_reviews)} raw reviews...")
    
    # Convert to DataFrame
    df = pd.DataFrame(raw_reviews)
    
    # Ensure date is datetime
    df['at'] = pd.to_datetime(df['at'])
    
    # Step 1: Filter by date range (inclusive)
    # End date should include the full day
    end_date_inclusive = end_date + timedelta(days=1) - timedelta(seconds=1)
    
    df_filtered = df[(df['at'] >= start_date) & (df['at'] <= end_date_inclusive)]
    print(f"[PROCESS] After date filter: {len(df_filtered)} reviews (window: {start_date.date()} to {end_date.date()})")
    
    if df_filtered.empty:
        print("[PROCESS] ❌ No reviews in the specified date range.")
        return
    
    # Step 2: Rank by thumbsUpCount (desc) + date (desc)
    df_ranked = df_filtered.sort_values(
        by=['thumbsUpCount', 'at'],
        ascending=[False, False]
    ).reset_index(drop=True)
    
    # Step 3: Cut to target count
    df_top = df_ranked.head(target_count).reset_index(drop=True)
    print(f"[PROCESS] After top-N cut: {len(df_top)} reviews (target: {target_count})")
    
    # Step 4: Format for output (match exact schema)
    # Columns: date (YYYY-MM-DD HH:MM:SS), rating (int), review_text (string), thumbs_up_count (int), title (string/null)
    
    # Handle title column safely
    title_col = df_top['title'] if 'title' in df_top.columns else [None] * len(df_top)
    
    df_output = pd.DataFrame({
        'date': df_top['at'].dt.strftime('%Y-%m-%d %H:%M:%S'),
        'rating': df_top['score'].astype(int),
        'review_text': df_top['content'],
        'thumbs_up_count': df_top['thumbsUpCount'].astype(int),
        'title': title_col
    })
    
    # Save to CSV
    output_file = 'temp_reviews_raw.csv'
    df_output.to_csv(output_file, index=False)
    
    # Final Stats
    print("\n" + "=" * 50)
    print("📊 DATA FETCH STATS")
    print("=" * 50)
    print(f"  Total Raw Fetched:  {len(raw_reviews)}")
    print(f"  After Date Filter:  {len(df_filtered)}")
    print(f"  Final Saved Count:  {len(df_output)}")
    print(f"  Date Range:         {df_output['date'].iloc[-1]} to {df_output['date'].iloc[0]}")
    print(f"  Max Thumbs Up:      {df_output['thumbs_up_count'].max()}")
    print("=" * 50)
    print(f"✅ Saved to {output_file}")


# ============== MAIN ENTRY POINT ==============

def main():
    parser = argparse.ArgumentParser(description='Fetch reviews from Google Play Store.')
    parser.add_argument('--app_id', type=str, default=DEFAULT_APP_ID, help='Application ID (Package Name)')
    parser.add_argument('--count', type=int, default=DEFAULT_COUNT, help='Target number of reviews to save')
    parser.add_argument('--start_date', type=str, help='Start Date (YYYY-MM-DD)')
    parser.add_argument('--end_date', type=str, help='End Date (YYYY-MM-DD)')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"🚀 APP REVIEW FETCHER - Scan & Filter Strategy")
    print(f"{'='*60}")
    print(f"App ID: {args.app_id}")
    print(f"Target Count: {args.count}")
    
    # ----- Part A: Fetch App Metadata -----
    fetch_app_metadata(args.app_id)
    
    # ----- Determine Date Range -----
    if args.end_date:
        end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    else:
        end_date = datetime.now()
    
    if args.start_date:
        start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    else:
        # Default: 2 weeks back from end_date
        start_date = end_date - timedelta(weeks=DEFAULT_WEEKS_BACK)
    
    print(f"Date Range: {start_date.date()} to {end_date.date()}")
    
    # ----- Part B: Fetch Reviews Chronologically -----
    raw_reviews = fetch_reviews_chronologically(args.app_id, start_date, end_date)
    
    # ----- Part C: Process and Save -----
    process_and_save(raw_reviews, start_date, end_date, args.count)
    
    print(f"\n🏁 Fetch complete.\n")


if __name__ == "__main__":
    main()
