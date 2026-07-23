import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useWeatherHistory } from '@/hooks/useWeatherHistory';
import * as weatherHistoryService from '@/services/weatherHistory.service';
import type { WeatherHistoryRow } from '@/interfaces';

const makeRow = (overrides: Partial<WeatherHistoryRow> = {}): WeatherHistoryRow => ({
  id: 1,
  fetched_at: '2026-07-23T00:00:00.000Z',
  latitude: 14.5995,
  longitude: 120.9842,
  city: 'Manila',
  temperature: 32,
  weather_code: 0,
  humidity: 70,
  wind_speed: 15,
  pressure: 1013,
  temp_max: 35,
  temp_min: 28,
  temperature_unit: 'celsius',
  wind_speed_unit: 'kmh',
  ...overrides,
});

const mockDb = {} as Parameters<typeof useWeatherHistory>[0];

describe('useWeatherHistory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty summaries and stops loading when no rows exist', async () => {
    vi.spyOn(weatherHistoryService, 'fetchWeatherHistory').mockResolvedValue([]);

    const { result } = renderHook(() => useWeatherHistory(mockDb, 14.5995, 120.9842));

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summaries).toHaveLength(0);
  });

  it('groups rows by UTC day into DailyWeatherSummary', async () => {
    const row1 = makeRow({
      id: 1,
      fetched_at: '2026-07-23T01:00:00.000Z',
      temp_min: 26,
      temp_max: 34,
    });
    const row2 = makeRow({
      id: 2,
      fetched_at: '2026-07-23T10:00:00.000Z',
      temp_min: 27,
      temp_max: 35,
    });
    const row3 = makeRow({
      id: 3,
      fetched_at: '2026-07-22T14:00:00.000Z',
      temp_min: 25,
      temp_max: 33,
    });

    vi.spyOn(weatherHistoryService, 'fetchWeatherHistory').mockResolvedValue([row1, row2, row3]);

    const { result } = renderHook(() => useWeatherHistory(mockDb, 14.5995, 120.9842));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.summaries).toHaveLength(2);

    const july23 = result.current.summaries.find((s) => s.date === '2026-07-23');
    const july22 = result.current.summaries.find((s) => s.date === '2026-07-22');

    expect(july23).toBeDefined();
    // Both snapshots from July 23 are in the group
    expect(july23?.snapshots).toHaveLength(2);
    // data field equals snapshots (for SectionList compatibility)
    expect(july23?.data).toHaveLength(2);
    // temp_min = min(26, 27), temp_max = max(34, 35)
    expect(july23?.temp_min).toBe(26);
    expect(july23?.temp_max).toBe(35);

    expect(july22).toBeDefined();
    expect(july22?.snapshots).toHaveLength(1);
  });

  it('calls clearLocationHistory and re-fetches on clearHistory', async () => {
    const row = makeRow();
    const fetchSpy = vi
      .spyOn(weatherHistoryService, 'fetchWeatherHistory')
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([]);

    const clearSpy = vi
      .spyOn(weatherHistoryService, 'clearLocationHistory')
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useWeatherHistory(mockDb, 14.5995, 120.9842));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summaries).toHaveLength(1);

    await act(async () => {
      await result.current.clearHistory();
    });

    await waitFor(() => expect(result.current.summaries).toHaveLength(0));
    expect(clearSpy).toHaveBeenCalledWith(mockDb, 14.5995, 120.9842);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('returns empty summaries and isLoading=false when db is null', async () => {
    const { result } = renderHook(() => useWeatherHistory(null, 14.5995, 120.9842));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summaries).toHaveLength(0);
  });
});
