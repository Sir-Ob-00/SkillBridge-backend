import { analyticsService } from '../../analytics/analytics.service';

export const adminAnalyticsService = {
  async getAnalytics() {
    const [overview, topCategories, ratings] = await Promise.all([
      analyticsService.getOverview(),
      analyticsService.getTopCategories(),
      analyticsService.getAverageRatings(),
    ]);

    return { ...overview, topCategories, ratings };
  },
};
