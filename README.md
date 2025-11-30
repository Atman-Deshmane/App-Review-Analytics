# Milestone 2: App Review Insights Analyzer

This project automates the analysis of Google Play Store reviews for the **Groww** app. It fetches reviews, extracts insights using Gemini AI, clusters them into themes, and generates a weekly leadership report.

## 📂 Deliverables

1.  **`weekly_pulse_report.md`**: The final one-page weekly note.
2.  **`email_draft.txt`**: Ready-to-send email draft.
3.  **`groww_reviews_raw.csv`**: The raw dataset of 900+ reviews (Most Relevant, Last 12 Weeks).
4.  **`reviews_tagged.json`**: Intermediate data with AI-extracted tags.

## 🚀 Setup & Usage

### Prerequisites
- Python 3.8+
- Gemini API Key (in `.env`)

### Installation

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Set API Key:**
    Create a `.env` file:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the Pipeline

1.  **Step 1: Fetch Data**
    Scrapes the most relevant reviews from the Play Store.
    ```bash
    python3 fetch_reviews.py
    ```
    *Output:* `groww_reviews_raw.csv`

2.  **Step 2: Extract Tags**
    Uses Gemini to tag reviews with specific features/issues.
    ```bash
    python3 step1_extract_tags.py
    ```
    *Output:* `reviews_tagged.json`

3.  **Step 3: Analyze & Report**
    Clusters tags into themes and generates the weekly pulse.
    ```bash
    python3 step2_analyze_and_report.py
    ```
    *Output:* `weekly_pulse_report.md`

## 📊 Methodology

-   **Data Source:** Google Play Store (`google-play-scraper`).
-   **Filtering:** Top 1000 "Most Relevant" reviews, filtered for the last 12 weeks.
-   **AI Model:** Gemini 2.5 Flash (Preview) / Gemini 2.0 Flash (Fallback).
-   **Analysis:**
    -   **Extraction:** Identifies specific "Feature + State" tags (e.g., "SIP Auto-Pay Fail").
    -   **Clustering:** Groups tags into 5 strategic themes (e.g., "Trading System Reliability").
    -   **Ranking:** Prioritizes themes by "Community Impact" (Total Thumbs Up count).

## ⚠️ Known Limits
-   **Rate Limits:** The extraction script uses a conservative batch size (10) to avoid Gemini API rate limits.
-   **Uncategorized Tags:** Some niche tags may fall into "Uncategorized" if they don't fit the strict 5 themes, but the report synthesis handles this gracefully.
