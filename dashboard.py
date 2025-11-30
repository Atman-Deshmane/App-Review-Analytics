import streamlit as st
import pandas as pd
import json
import plotly.express as px

st.set_page_config(page_title="Groww App Review Analytics", layout="wide")

st.title("📊 Groww App Review Analytics Pulse")

# Load Data
@st.cache_data
def load_data():
    try:
        # Load Raw Reviews
        df_raw = pd.read_csv("groww_reviews_raw.csv")
        df_raw['date'] = pd.to_datetime(df_raw['date'])
        
        # Load Tagged Reviews
        with open("reviews_tagged.json", "r") as f:
            tagged_data = json.load(f)
        df_tagged = pd.DataFrame(tagged_data)
        
        return df_raw, df_tagged
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return None, None

df_raw, df_tagged = load_data()

if df_raw is not None and df_tagged is not None:
    # Key Metrics
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Reviews (12 Wks)", len(df_raw))
    col1.metric("Max Thumbs Up", df_raw['thumbs_up_count'].max())
    
    # Sentiment Analysis
    if 'sentiment' in df_tagged.columns:
        sentiment_counts = df_tagged['sentiment'].value_counts()
        col2.metric("Positive Reviews", sentiment_counts.get('Positive', 0))
        col3.metric("Negative Reviews", sentiment_counts.get('Negative', 0))
        col4.metric("Neutral Reviews", sentiment_counts.get('Neutral', 0))
        
        st.subheader("Sentiment Distribution")
        fig_sentiment = px.pie(values=sentiment_counts.values, names=sentiment_counts.index, hole=0.4)
        st.plotly_chart(fig_sentiment)

    # Theme Analysis
    st.subheader("Top Themes by Impact")
    if 'theme' in df_tagged.columns:
        # Aggregate impact
        theme_stats = df_tagged.groupby('theme')['thumbs_up_count'].sum().reset_index()
        theme_stats = theme_stats.sort_values(by='thumbs_up_count', ascending=False).head(10)
        
        fig_themes = px.bar(theme_stats, x='thumbs_up_count', y='theme', orientation='h', 
                            title="Community Impact (Total Thumbs Up) by Theme",
                            labels={'thumbs_up_count': 'Impact Score', 'theme': 'Theme'})
        fig_themes.update_layout(yaxis={'categoryorder':'total ascending'})
        st.plotly_chart(fig_themes, use_container_width=True)

    # Raw Data Viewer
    st.subheader("Review Explorer")
    search_term = st.text_input("Search Reviews", "")
    
    if search_term:
        filtered_df = df_tagged[df_tagged['review_text'].str.contains(search_term, case=False, na=False)]
    else:
        filtered_df = df_tagged
        
    st.dataframe(filtered_df[['date', 'rating', 'sentiment', 'theme', 'thumbs_up_count', 'review_text']], use_container_width=True)

else:
    st.warning("Please run the analysis pipeline first to generate data.")
