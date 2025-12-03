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
    totalLikes: number;
    positiveCount: number;
    negativeCount: number;
    reviews: RawReview[]
  }>();

  rawReviews.forEach(r => {
    const current = themeMap.get(r.theme) || { volume: 0, sentimentSum: 0, totalLikes: 0, positiveCount: 0, negativeCount: 0, reviews: [] };
    let score = 0;
    if (r.sentiment === 'Positive') {
      score = 1;
      current.positiveCount++;
    }
    if (r.sentiment === 'Negative') {
      score = -1;
      current.negativeCount++;
    }

    current.volume++;
    current.sentimentSum += score;
    current.totalLikes += r.thumbs_up_count;
    current.reviews.push(r);
    themeMap.set(r.theme, current);
  });

  const themes: ThemeAnalysis[] = Array.from(themeMap.entries()).map(([theme, data]) => {
    // Sort reviews by thumbs up for examples
    const topReviews = data.reviews.sort((a, b) => b.thumbs_up_count - a.thumbs_up_count).slice(0, 3);

    // Calculate Sentiment Distribution
    const sentiment_distribution = { positive: 0, neutral: 0, negative: 0 };
    data.reviews.forEach(r => {
      if (r.sentiment === 'Positive') sentiment_distribution.positive++;
      else if (r.sentiment === 'Negative') sentiment_distribution.negative++;
      else sentiment_distribution.neutral++;
    });

    // Calculate Clusters (group by tag)
    const clusterMap = new Map<string, { volume: number; sentimentSum: number; totalLikes: number; positiveCount: number; negativeCount: number }>();
    data.reviews.forEach(r => {
      const tag = r.tag || 'Other';
      const current = clusterMap.get(tag) || { volume: 0, sentimentSum: 0, totalLikes: 0, positiveCount: 0, negativeCount: 0 };
      let score = 0;
      if (r.sentiment === 'Positive') {
        score = 1;
        current.positiveCount++;
      }
      if (r.sentiment === 'Negative') {
        score = -1;
        current.negativeCount++;
      }

      current.volume++;
      current.sentimentSum += score;
      current.totalLikes += r.thumbs_up_count;
      clusterMap.set(tag, current);
    });

    const clusters = Array.from(clusterMap.entries()).map(([name, cData]) => ({
      name,
      volume: cData.volume,
      totalLikes: cData.totalLikes,
      sentiment: cData.volume > 0 ? cData.sentimentSum / cData.volume : 0,
      positiveCount: cData.positiveCount,
      negativeCount: cData.negativeCount
    })).sort((a, b) => b.totalLikes - a.totalLikes); // Sort by Impact (Total Likes)

    return {
      theme,
      volume: data.volume,
      totalLikes: data.totalLikes,
      sentiment_score: data.volume > 0 ? data.sentimentSum / data.volume : 0,
      positiveCount: data.positiveCount,
      negativeCount: data.negativeCount,
      keywords: [],
      summary: `Analysis of ${data.volume} reviews related to ${theme}`,
      examples: topReviews.map(r => r.review_text),
      sentiment_distribution,
      clusters
    };
  });

  // Sort themes by volume
  themes.sort((a, b) => b.volume - a.volume);

  // 4. Distributions
  const sentiment_distribution = { Positive: 0, Negative: 0, Neutral: 0 };
  const sentiment_likes_distribution = { Positive: 0, Negative: 0, Neutral: 0 }; // New distribution by likes
  const intent_distribution: Record<string, number> = {};

  rawReviews.forEach(r => {
    if (sentiment_distribution[r.sentiment] !== undefined) {
      sentiment_distribution[r.sentiment]++;
      sentiment_likes_distribution[r.sentiment] += r.thumbs_up_count; // Sum likes
    }

    intent_distribution[r.tag] = (intent_distribution[r.tag] || 0) + 1;
  });

  // Calculate Total Likes
  const totalLikes = rawReviews.reduce((acc, r) => acc + r.thumbs_up_count, 0);

  return {
    metadata: {
      app_id: appId,
      total_reviews,
      totalLikes,
      date_range,
      average_rating
    },
    reviews,
    themes,
    top_keywords: [], // Not available in raw data
    intent_distribution,
    sentiment_distribution,
    sentiment_likes_distribution // Return new distribution
  };
};