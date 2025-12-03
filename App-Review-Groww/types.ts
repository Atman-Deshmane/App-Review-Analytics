export interface Review {
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

export interface TagMetric {
  name: string;
  totalLikes: number;
  count: number;
  positiveCount: number;
  negativeCount: number;
  reviews: Review[];
}

export interface ThemeMetric {
  name: string;
  totalLikes: number;
  count: number;
  positiveCount: number;
  negativeCount: number;
  tags: TagMetric[];
}

export interface DashboardState {
  themes: ThemeMetric[];
  selectedTheme: string | null;
  selectedTag: TagMetric | null;
}