import argparse
from google_play_scraper import Sort, reviews
import pandas as pd
from datetime import datetime, timedelta

# Defaults
DEFAULT_APP_ID = 'com.nextbillion.groww'
DEFAULT_COUNT = 200
COUNTRY = 'in'
LANGUAGE = 'en'
WEEKS_BACK = 2

def fetch_reviews(app_id, fetch_count, start_date=None, end_date=None):
    print(f"Fetching {fetch_count} most relevant reviews for {app_id}...")
    
    # Fetch reviews
    try:
        result, _ = reviews(
            app_id,
            lang=LANGUAGE,
            country=COUNTRY,
            sort=Sort.MOST_RELEVANT,
            count=fetch_count
        )
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        return
    
    if not result:
        print("No reviews found.")
        return

    print(f"Total fetched: {len(result)}")

    # Convert to DataFrame
    df = pd.DataFrame(result)
    
    # Ensure date is datetime
    df['at'] = pd.to_datetime(df['at'])
    
    # Filter by Date Range
    if start_date:
        start_dt = pd.to_datetime(start_date)
        print(f"Filtering reviews after {start_dt.date()}")
        df = df[df['at'] >= start_dt]
        
    if end_date:
        end_dt = pd.to_datetime(end_date)
        # Set end date to end of day
        end_dt = end_dt + timedelta(days=1) - timedelta(seconds=1)
        print(f"Filtering reviews before {end_dt.date()}")
        df = df[df['at'] <= end_dt]
        
    if not start_date and not end_date:
        # Default: Filter for last 12 weeks
        cutoff_date = datetime.now() - timedelta(weeks=WEEKS_BACK)
        print(f"No custom date range. Filtering for last {WEEKS_BACK} weeks (>= {cutoff_date.date()})")
        df = df[df['at'] >= cutoff_date]
    
    df_filtered = df.copy()
    
    kept_count = len(df_filtered)
    print(f"Kept after date filter: {kept_count}")
    
    if kept_count < 20:
        print("WARNING: Most Relevant sort didn't yield enough recent data (< 20 reviews).")
        if kept_count == 0:
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
    if 'title' in df_filtered.columns:
        cols_to_keep['title'] = 'title'
    else:
        df_filtered['title'] = None # Placeholder
        cols_to_keep['title'] = 'title'

    df_final = df_filtered.rename(columns=cols_to_keep)[list(cols_to_keep.values())]
    
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
    print(f"Filtered Count: {len(df_filtered)}")
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
