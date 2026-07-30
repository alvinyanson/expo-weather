import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFetchWeather } from '@/hooks/useFetchWeather';
import { fetchWeather } from '@/services';
import { insertWeatherSnapshot } from '@/services/weatherHistory.service';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBatteryStore } from '@/store/useBatteryStore';
import type { LocationData, WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/services', () => ({
  fetchWeather: vi.fn(),
}));

vi.mock('@/services/weatherHistory.service', () => ({
  insertWeatherSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: vi.fn(),
}));

const mockFetchWeather = vi.mocked(fetchWeather);
const mockInsertWeatherSnapshot = vi.mocked(insertWeatherSnapshot);
const mockUseDatabase = vi.mocked(useDatabase);

const mockLocation: LocationData = {
  latitude: 14.5995,
  longitude: 120.9842,
  city: 'Manila',
};

const mockWeatherData: WeatherResponse = {
  current: {
    temperature_2m: 28.5,
    weather_code: 1,
    relative_humidity_2m: 75,
    wind_speed_10m: 14.2,
    surface_pressure: 1012,
  },
  daily: {
    temperature_2m_max: [33.0],
    temperature_2m_min: [24.0],
  },
} as unknown as WeatherResponse;

describe('useFetchWeather', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  // No retry override, so the hook's own retry policy is what gets exercised.
  const createRetryWrapper = () => {
    queryClient = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      batterySaverAware: false,
    });
    useBatteryStore.setState({
      isBatterySaverActive: false,
    });
    mockUseDatabase.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    // Drop any pending retry timers so they don't leak into the next test.
    queryClient?.clear();
  });

  it('is disabled when location parameter is undefined', () => {
    const { result } = renderHook(() => useFetchWeather(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(mockFetchWeather).not.toHaveBeenCalled();
  });

  it('fetches weather data when valid location coordinates are provided', async () => {
    mockFetchWeather.mockResolvedValue(mockWeatherData);

    const { result } = renderHook(() => useFetchWeather(mockLocation), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchWeather).toHaveBeenCalledWith(14.5995, 120.9842, 'celsius', 'kmh');
    expect(result.current.data).toEqual(mockWeatherData);
  });

  it('triggers insertWeatherSnapshot side effect when database is available and data updates', async () => {
    const mockDb = {} as never;
    mockUseDatabase.mockReturnValue(mockDb);
    mockFetchWeather.mockResolvedValue(mockWeatherData);

    const { result } = renderHook(() => useFetchWeather(mockLocation), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await waitFor(() => expect(mockInsertWeatherSnapshot).toHaveBeenCalled());

    expect(mockInsertWeatherSnapshot).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        latitude: 14.5995,
        longitude: 120.9842,
        city: 'Manila',
        temperature: 28.5,
        weather_code: 1,
        humidity: 75,
        wind_speed: 14.2,
        pressure: 1012,
        temp_max: 33.0,
        temp_min: 24.0,
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
      }),
    );
  });

  it('configures staleTime and refetchOnWindowFocus based on battery saver mode', async () => {
    mockFetchWeather.mockResolvedValue(mockWeatherData);

    // Case 1: Throttled (batterySaverAware: true, isBatterySaverActive: true)
    useSettingsStore.setState({ batterySaverAware: true });
    useBatteryStore.setState({ isBatterySaverActive: true });

    const { result: throttledResult } = renderHook(() => useFetchWeather(mockLocation), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(throttledResult.current.isSuccess).toBe(true));

    const throttledQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ['weather', 14.5995, 120.9842, 'celsius', 'kmh'] });

    const throttledQueryOptions = throttledQuery?.options as any;
    expect(throttledQueryOptions?.staleTime).toBe(1000 * 60 * 30); // 30 mins
    expect(throttledQueryOptions?.refetchOnWindowFocus).toBe(false);

    // Case 2: Normal / Unthrottled (batterySaverAware: false, isBatterySaverActive: false)
    useSettingsStore.setState({ batterySaverAware: false });
    useBatteryStore.setState({ isBatterySaverActive: false });

    const { result: normalResult } = renderHook(() => useFetchWeather(mockLocation), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(normalResult.current.isSuccess).toBe(true));

    const normalQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ['weather', 14.5995, 120.9842, 'celsius', 'kmh'] });

    const normalQueryOptions = normalQuery?.options as any;
    expect(normalQueryOptions?.staleTime).toBe(1000 * 60 * 10); // 10 mins
    expect(normalQueryOptions?.refetchOnWindowFocus).toBe(true);
  });

  it('does not retry 4xx client errors', async () => {
    mockFetchWeather.mockRejectedValue(
      new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
      } as never),
    );

    const { result } = renderHook(() => useFetchWeather(mockLocation), {
      wrapper: createRetryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // React Query retries 3 times by default; the policy stops after the first failure.
    expect(mockFetchWeather).toHaveBeenCalledTimes(1);
  });

  it('retries retryable errors after a backoff delay and reports the in-flight failure', async () => {
    mockFetchWeather.mockRejectedValue(
      new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED'),
    );

    const { result } = renderHook(() => useFetchWeather(mockLocation), {
      wrapper: createRetryWrapper(),
    });

    await waitFor(() => expect(result.current.failureCount).toBe(1));

    // Still fetching during the 1s backoff, so no error is surfaced to the screen yet.
    expect(result.current.isFetching).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.failureReason).toBeInstanceOf(AxiosError);
    expect(mockFetchWeather).toHaveBeenCalledTimes(1);
  });
});
