import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Analytics from '../pages/Analytics';
import { useAnalytics } from '../hooks/useAnalytics';

jest.mock('../hooks/useAnalytics');

jest.mock('echarts-for-react', () => () => <div data-testid="echarts-mock" />);

describe('Analytics Page', () => {
  beforeEach(() => {
    useAnalytics.mockReturnValue({
      data: {
        dailyCount: { dates: ['2023-01-01'], counts: [10] },
        weeklyCount: { weeks: ['2023-01'], counts: [50] },
        typeDistribution: [{ name: 'Type A', value: 20 }],
        smellDistribution: { categories: ['Mild'], values: [15] },
        hourlyHeatmap: [[0, 0, 5]],
        durationDistribution: [{ name: 'Short', value: 30 }],
        crossAnalysis: [{ value: [1, 1], meta: {} }],
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  test('renders page title', () => {
    render(<Analytics />);
    expect(screen.getByText('analytics.title')).toBeInTheDocument();
  });

  test('renders all charts when data is available', () => {
    render(<Analytics />);
    expect(screen.getByText(/analytics.charts.dailyCount/i)).toBeInTheDocument();
    expect(screen.getByText('analytics.charts.typeDistribution')).toBeInTheDocument();
    expect(screen.getByText('analytics.charts.smellDistribution')).toBeInTheDocument();
    expect(screen.getByText('analytics.charts.durationDistribution')).toBeInTheDocument();
    expect(screen.getByText(/analytics.charts.weeklyTrend/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics.charts.hourlyHeatmap/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics.charts.crossAnalysis/i)).toBeInTheDocument();
    
    const charts = screen.getAllByTestId('echarts-mock');
    expect(charts.length).toBe(7);
  });

  test('shows error message', () => {
    useAnalytics.mockReturnValue({
      data: {},
      loading: false,
      error: 'Failed to fetch data',
      refetch: jest.fn(),
    });

    render(<Analytics />);
    const errorMessages = screen.getAllByText('Failed to fetch data');
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  test('updates days filter', () => {
    const refetch = jest.fn();
    useAnalytics.mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch,
    });

    render(<Analytics />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '7' } });
    
    expect(select.value).toBe('7');
  });

  test('calls refetch on button click', () => {
    const refetch = jest.fn();
    useAnalytics.mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch,
    });

    render(<Analytics />);
    fireEvent.click(screen.getByText('analytics.refresh'));
    expect(refetch).toHaveBeenCalled();
  });
});
