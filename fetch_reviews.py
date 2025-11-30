from google_play_scraper import Sort, reviews
import pandas as pd
from datetime import datetime, timedelta

# Configuration
PACKAGE_NAME = 'com.nextbillion.groww'
COUNTRY = 'in'
LANGUAGE = 'en'
FETCH_COUNT = 1000
WEEKS_BACK = 12

def fetch_groww_reviews():
    print(f"Fetching {FETCH_COUNT} most relevant reviews for {PACKAGE_NAME}...")
    
    # Fetch reviews
    result, _ = reviews(
        PACKAGE_NAME,
        lang=LANGUAGE,
        country=COUNTRY,
        sort=Sort.MOST_RELEVANT,
        count=FETCH_COUNT
    )
    
    if not result:
        print("No reviews found.")
        return

    print(f"Total fetched: {len(result)}")

    # Convert to DataFrame
    df = pd.DataFrame(result)
    
    # Ensure date is datetime
    df['at'] = pd.to_datetime(df['at'])
    
    # Filter for last 12 weeks
    cutoff_date = datetime.now() - timedelta(weeks=WEEKS_BACK)
    df_filtered = df[df['at'] >= cutoff_date].copy()
    
    kept_count = len(df_filtered)
    print(f"Kept after date filter (>= {cutoff_date.date()}): {kept_count}")
    
    if kept_count < 20:
        print("WARNING: Most Relevant sort didn't yield enough recent data (< 20 reviews).")
        if kept_count == 0:
             print("No reviews kept. Exiting.")
             return

    # Select and rename columns
    # Available fields in google-play-scraper result usually include: 
    # reviewId, userName, userImage, content, score, thumbsUpCount, reviewCreatedVersion, at, replyContent, repliedAt
    
    # We need: date, rating, review_text, thumbs_up_count, title (title might not be available in all scrapers, usually it's just content)
    # google-play-scraper 'content' is the review text. It doesn't strictly have a 'title' field like App Store.
    # We will use 'content' as 'review_text'. We'll check if 'title' exists, otherwise leave it empty or omit.
    
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
    
    # Save to CSV
    output_file = 'groww_reviews_raw.csv'
    df_final.to_csv(output_file, index=False)
    
    print("\n=== DATA FETCH STATS ===")
    print(f"Total Fetched: {len(result)}")
    if not df_final.empty:
        print(f"Date Range: {df_final['date'].min()} to {df_final['date'].max()}")
    else:
        print("Date Range: N/A")
    print(f"Filtered (Last 12 wks): {len(df_filtered)}")
    print(f"Final Count (after sort): {len(df_final)}")
    print(f"Max Thumbs Up found: {df_final['thumbs_up_count'].max() if not df_final.empty else 0}")
    print("========================")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    fetch_groww_reviews()
