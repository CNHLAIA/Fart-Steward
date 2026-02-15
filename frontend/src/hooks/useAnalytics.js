import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAnalytics = (days = 30, weeks = 12) => {
  const [data, setData] = useState({
    dailyCount: null,
    weeklyCount: null,
    typeDistribution: null,
    smellDistribution: null,
    hourlyHeatmap: null,
    durationDistribution: null,
    crossAnalysis: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = days ? `?days=${days}` : '';
      
      const [
        dailyRes,
        weeklyRes,
        typeRes,
        smellRes,
        heatmapRes,
        durationRes,
        crossRes,
      ] = await Promise.all([
        api.get(`/analytics/daily-count${queryParams}`),
        api.get(weeks ? `/analytics/weekly-count?weeks=${weeks}` : '/analytics/weekly-count'),
        api.get(`/analytics/type-distribution${queryParams}`),
        api.get(`/analytics/smell-distribution${queryParams}`),
        api.get(`/analytics/hourly-heatmap${queryParams}`),
        api.get(`/analytics/duration-distribution${queryParams}`),
        api.get(`/analytics/cross-analysis${queryParams}`),
      ]);

      setData({
        dailyCount: dailyRes.data,
        weeklyCount: weeklyRes.data,
        typeDistribution: typeRes.data,
        smellDistribution: smellRes.data,
        hourlyHeatmap: heatmapRes.data,
        durationDistribution: durationRes.data,
        crossAnalysis: crossRes.data,
      });
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [days, weeks]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { data, loading, error, refetch: fetchAllData };
};
