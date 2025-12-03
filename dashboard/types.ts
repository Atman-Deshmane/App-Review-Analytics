export interface RawReview {
  date: string;
  rating: number;
  review_text: string;
  thumbs_up_count: number;
  title: string | null;
  id: number;
  theme: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  tag: string;
}

// --- Dashboard Interfaces ---

export interface DashboardReview {
  reviewId: string;
  userName: string;
  content: string;
  score: number;
  thumbsUpCount: number;
  at: string;
  appVersion: string | null;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  sentiment_score: number;
  themes: string[];
  intent: string;
  keywords: string[];
  category: string;
  rationale: string;
}

// Legacy Types for unused components
export interface TagMetric {
  name: string;
  totalLikes: number;
  count: number;
  positiveCount: number;
  negativeCount: number;
  reviews: RawReview[];
}

export interface ThemeMetric {
  name: string;
  totalLikes: number;
  count: number;
  positiveCount: number;
  negativeCount: number;
  tags: TagMetric[];
}

export interface ThemeAnalysis {
  theme: string;
  sentiment_score: number;
  volume: number;
  keywords: string[];
  summary: string;
  examples: string[];
}

export interface AnalyzedData {
  metadata: {
    app_id: string;
    total_reviews: number;
    date_range: { start: string; end: string };
    average_rating: number;
  };
  reviews: DashboardReview[];
  themes: ThemeAnalysis[];
  top_keywords: Array<{ keyword: string; count: number; sentiment: number }>;
  intent_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number>;
}

export interface ManifestApp {
  name: string;
  latest: string;
  versions: string[];
}

export interface Manifest {
  [appId: string]: ManifestApp;
}