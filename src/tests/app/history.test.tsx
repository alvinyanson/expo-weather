import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryScreen from '@/app/history';
import { useWeatherHistory } from '@/hooks/useWeatherHistory';
import type { DailyWeatherSummary } from '@/interfaces';

const { backMock } = vi.hoisted(() => ({ backMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: backMock }),
  useLocalSearchParams: () => ({ lat: '14.5995', lon: '120.9842', city: 'Manila' }),
}));

vi.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: vi.fn(() => ({})),
}));

vi.mock('@/hooks/useWeatherHistory', () => ({
  useWeatherHistory: vi.fn(),
}));

const mockUseWeatherHistory = vi.mocked(useWeatherHistory);
const mockClearHistory = vi.fn().mockResolvedValue(undefined);

const sampleSummaries: DailyWeatherSummary[] = [
  {
    date: '2026-07-27',
    temp_min: 24.2,
    temp_max: 32.8,
    snapshots: [
      {
        id: 1,
        fetched_at: '2026-07-27T10:00:00.000Z',
        latitude: 14.5995,
        longitude: 120.9842,
        city: 'Manila',
        temperature: 30,
        weather_code: 0,
        humidity: 70,
        wind_speed: 10,
        pressure: 1012,
        temp_max: 33,
        temp_min: 24,
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
      },
    ],
    data: [
      {
        id: 1,
        fetched_at: '2026-07-27T10:00:00.000Z',
        latitude: 14.5995,
        longitude: 120.9842,
        city: 'Manila',
        temperature: 30,
        weather_code: 0,
        humidity: 70,
        wind_speed: 10,
        pressure: 1012,
        temp_max: 33,
        temp_min: 24,
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
      },
    ],
  },
];

import { formatDateFull } from '@/utils/formatters';

describe('HistoryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading spinner while weather history is loading', () => {
    mockUseWeatherHistory.mockReturnValue({
      summaries: [],
      isLoading: true,
      clearHistory: mockClearHistory,
    });

    render(<HistoryScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    // ActivityIndicator renders in React Native Web
    expect(screen.queryByText('No history yet')).toBeNull();
  });

  it('renders empty state when history summaries array is empty', () => {
    mockUseWeatherHistory.mockReturnValue({
      summaries: [],
      isLoading: false,
      clearHistory: mockClearHistory,
    });

    render(<HistoryScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('No history yet')).toBeTruthy();
  });

  it('renders section headers and row items when summaries exist', () => {
    mockUseWeatherHistory.mockReturnValue({
      summaries: sampleSummaries,
      isLoading: false,
      clearHistory: mockClearHistory,
    });

    render(<HistoryScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText(formatDateFull('2026-07-27'))).toBeTruthy();
    expect(screen.getByText('Low: 24° High: 33°')).toBeTruthy(); // Math.round(24.2) and Math.round(32.8)
    expect(screen.getByText('30°C')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    mockUseWeatherHistory.mockReturnValue({
      summaries: [],
      isLoading: false,
      clearHistory: mockClearHistory,
    });

    render(<HistoryScreen />);

    const backButton = screen.getByLabelText(/go back/i);
    fireEvent.click(backButton);

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it('invokes clearHistory when trash button is pressed', async () => {
    mockUseWeatherHistory.mockReturnValue({
      summaries: sampleSummaries,
      isLoading: false,
      clearHistory: mockClearHistory,
    });

    render(<HistoryScreen />);

    const clearButton = screen.getByLabelText('Clear history');
    fireEvent.click(clearButton);

    expect(mockClearHistory).toHaveBeenCalledTimes(1);
  });
});
