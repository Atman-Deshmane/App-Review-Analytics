import os
import json
import re
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
import time

# 1. Setup
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY_NEXTLEAP")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY_NEXTLEAP not found in .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Use gemini-2.5-flash-preview-09-2025 as requested (closest match to "gemini 2.5 flash" in available models)
MODEL_NAME = "gemini-2.5-flash-preview-09-2025"

generation_config = {
    "response_mime_type": "application/json"
}

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=generation_config
)

def scrub_pii(text):
    if not isinstance(text, str):
        return ""
    # Simple regex for emails and phone numbers
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED]', text)
    text = re.sub(r'\b\d{10}\b', '[REDACTED]', text) # Simple 10 digit phone
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[REDACTED]', text) # US style
    return text

def process_batch_with_retry(batch, model_instance, batch_index=0, total_batches=1):
    prompt = f"""
    You are a Senior Product Analyst. Analyze the following list of App Store reviews.
    For EACH review, return a JSON object containing:
    1. `id`: The review ID provided.
    2. `sentiment`: 'Positive', 'Negative', or 'Neutral'.
    3. `tags`: A list of 1-3 **highly specific** technical/functional tags.
    
    **CRITICAL TAGGING RULES:**
    * **NO Generic Tags:** Do NOT use words like 'App', 'Good', 'Bad', 'UI', 'Interface', 'Slow', 'Login'.
    * **Be Precise:** Use 'Feature + State'.
        * *Bad:* 'KYC' -> *Good:* 'KYC Video Upload Fail'.
        * *Bad:* 'SIP' -> *Good:* 'SIP Auto-Pay Deduction Delay'.
    * If the review is vague, use 'General Praise' or 'General Complaint'.
    
    Input Data:
    {json.dumps(batch)}
    """
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Sending request for batch {batch_index + 1}/{total_batches} (Attempt {attempt+1})...")
            response = model_instance.generate_content(prompt)
            
            try:
                batch_results = json.loads(response.text)
                if isinstance(batch_results, list):
                    return batch_results
                else:
                    print("Warning: API response was not a list.")
                    # print(response.text[:200])
                    # If it's a dict, maybe wrap it? Unlikely for this prompt.
                    return []
            except json.JSONDecodeError:
                print("Error: Failed to parse JSON response.")
                # print("Raw response snippet:", response.text[:500])
                # If JSON fails, maybe retry?
                raise ValueError("JSON Decode Error")
                
        except Exception as e:
            print(f"Error processing batch: {e}")
            if "429" in str(e):
                wait_time = 30 * (attempt + 1)
                print(f"Rate limit hit. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                # For other errors, maybe wait a bit too
                time.sleep(5)
                if attempt == max_retries - 1:
                    raise e # Re-raise on last attempt
    
    raise Exception("Max retries exceeded")

def extract_tags():
    print("Loading data...")
    try:
        df = pd.read_csv("groww_reviews_raw.csv")
    except FileNotFoundError:
        print("Error: groww_reviews_raw.csv not found. Please run fetch_reviews.py first.")
        return

    # 2. Data Loading & Sorting
    print("Sorting and slicing top 300 reviews...")
    # Ensure thumbs_up_count is int
    df['thumbs_up_count'] = df['thumbs_up_count'].fillna(0).astype(int)
    
    # Sort by thumbs_up_count DESC
    df_sorted = df.sort_values(by='thumbs_up_count', ascending=False)
    
    # Slice top 300
    df_top_300 = df_sorted.head(300).copy()
    
    # Add an ID column if not present (using index as ID for stability)
    df_top_300['id'] = range(1, len(df_top_300) + 1)
    
    # PII Scrub
    df_top_300['review_text_scrubbed'] = df_top_300['review_text'].apply(scrub_pii)
    
    # Prepare for batch processing
    reviews_to_process = df_top_300[['id', 'review_text_scrubbed']].rename(columns={'review_text_scrubbed': 'text'}).to_dict(orient='records')
    
    all_results = []
    
    # Strategy: Try Single Batch -> Fallback to Chunks
    try:
        print(f"Attempting to process all {len(reviews_to_process)} reviews in a SINGLE batch using {MODEL_NAME}...")
        all_results = process_batch_with_retry(reviews_to_process, model, batch_index=0, total_batches=1)
        print("Single batch processing successful!")
        
    except Exception as e:
        print(f"\nSingle batch failed: {e}")
        print("Falling back to batch processing (Batch Size = 50)...")
        
        BATCH_SIZE = 50
        all_results = []
        total_batches = (len(reviews_to_process) + BATCH_SIZE - 1) // BATCH_SIZE
        
        for i in range(0, len(reviews_to_process), BATCH_SIZE):
            batch = reviews_to_process[i:i+BATCH_SIZE]
            batch_idx = i // BATCH_SIZE
            
            try:
                batch_results = process_batch_with_retry(batch, model, batch_index=batch_idx, total_batches=total_batches)
                all_results.extend(batch_results)
            except Exception as e:
                print(f"Failed to process batch {batch_idx + 1}: {e}")
                # Continue to next batch? Or stop? 
                # Let's continue to get partial results at least.
            
            # Delay between batches
            time.sleep(2)

    # 5. Output
    print(f"Extraction complete. Got {len(all_results)} results.")
    
    # Convert results to DataFrame
    df_results = pd.DataFrame(all_results)
    
    if df_results.empty:
        print("No results extracted.")
        return

    # Merge with original DataFrame
    # df_top_300 has 'id'
    # df_results has 'id', 'sentiment', 'tags'
    
    # Ensure id is same type
    df_results['id'] = df_results['id'].astype(int)
    
    df_final = pd.merge(df_top_300, df_results, on='id', how='left')
    
    # Save
    output_file = "reviews_tagged.json"
    # Convert to JSON records
    json_output = df_final.to_dict(orient='records')
    
    with open(output_file, 'w') as f:
        json.dump(json_output, f, indent=4, default=str) # default=str for datetime objects
        
    print(f"Saved tagged reviews to {output_file}")
    
    # Verify
    if not df_final.empty:
        top_review = df_final.iloc[0]
        print("\n--- Verification: Top Review ---")
        print(f"Title: {top_review.get('title', 'N/A')}")
        print(f"Text: {top_review['review_text'][:200]}...")
        print(f"Thumbs Up: {top_review['thumbs_up_count']}")
        print(f"Sentiment: {top_review.get('sentiment', 'N/A')}")
        print(f"Tags: {top_review.get('tags', 'N/A')}")

if __name__ == "__main__":
    extract_tags()
