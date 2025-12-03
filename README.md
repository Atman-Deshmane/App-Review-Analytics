# 📊 App Review Insights Analyzer

> **🌐 Live Demo:** [https://100cr.cloud/reviews/](https://100cr.cloud/reviews/)

An intelligent, automated system that transforms app store reviews into actionable insights for product and leadership teams. Built for **NextLeap AI Bootcamp Milestone 2**.

---

## 🎯 Overview

This project automates the complete workflow of collecting, analyzing, and reporting on Google Play Store reviews using AI-powered insights. It extracts strategic themes, generates weekly leadership reports, and delivers them via email with interactive dashboards.

### Key Features

- 🤖 **AI-Powered Analysis**: Uses Google's Gemini 2.5 Flash for intelligent theme extraction and sentiment analysis
- 📈 **Interactive Dashboard**: Beautiful React-based visualization with filtering, search, and historical comparisons
- 📧 **Automated Email Reports**: Weekly pulse reports delivered automatically with dynamic dashboard links
- 🔄 **CI/CD Pipeline**: Fully automated via GitHub Actions with scheduled runs and manual triggers
- 🌐 **Live Deployment**: Hosted on Hostinger with continuous deployment
- 🎨 **Dark Mode Support**: Responsive design with both light and dark themes

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                       GitHub Actions Workflow                    │
│  (Scheduled: Weekly | Manual: workflow_dispatch)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         orchestrator.py                          │
│  Coordinates the entire pipeline with status tracking           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ fetch_reviews│    │ core_analysis_v2 │    │ archive_     │
│     .py      │ →  │      .py         │ →  │  history     │
│              │    │                  │    │              │
│ Scrapes Play │    │ AI Analysis:     │    │ Versions &   │
│ Store data   │    │ • Themes         │    │ Manifest     │
│              │    │ • Tags           │    │              │
│              │    │ • Sentiment      │    │              │
└──────────────┘    └──────────────────┘    └──────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ Email Report │    │ Generate Manifest│    │ Deploy to    │
│  (HTML/Text) │    │  (history.json)  │    │  Hostinger   │
└──────────────┘    └──────────────────┘    └──────────────┘
```

### Tech Stack

**Backend (Python)**
- `google-play-scraper` - Review data collection
- `google-generativeai` - Gemini AI integration
- `pandas` - Data processing
- `firebase-admin` - Real-time status updates
- `smtplib` - Email delivery

**Frontend (React + TypeScript)**
- React 18 with TypeScript
- Recharts for data visualization
- Tailwind CSS for styling
- Vite for build tooling

**Infrastructure**
- GitHub Actions for CI/CD
- Hostinger for web hosting
- Firebase Realtime Database for status tracking
- FTP deployment

---

## 📦 Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for dashboard development)
- Gemini API Key
- Firebase Project (for status tracking)
- Email Account (Gmail recommended)

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Atman-Deshmane/App-Review-Analytics.git
   cd App-Review-Analytics
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Gemini AI
   GEMINI_API_KEY_NEXTLEAP=your_gemini_api_key
   GEMINI_MODEL_NAME=gemini-2.5-flash-preview-09-2025
   
   # Email Configuration
   EMAIL_SENDER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_RECIPIENT=recipient@example.com
   
   # Firebase (for status tracking)
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   FIREBASE_DB_URL=https://your-project.firebaseio.com
   ```

### Frontend Setup (Dashboard)

1. **Navigate to dashboard directory:**
   ```bash
   cd dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   Create `dashboard/.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   VITE_FIREBASE_DB_URL=https://your-project.firebaseio.com
   
   VITE_GITHUB_TOKEN=your_github_token
   VITE_GITHUB_OWNER=Atman-Deshmane
   VITE_GITHUB_REPO=App-Review-Analytics
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

---

## 🚀 Usage

### Manual Local Execution

Run the complete pipeline locally:

```bash
python orchestrator.py \
  --app_id com.nextbillion.groww \
  --count 200 \
  --themes "auto" \
  --email recipient@example.com
```

**Parameters:**
- `--app_id`: Google Play Store app ID
- `--count`: Number of reviews to fetch (default: 200)
- `--themes`: Comma-separated themes or "auto" for AI detection
- `--email`: Email address for report delivery
- `--start_date`: Optional start date (YYYY-MM-DD)
- `--end_date`: Optional end date (YYYY-MM-DD)
- `--job_id`: Optional job ID for status tracking

### Automated Execution (GitHub Actions)

**Scheduled Run:**
- Automatically runs weekly (configurable in `.github/workflows/weekly_pulse.yml`)

**Manual Trigger:**
1. Go to GitHub Actions → "Weekly Review Analysis"
2. Click "Run workflow"
3. Configure parameters:
   - App ID (default: Groww)
   - Review count
   - Email recipient
   - Date range (optional)

---

## 📊 Output & Deliverables

### 1. Weekly Pulse Report (`weekly_pulse_report.md`)

A concise, executive-ready markdown report containing:
- **Executive Summary**: Key insights in 2-3 sentences
- **Top Themes**: Top 3-5 themes with impact scores
- **Voice of Customer**: Impactful user quotes
- **Recommended Actions**: 3 specific, actionable recommendations

### 2. Email Report

Professional HTML email with:
- Embedded report content
- Interactive dashboard button with dynamic URL
- Light/Dark mode support
- Beautiful gradient button design

### 3. Interactive Dashboard

Features:
- **Theme Distribution**: Visual breakdown of review themes
- **Sentiment Analysis**: Positive/Negative/Neutral counts
- **Tag Explorer**: Drill down into specific issues
- **Search & Filtering**: Find specific reviews
- **Historical Comparison**: Compare across different analysis runs
- **Export**: Download filtered data as CSV

### 4. Data Files

- `temp_reviews_raw.csv`: Raw scraped reviews
- `temp_reviews_analyzed.json`: AI-tagged and categorized reviews
- `dashboard/public/history/{app_id}/{version}/`: Archived analysis results

---

## 📈 Analysis Methodology

### Step 1: Data Collection
- Fetches "Most Relevant" reviews from Google Play Store
- Filters by date range (default: last 2 weeks)
- Sorts by helpfulness (thumbs up count)
- Captures: content, rating, date, thumbs up count

### Step 2: AI-Powered Theme Extraction
Uses Gemini AI to:
1. **Identify Strategic Themes** (5 max)
   - Auto-discovers themes from review content
   - Uses plain English labels (e.g., "Login Issues", "Customer Support")
   - Avoids corporate jargon

2. **Classify Reviews**
   - Assigns each review to one theme
   - Determines sentiment (Positive/Negative/Neutral)
   - Global context analysis

3. **Deep-Dive Tagging**
   - Generates 3-6 specific tags per theme
   - Maps every review to a granular tag
   - Dashboard-ready categorization

### Step 3: Report Generation
- Aggregates theme statistics
- Calculates impact scores (sum of thumbs up)
- Selects top quotes per theme
- Generates actionable recommendations via AI

---

## 🔧 Configuration

### Supported Apps

Currently configured for:
- **Groww** (default)
- **Meesho**
- **Flipkart**
- **Amazon Shopping**
- **Formula 1**

Add more in `orchestrator.py`:
```python
APP_NAMES = {
    "your.app.id": "App Display Name",
}
```

### GitHub Secrets Required

Set in repository settings → Secrets:
- `GEMINI_API_KEY_NEXTLEAP`
- `EMAIL_SENDER`
- `EMAIL_PASSWORD`
- `EMAIL_RECIPIENT`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_DB_URL`
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- All `VITE_*` environment variables

---

## 🎨 Dashboard Features

### Theme Analysis
- Pie chart showing theme distribution
- Bar chart for impact scores
- Sentiment breakdown per theme

### Review Explorer
- Searchable table with all reviews
- Filter by theme, tag, sentiment, rating
- Sort by date or helpfulness

### Historical Analysis
- Version selector dropdown
- Compare metrics across time periods
- Trend visualization

### Export & Share
- CSV export of filtered reviews
- Shareable dashboard URLs with query parameters
- Print-friendly layout

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Triggers:**
- Schedule: Weekly (Sunday 12:00 UTC)
- Manual: `workflow_dispatch`
- Push to main (deployment only)

**Steps:**
1. Setup Python & Node.js environments
2. Install dependencies
3. Run orchestrator pipeline
4. Build React dashboard
5. Deploy to Hostinger via FTP
6. Send email report

**Deployment:**
- Automatic on push to `main`
- Deploys to: `https://100cr.cloud/reviews/`
- Includes all analysis history

---

## 📧 Email Report Format

### Subject
```
Weekly App Review Pulse: [App Name] ([Date Range])
```

### Content
- Plain text version for compatibility
- HTML version with styling
- Dark mode support
- Interactive button with dynamic dashboard link

### Button URL Format
```
https://100cr.cloud/reviews/dashboard?app={app_id}&version={version_id}

Example:
https://100cr.cloud/reviews/dashboard?app=com.nextbillion.groww&version=2025-12-03_200reviews
```

---

## ⚠️ Known Limitations

- **Rate Limits**: Gemini API has rate limits; conservative batch sizes used
- **Review Scraping**: Limited to publicly available reviews (no login required)
- **Date Filtering**: Play Store doesn't provide exact timestamps; filtered by approximate dates
- **Language**: Currently optimized for English reviews
- **Preview Model**: Using `gemini-2.5-flash-preview-09-2025` which may change

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Email not sending
- Check `EMAIL_SENDER` and `EMAIL_PASSWORD` in `.env`
- For Gmail, use App Password (not regular password)
- Enable "Less secure app access" or use OAuth2

**Issue**: GitHub Action fails
- Verify all secrets are set correctly
- Check Firebase credentials format
- Review workflow logs for specific errors

**Issue**: Dashboard not loading data
- Ensure `history.json` manifest is generated
- Check browser console for errors
- Verify GitHub API token has repo access

**Issue**: Model not found error
- Update `GEMINI_MODEL_NAME` to a valid model
- Check available models: `gemini-1.5-flash`, `gemini-1.5-pro`

---

## 🤝 Contributing

This project was built for NextLeap AI Bootcamp Milestone 2. Contributions are welcome!

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

## 📄 License

This project is part of NextLeap AI Bootcamp coursework.

---

## 👨‍💻 Author

**Atman Deshmane**
- GitHub: [@Atman-Deshmane](https://github.com/Atman-Deshmane)
- Project: [App Review Analytics](https://github.com/Atman-Deshmane/App-Review-Analytics)

---

## 🙏 Acknowledgments

- **NextLeap** for the AI Bootcamp program
- **Google Gemini** for the AI capabilities
- **Play Store Scraper** library maintainers
- All open-source contributors

---

**🌐 Live Dashboard:** [https://100cr.cloud/reviews/](https://100cr.cloud/reviews/)
