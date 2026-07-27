import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFetchWeather } from '@/hooks/useFetchWeather';
import { fetchWeather } from '@/services';
import { insertWeatherSnapshot } from '@/services/weatherHistory.service';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBatteryStore } from '@/store/useBatteryStore';
import type { LocationData, WeatherResponse } from '@/interfaces';

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
});
