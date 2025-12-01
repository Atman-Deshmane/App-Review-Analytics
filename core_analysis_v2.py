import datetime

# ... (imports remain same)

# ... (setup remains same)

# ... (step0 remains same)

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
        return ["Uncategorized", "Other"]

# ... (step2 remains same)

# ... (step3 remains same)

def step5_generate_report(df_final, themes, current_date_str):
    print("Step 5: Generating Weekly Pulse Report...")
    
    # ... (aggregation logic remains same)

    # ... (context preparation remains same)
    
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
    classification_results = step2_classify_and_sentiment(reviews_text, themes)
    df_classification = pd.DataFrame(classification_results)
    
    # ... (merging logic remains same)

    # ... (step 3 logic remains same)

    # ... (step 4 logic remains same)
    
    # Step 5: Report
    report_content = step5_generate_report(df_final, themes, current_date_str)
    with open("weekly_pulse_report.md", "w") as f:
        f.write(report_content)
    print("Report generated: weekly_pulse_report.md")

if __name__ == "__main__":
    main()
