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
  totalLikes: number; // Added for Impact Score
  keywords: string[];
  summary: string;
  examples: string[];
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  clusters: Array<{
    name: string;
    volume: number;
    totalLikes: number; // Added for bubble size
    sentiment: number;
    positiveCount: number; // Added for gradient
    negativeCount: number; // Added for gradient
    reviews: RawReview[];
  }>;
  tags?: any[]; // Added to prevent TS error when compatible with ThemeMetric
}

export interface AnalyzedData {
  metadata: {
    app_id: string;
    total_reviews: number;
    totalLikes: number; // Added for Total Volume
    date_range: { start: string; end: string };
    average_rating: number;
  };
  reviews: DashboardReview[];
  themes: ThemeAnalysis[];
  top_keywords: Array<{ keyword: string; count: number; sentiment: number }>;
  intent_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  sentiment_likes_distribution: Record<string, number>; // Added for likes-based sentiment split
}

export interface ManifestApp {
  name: string;
  icon?: string;
  latest: string;
  versions: string[];
}

export interface Manifest {
  [appId: string]: ManifestApp;
}