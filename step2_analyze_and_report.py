import os
import json
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
import time

# 1. Setup & Model
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY_NEXTLEAP")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY_NEXTLEAP not found in .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Model Configuration
# Prioritize 2.5 preview, fallback to 2.0 flash exp if needed
MODEL_NAME_PRIMARY = "gemini-2.5-flash-preview-09-2025"
MODEL_NAME_FALLBACK = "gemini-2.0-flash-exp"

def get_model(model_name):
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config={"response_mime_type": "application/json"}
    )

# 2. Company Context
COMPANY_CONTEXT = "Context: Groww is a leading Indian fintech app. It enables retail users to invest in Direct Mutual Funds, Stocks, IPOs, and F&O (Futures & Options). It also offers UPI payments, bill recharge services, and personal loans. The app aims to simplify financial access with a transparent, paperless, and mobile-first approach."

def generate_content_with_fallback(prompt, response_schema=None):
    """
    Tries to generate content with primary model, falls back to secondary.
    Handles rate limits with simple retry.
    """
    models_to_try = [MODEL_NAME_PRIMARY, MODEL_NAME_FALLBACK]
    
    for model_name in models_to_try:
        print(f"Using model: {model_name}")
        model = get_model(model_name)
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error with {model_name}: {e}")
            if "404" in str(e):
                print(f"Model {model_name} not found. Trying next...")
                continue
            elif "429" in str(e):
                print("Rate limit hit. Waiting 30s...")
                time.sleep(30)
                # Retry once with same model
                try:
                    response = model.generate_content(prompt)
                    return response.text
                except Exception as e2:
                    print(f"Retry failed with {model_name}: {e2}")
                    continue
            else:
                # Other error, try next model
                continue
    
    raise Exception("All models failed.")

def analyze_and_report():
    print("Loading tagged reviews...")
    try:
        with open("reviews_tagged.json", "r") as f:
            reviews_data = json.load(f)
        df = pd.DataFrame(reviews_data)
    except FileNotFoundError:
        print("Error: reviews_tagged.json not found. Please run step1_extract_tags.py first.")
        return

    # 3. Data Loading & Tag Extraction
    # Flatten tags list
    all_tags = []
    for tags in df['tags']:
        if isinstance(tags, list):
            all_tags.extend(tags)
        elif isinstance(tags, str):
            # Handle potential string representation if JSON load failed to parse inner list (unlikely with json.load)
            # But just in case
            all_tags.append(tags)
            
    unique_tags = list(set(all_tags))
    print(f"Found {len(unique_tags)} unique tags.")

    # 4. LLM Stage A: Strategic Theme Clustering
    print("Clustering tags into themes...")
    
    # Split tags into chunks if too many to ensure better attention, but 600 is fine for Gemini.
    # We will emphasize EXHAUSTIVE mapping.
    
    cluster_prompt = f"""
    You are the Chief Product Officer (CPO) at Groww.
    {COMPANY_CONTEXT}
    
    * **Task:** Analyze the provided user feedback tags and group them into exactly **5 Strategic Themes**.
    * **Theme Criteria:** Themes must be functional and specific to our domain (e.g., 'F&O Trading Experience', 'UPI & Payments', 'Onboarding & KYC', 'Portfolio Tracking'). Do not use generic names like 'UI' or 'Bugs'.
    * **Output:** A JSON object mapping **EVERY SINGLE TAG** provided to one of the 5 themes: {{'Theme Name': ['tag1', 'tag2'], ...}}.
    * **CRITICAL:** You must map ALL {len(unique_tags)} tags. Do not skip any. Do not use "Uncategorized" or "Other" unless the tag is completely irrelevant (gibberish).
    
    Tags to Cluster:
    {json.dumps(unique_tags)}
    """
    
    cluster_response_text = generate_content_with_fallback(cluster_prompt)
    
    try:
        theme_mapping_raw = json.loads(cluster_response_text)
        # Flatten mapping: Tag -> Theme
        tag_to_theme = {}
        mapped_count = 0
        for theme, tags in theme_mapping_raw.items():
            for tag in tags:
                tag_to_theme[tag] = theme
                mapped_count += 1
        print(f"Mapped {mapped_count}/{len(unique_tags)} tags.")
    except json.JSONDecodeError:
        print("Error parsing clustering response.")
        print(cluster_response_text)
        return

    # 5. Python Stage B: Aggregation
    print("Aggregating data...")
    
    # Helper to map a list of tags to a single theme (majority vote or first match)
    def map_review_to_theme(review_tags):
        if not isinstance(review_tags, list) or not review_tags:
            return "Uncategorized"
        
        # Find themes for these tags
        themes = [tag_to_theme.get(tag, "Uncategorized") for tag in review_tags]
        # Return the most frequent theme, or the first one
        # Filter out Uncategorized if possible
        valid_themes = [t for t in themes if t != "Uncategorized"]
        if valid_themes:
            return max(set(valid_themes), key=valid_themes.count)
        return "Uncategorized"

    df['theme'] = df['tags'].apply(map_review_to_theme)
    
    # Aggregate
    theme_stats = df.groupby('theme').agg(
        total_impact=('thumbs_up_count', 'sum'),
        review_count=('id', 'count')
    ).reset_index()
    
    # Sort by impact
    top_themes = theme_stats.sort_values(by='total_impact', ascending=False).head(5)
    
    # Get best quote for each top theme
    top_themes_data = []
    for _, row in top_themes.iterrows():
        theme = row['theme']
        # Get reviews for this theme
        theme_reviews = df[df['theme'] == theme]
        # Find max thumbs up review
        best_review = theme_reviews.loc[theme_reviews['thumbs_up_count'].idxmax()]
        
        top_themes_data.append({
            "theme": theme,
            "impact": int(row['total_impact']),
            "count": int(row['review_count']),
            "best_quote": best_review['review_text'],
            "quote_votes": int(best_review['thumbs_up_count']), # Added specific votes
            "quote_date": best_review['date']
        })
        
    print("Top 5 Themes identified:")
    for t in top_themes_data:
        print(f"- {t['theme']} (Impact: {t['impact']})")

    # 6. LLM Stage C: Final Report Synthesis
    print("Generating final report...")
    
    report_prompt = f"""
    Write a 'Weekly App Review Pulse' for the Groww Leadership team.
    {COMPANY_CONTEXT}
    
    * **Structure:**
        1.  **Executive Summary:** 3 brief bullet points on the week's sentiment.
        2.  **Top 5 Themes (Ranked by User Impact):** For each theme, display:
            * **Theme Name**
            * **Community Impact Score:** (The Total Thumbs Up count for the theme)
            * **Voice of the Customer:** (The specific quote provided, AND include its individual vote count like "(Votes: 123)")
        3.  **Strategic Recommendations:** 3 actionable steps based on these specific themes.
    * **Format:** Clean Markdown. No fluff. Keep it under 300 words.
    * **Clarification:** Ensure the table clearly distinguishes between the Theme's Total Impact and the Quote's Individual Votes.
    
    Input Data (Top 5 Themes):
    {json.dumps(top_themes_data)}
    """
    
    # Use a text model or just the same model but ask for markdown (it usually complies even if JSON config is set, 
    # but strictly speaking we should remove response_mime_type for text. 
    # However, the user requirement said "Config: Set generation_config with response_mime_type='application/json'" in STEP 1.
    # In STEP 2, it didn't explicitly say to change it for the report, but "Format: Clean Markdown" implies text.
    # I will create a new model instance for text generation to be safe.
    
    model_text = genai.GenerativeModel(model_name=MODEL_NAME_PRIMARY) # Try primary first
    
    try:
        report_response = model_text.generate_content(report_prompt)
        report_content = report_response.text
    except Exception:
        # Fallback for text generation
        print("Primary model failed for report, trying fallback...")
        model_fallback = genai.GenerativeModel(model_name=MODEL_NAME_FALLBACK)
        report_response = model_fallback.generate_content(report_prompt)
        report_content = report_response.text

    # 7. Output
    output_file = "weekly_pulse_report.md"
    with open(output_file, "w") as f:
        f.write(report_content)
        
    print(f"Report generated successfully using Gemini 2.5 (or fallback). Saved to {output_file}")
    
    print("\n=== ANALYSIS STATS ===")
    print(f"Unique Tags Found: {len(unique_tags)}")
    print("Themes Generated:")
    for t in top_themes_data:
        print(f"- {t['theme']}")
    print(f"Final Report: {output_file}")
    print("======================")

if __name__ == "__main__":
    analyze_and_report()
