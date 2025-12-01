import { Review, ThemeMetric, TagMetric } from '../types';

export const processReviews = (reviews: Review[]): ThemeMetric[] => {
  const themesMap = new Map<string, ThemeMetric>();

  reviews.forEach((review) => {
    // 1. Initialize Theme if not exists
    if (!themesMap.has(review.theme)) {
      themesMap.set(review.theme, {
        name: review.theme,
        totalLikes: 0,
        count: 0,
        positiveCount: 0,
        negativeCount: 0,
        tags: [],
      });
    }

    const theme = themesMap.get(review.theme)!;
    theme.totalLikes += review.thumbs_up_count;
    theme.count += 1;
    if (review.sentiment === 'Positive') theme.positiveCount += 1;
    if (review.sentiment === 'Negative') theme.negativeCount += 1;

    // 2. Handle Tags within Theme
    let tag = theme.tags.find((t) => t.name === review.tag);
    if (!tag) {
      tag = {
        name: review.tag,
        totalLikes: 0,
        count: 0,
        positiveCount: 0,
        negativeCount: 0,
        reviews: [],
      };
      theme.tags.push(tag);
    }

    tag.totalLikes += review.thumbs_up_count;
    tag.count += 1;
    if (review.sentiment === 'Positive') tag.positiveCount += 1;
    if (review.sentiment === 'Negative') tag.negativeCount += 1;
    tag.reviews.push(review);
  });

  // Convert Map to Array and Sort Themes by impact (Total Likes)
  return Array.from(themesMap.values()).sort((a, b) => b.totalLikes - a.totalLikes);
};

export const calculateSentimentPercentage = (positive: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((positive / total) * 100);
};