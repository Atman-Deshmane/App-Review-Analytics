import argparse
from google_play_scraper import Sort, reviews, app as get_app_details
import pandas as pd
from datetime import datetime, timedelta
import os
import json

# Defaults
DEFAULT_APP_ID = 'com.nextbillion.groww'
DEFAULT_COUNT = 200
COUNTRY = 'in'
LANGUAGE = 'en'
WEEKS_BACK = 2

def fetch_reviews(app_id, fetch_count, start_date=None, end_date=None):
    print(f"Fetching metadata for {app_id}...")
    
    # Save Metadata (Icon, Name)
    try:
        app_details = get_app_details(app_id, lang=LANGUAGE, country=COUNTRY)
        metadata = {
            "id": app_id,
            "name": app_details.get('title'),
            "icon": app_details.get('icon')
        }
        
        # Ensure directory exists (it might not yet if this is first run, but we usually create it later. Let's make sure)
        history_dir = os.path.join("dashboard", "public", "history", app_id)
        os.makedirs(history_dir, exist_ok=True)
        
        with open(os.path.join(history_dir, "metadata.json"), "w") as f:
            json.dump(metadata, f)
            
        print(f"Saved metadata (icon) for {app_id}")
            
    except Exception as e:
        print(f"Warning: Could not fetch metadata: {e}")

    # Smart Fetching Logic
    # Always fetch a larger pool to ensure we have enough after date filtering and quality sorting
    initial_fetch_count = max(1000, fetch_count * 5)
    print(f"Fetching {initial_fetch_count} reviews to build candidate pool...")
    
    # Fetch reviews
    try:
        result, _ = reviews(
            app_id,
            lang=LANGUAGE,
            country=COUNTRY,
            sort=Sort.MOST_RELEVANT,
            count=initial_fetch_count
        )
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        return
    
    if not result:
        print("No reviews found.")
        return

    # Convert to DataFrame
    df = pd.DataFrame(result)
    
    # Ensure date is datetime
    df['at'] = pd.to_datetime(df['at'])
    
    # Filter by Date Range
    if start_date:
        start_dt = pd.to_datetime(start_date)
        df = df[df['at'] >= start_dt]
        
    if end_date:
        end_dt = pd.to_datetime(end_date)
        # Set end date to end of day
        end_dt = end_dt + timedelta(days=1) - timedelta(seconds=1)
        df = df[df['at'] <= end_dt]
        
    if not start_date and not end_date:
        # Default: Filter for last 12 weeks
        cutoff_date = datetime.now() - timedelta(weeks=WEEKS_BACK)
        df = df[df['at'] >= cutoff_date]
    
    # Sort by thumbsUpCount (Data Quality)
    if 'thumbsUpCount' in df.columns:
        df = df.sort_values(by='thumbsUpCount', ascending=False)
        
    # Slice to requested count
    df = df.head(fetch_count)
    
    final_count = len(df)
    print(f"Final Count after Date Filter & Quality Sort: {final_count}")
    
    if final_count < 20:
        print("WARNING: Low data volume after filtering.")
        if final_count == 0:
             print("No reviews kept. Exiting.")
             return

    # Select and rename columns
    cols_to_keep = {
        'at': 'date',
        'score': 'rating',
        'content': 'review_text',
        'thumbsUpCount': 'thumbs_up_count'
    }
    
    # If title exists in raw data, map it. Otherwise create empty.
    # If title exists in raw data, map it. Otherwise create empty.
    if 'title' in df.columns:
        cols_to_keep['title'] = 'title'
    else:
        df['title'] = None # Placeholder
        cols_to_keep['title'] = 'title'

    df_final = df.rename(columns=cols_to_keep)[list(cols_to_keep.values())]
    
    # Sort by thumbs_up_count (desc), then date
    df_final = df_final.sort_values(by=['thumbs_up_count', 'date'], ascending=[False, True])
    
    # Save to CSV (Temporary file)
    output_file = 'temp_reviews_raw.csv'
    df_final.to_csv(output_file, index=False)
    
    print("\n=== DATA FETCH STATS ===")
    print(f"Total Fetched: {len(result)}")
    if not df_final.empty:
        print(f"Date Range: {df_final['date'].min()} to {df_final['date'].max()}")
    else:
        print("Date Range: N/A")
    print(f"Filtered Count: {len(df)}")
    print(f"Final Count (after sort): {len(df_final)}")
    print(f"Max Thumbs Up found: {df_final['thumbs_up_count'].max() if not df_final.empty else 0}")
    print("========================")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Fetch reviews from Google Play Store.')
    parser.add_argument('--app_id', type=str, default=DEFAULT_APP_ID, help='Application ID (Package Name)')
    parser.add_argument('--count', type=int, default=DEFAULT_COUNT, help='Number of reviews to fetch')
    parser.add_argument('--start_date', type=str, help='Start Date (YYYY-MM-DD)')
    parser.add_argument('--end_date', type=str, help='End Date (YYYY-MM-DD)')
    
    args = parser.parse_args()
    
    fetch_reviews(args.app_id, args.count, args.start_date, args.end_date)
