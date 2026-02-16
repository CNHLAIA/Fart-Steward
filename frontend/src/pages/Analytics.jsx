import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../hooks/useAnalytics';
import ChartCard from '../components/charts/ChartCard';
import {
  getDailyCountOption,
  getWeeklyCountOption,
  getTypeDistributionOption,
  getSmellDistributionOption,
  getHourlyHeatmapOption,
  getDurationDistributionOption,
  getCrossAnalysisOption,
} from '../components/charts/chartUtils';

export default function Analytics() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const [weeks, setWeeks] = useState(12);

  const { data, loading, error, refetch } = useAnalytics(days, weeks);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{t('analytics.title')}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{t('analytics.period')}</span>
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={7}>{t('analytics.last7Days')}</option>
              <option value={30}>{t('analytics.last30Days')}</option>
              <option value={90}>{t('analytics.last90Days')}</option>
              <option value={0}>{t('analytics.allTime')}</option>
            </select>
          </div>
          <button 
            onClick={refetch} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            {t('analytics.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          <ChartCard 
            title={t('analytics.charts.dailyCount')}
            loading={loading}
            error={error}
            option={getDailyCountOption(data.dailyCount)}
          />
        </div>
        
        <div className="col-span-1">
          <ChartCard 
            title={t('analytics.charts.typeDistribution')}
            loading={loading}
            error={error}
            option={getTypeDistributionOption(data.typeDistribution)}
          />
        </div>

        <div className="col-span-1">
          <ChartCard 
            title={t('analytics.charts.smellDistribution')}
            loading={loading}
            error={error}
            option={getSmellDistributionOption(data.smellDistribution)}
          />
        </div>

        <div className="col-span-1">
          <ChartCard 
            title={t('analytics.charts.durationDistribution')}
            loading={loading}
            error={error}
            option={getDurationDistributionOption(data.durationDistribution)}
          />
        </div>

        <div className="col-span-1">
           <ChartCard 
            title={t('analytics.charts.weeklyTrend')}
            loading={loading}
            error={error}
            option={getWeeklyCountOption(data.weeklyCount)}
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <ChartCard 
            title={t('analytics.charts.hourlyHeatmap')}
            loading={loading}
            error={error}
            option={getHourlyHeatmapOption(data.hourlyHeatmap)}
          />
        </div>

        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <ChartCard 
            title={t('analytics.charts.crossAnalysis')}
            loading={loading}
            error={error}
            option={getCrossAnalysisOption(data.crossAnalysis)}
          />
        </div>
      </div>
    </div>
  );
}
