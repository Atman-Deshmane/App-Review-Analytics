import { RawReview, AnalyzedData, DashboardReview, ThemeAnalysis } from '../types';

export const processReviews = (rawReviews: RawReview[], appId: string): AnalyzedData => {
  // 1. Basic Metadata
  const total_reviews = rawReviews.length;
  const average_rating = total_reviews > 0
    ? rawReviews.reduce((acc, r) => acc + r.rating, 0) / total_reviews
    : 0;

  // Date Range
  const sortedDates = [...rawReviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const date_range = {
    start: sortedDates.length > 0 ? sortedDates[0].date : '',
    end: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].date : ''
  };

  // 2. Map Reviews
  const reviews: DashboardReview[] = rawReviews.map(r => {
    let sentimentScore = 0;
    if (r.sentiment === 'Positive') sentimentScore = 1;
    if (r.sentiment === 'Negative') sentimentScore = -1;

    return {
      reviewId: String(r.id),
      userName: "Anonymous", // Not in raw data
      content: r.review_text,
      score: r.rating,
      thumbsUpCount: r.thumbs_up_count,
      at: r.date,
      appVersion: null,
      sentiment: r.sentiment,
      sentiment_score: sentimentScore,
      themes: [r.theme],
      intent: r.tag,
      keywords: [], // Not in raw data
      category: r.tag,
      rationale: "" // Not in raw data
    };
  });

  // 3. Theme Analysis
  const themeMap = new Map<string, {
    volume: number;
    sentimentSum: number;
    reviews: RawReview[]
  }>();

  rawReviews.forEach(r => {
    const current = themeMap.get(r.theme) || { volume: 0, sentimentSum: 0, reviews: [] };
    let score = 0;
    if (r.sentiment === 'Positive') score = 1;
    if (r.sentiment === 'Negative') score = -1;

    current.volume++;
    current.sentimentSum += score;
    current.reviews.push(r);
    themeMap.set(r.theme, current);
  });

  const themes: ThemeAnalysis[] = Array.from(themeMap.entries()).map(([theme, data]) => {
    // Sort reviews by thumbs up for examples
    const topReviews = data.reviews.sort((a, b) => b.thumbs_up_count - a.thumbs_up_count).slice(0, 3);

    return {
      theme,
      volume: data.volume,
      sentiment_score: data.volume > 0 ? data.sentimentSum / data.volume : 0,
      keywords: [],
      summary: `Analysis of ${data.volume} reviews related to ${theme}`,
      examples: topReviews.map(r => r.review_text)
    };
  });

  // Sort themes by volume
  themes.sort((a, b) => b.volume - a.volume);

  // 4. Distributions
  const sentiment_distribution = { Positive: 0, Negative: 0, Neutral: 0 };
  const intent_distribution: Record<string, number> = {};

  rawReviews.forEach(r => {
    if (sentiment_distribution[r.sentiment] !== undefined) {
      sentiment_distribution[r.sentiment]++;
    }

    intent_distribution[r.tag] = (intent_distribution[r.tag] || 0) + 1;
  });

  return {
    metadata: {
      app_id: appId,
      total_reviews,
      date_range,
      average_rating
    },
    reviews,
    themes,
    top_keywords: [], // Not available in raw data
    intent_distribution,
    sentiment_distribution
  };
};