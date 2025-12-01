import os
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
import json
import time
import datetime
import sys
import traceback

# 1. Setup & Global Configuration
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY_NEXTLEAP")

if not GEMINI_API_KEY:
    # Fallback for local testing if env var name differs
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY_NEXTLEAP (or GEMINI_API_KEY) not found in .env file")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)

# Use the specific model requested, with fallback
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash-preview-09-2025")

generation_config = {
    "response_mime_type": "application/json"
}

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=generation_config
)

def step0_prepare_data():
    print("Step 0: Loading and Preparing Data...")
    try:
        df = pd.read_csv("groww_reviews_raw.csv")
    except FileNotFoundError:
        print("Error: groww_reviews_raw.csv not found. Please run fetch_reviews.py first.")
        return None, None

    # Ensure thumbs_up_count is int
    df['thumbs_up_count'] = df['thumbs_up_count'].fillna(0).astype(int)
    
    # Sort by thumbs_up_count DESC and take top 300
    df_top_300 = df.sort_values(by='thumbs_up_count', ascending=False).head(300).copy()
    
    # Add ID
    df_top_300['id'] = range(1, len(df_top_300) + 1)
    
    # Create massive string
    reviews_text = ""
    for index, row in df_top_300.iterrows():
        reviews_text += f"[ID: {row['id']}] (Likes: {row['thumbs_up_count']}) {row['review_text']}\n"
        
    print(f"Prepared {len(df_top_300)} reviews for analysis.")
    return df_top_300, reviews_text

def step1_strategic_themes(reviews_text, current_date_str):
    print("Step 1: Identifying Strategic Themes (Global Context)...")
    
    prompt = f"""
    Today is {current_date_str}. You are analyzing user reviews for Groww.
    
    **Task:** Categorize these reviews into **5 Simple, High-Level Buckets**.
    
    **Constraint:** 
    * Use **Plain English** labels (2-4 words max). 
    * Avoid corporate jargon. The themes should be instantly understandable by anyone.
    
    **Examples of Good Themes:** 'Login & OTP Issues', 'App Slowness', 'Customer Support', 'Stock Analysis Tools', 'Charges & Fees'.
    **Examples of Bad Themes:** 'Core Trading Reliability', 'Omnichannel Remediation', 'User Acquisition Friction'.
    
    **Output:** Return a JSON list of exactly 4 strings. (We will add 'Other' programmatically).
    
    Reviews:
    {reviews_text}
    """
    
    try:
        response = model.generate_content(prompt)
        themes = json.loads(response.text)
        
        if isinstance(themes, list):
            themes.append("Other") # Programmatically add Other
            print(f"Themes Identified: {themes}")
            return themes
        else:
            print("Error: Model did not return a list.")
            return ["Uncategorized", "Other"]
            
    except Exception as e:
        print(f"Error in Step 1: {e}")
        traceback.print_exc()
        return ["Uncategorized", "Other"]

def step2_classify_reviews(reviews_text, themes):
    print("Step 2: Classifying Reviews & Sentiment (Global Context)...")
    
    prompt = f"""
    You are the Strategic Advisor to the CEO of Groww.
    
    **Task:** Classify EVERY review provided into one of these 5 Themes. Also, determine the Sentiment (Positive/Negative).
    
    **Themes:** {json.dumps(themes)}
    
    **Constraint:** If a review doesn't fit the 4 specific themes strictly, put it in 'Other'.
    
    **Output:** A JSON list of objects: `[{{"id": 123, "theme": "Theme Name", "sentiment": "Positive"}}, ...]`
    
    Reviews:
    {reviews_text}
    """
    
    try:
        # Increase token limit if needed, but 2.5 flash should handle it.
        response = model.generate_content(prompt)
        classification_results = json.loads(response.text)
        
        print(f"Classified {len(classification_results)} reviews.")
        return classification_results
        
    except Exception as e:
        print(f"Error in Step 2: {e}")
        traceback.print_exc()
        return []

def step3_deep_dive_tags(df_classified, themes):
    print("Step 3: Deep-Dive Tagging (Per-Theme Context)...")
    
    all_tags = []
    
    for theme in themes:
        if theme == "Other":
            continue
            
        print(f"  Analyzing Theme: {theme}...")
        
        # Filter reviews for this theme
        theme_reviews = df_classified[df_classified['theme'] == theme]
        
        if theme_reviews.empty:
            continue
            
        reviews_chunk = ""
        for index, row in theme_reviews.iterrows():
            reviews_chunk += f"ID: {row['id']} | Review: {row['review_text']}\n"
            
        prompt = f"""
        You are analyzing the '{theme}' bucket for the CEO.
        
        **Task:** For each review in this bucket, generate 1-2 word **Root Cause Tags**.
        
        **Style:** Be brutally specific. 
        * 'Login' is bad. 'OTP Delay' is good. 
        * 'Stock' is bad. 'F&O Order Failure' is good.
        
        **Output:** JSON list: `[{{"id": 123, "tags": ["tag1", "tag2"]}}, ...]`
        
        Reviews:
        {reviews_chunk}
        """
        
        try:
            response = model.generate_content(prompt)
            tags_result = json.loads(response.text)
            all_tags.extend(tags_result)
            
        except Exception as e:
            print(f"  Error tagging theme {theme}: {e}")
            traceback.print_exc()
            
    return all_tags

def step5_generate_report(df_final, themes, current_date_str):
    print("Step 5: Generating Weekly Pulse Report...")
    
    # Aggregate Data for Report
    theme_stats = df_final.groupby('theme').agg({
        'thumbs_up_count': 'sum',
        'id': 'count'
    }).reset_index().rename(columns={'id': 'review_count', 'thumbs_up_count': 'impact_score'})
    
    theme_stats = theme_stats.sort_values(by='impact_score', ascending=False)
    
    # Get Top Quote per Theme
    top_quotes = {}
    for theme in themes:
        theme_df = df_final[df_final['theme'] == theme]
        if not theme_df.empty:
            top_review = theme_df.sort_values(by='thumbs_up_count', ascending=False).iloc[0]
            top_quotes[theme] = {
                'text': top_review['review_text'],
                'votes': top_review['thumbs_up_count']
            }
            
    # Prepare Data Context for LLM
    # Convert to list of dicts and ensure native Python types for JSON serialization
    themes_list = []
    for _, row in theme_stats.iterrows():
        themes_list.append({
            "theme": row['theme'],
            "impact_score": int(row['impact_score']), # Explicit cast to int
            "review_count": int(row['review_count'])  # Explicit cast to int
        })

    # Ensure top quotes votes are also ints
    top_quotes_clean = {}
    for theme, data in top_quotes.items():
        top_quotes_clean[theme] = {
            "text": data['text'],
            "votes": int(data['votes']) # Explicit cast to int
        }

    report_context = {
        "themes": themes_list,
        "top_quotes": top_quotes_clean,
        "total_reviews": int(len(df_final)), # Explicit cast to int
        "date_range": "Last 12 Weeks"
    }
    
    prompt = f"""
    You are writing the "Weekly App Review Pulse" for Groww's Leadership Team.
    
    **The Reporting Period is:** Week Ending {current_date_str}.
    
    **Data Context:**
    {json.dumps(report_context, indent=2)}
    
    **Task:** Write a high-impact Markdown report.
    
    **Format:**
    ## Weekly App Review Pulse: Groww Leadership Briefing
    **Reporting Period:** Week Ending {current_date_str}
    
    ### Executive Summary
    *   [3 Bullet points synthesizing the biggest strategic insights]
    
    ### Top 5 Themes (Ranked by User Impact)
    | Theme Name | Community Impact Score (Total Thumbs Up) | Voice of the Customer | Quote Votes |
    | :--- | :--- | :--- | :--- |
    | [Theme 1] | [Score] | "[Quote text...]" | (Votes: [N]) |
    ... (List all 5 themes)
    
    ### Strategic Recommendations
    1.  [Actionable recommendation based on Theme 1]
    2.  [Actionable recommendation based on Theme 2]
    3.  [Actionable recommendation based on Theme 3]
    """
    
    try:
        # Use a text model or the same flash model
        model_text = genai.GenerativeModel("gemini-2.5-flash-preview-09-2025") # Using same model as it's good
        response = model_text.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating report: {e}")
        traceback.print_exc()
        return "Error generating report."

def main():
    # Capture current date
    current_date_str = datetime.datetime.now().strftime("%B %d, %Y")
    print(f"Analysis Date: {current_date_str}")

    # Step 0
    df_top_300, reviews_text = step0_prepare_data()
    if df_top_300 is None: return

    # Step 1
    themes = step1_strategic_themes(reviews_text, current_date_str)
    
    # Step 2
    classification_results = step2_classify_reviews(reviews_text, themes)
    df_classification = pd.DataFrame(classification_results)
    
    # Merge Classification
    # Ensure ID types match
    df_top_300['id'] = df_top_300['id'].astype(int)
    if not df_classification.empty:
        df_classification['id'] = df_classification['id'].astype(int)
        df_merged = pd.merge(df_top_300, df_classification, on='id', how='left')
    else:
        df_merged = df_top_300.copy()
        df_merged['theme'] = 'Uncategorized'
        df_merged['sentiment'] = 'Neutral'

    # Fill missing themes with 'Other'
    df_merged['theme'] = df_merged['theme'].fillna('Other')

    # Step 3
    tags_results = step3_deep_dive_tags(df_merged, themes)
    df_tags = pd.DataFrame(tags_results)
    
    # Merge Tags
    if not df_tags.empty:
        df_tags['id'] = df_tags['id'].astype(int)
        df_final = pd.merge(df_merged, df_tags, on='id', how='left')
    else:
        df_final = df_merged.copy()
        df_final['tags'] = [[] for _ in range(len(df_final))]

    # Step 4: Output
    output_file = "reviews_analyzed_v2.json"
    df_final.to_json(output_file, orient='records', indent=4)
    print(f"Analysis complete. Saved to {output_file}")
    
    # Stats
    print("\n=== ANALYSIS V2 STATS ===")
    print(df_final['theme'].value_counts())
    
    # Step 5: Report
    report_content = step5_generate_report(df_final, themes, current_date_str)
    with open("weekly_pulse_report.md", "w") as f:
        f.write(report_content)
    print("Report generated: weekly_pulse_report.md")

if __name__ == "__main__":
    main()
