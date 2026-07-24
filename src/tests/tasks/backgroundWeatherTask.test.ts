import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BackgroundTask from 'expo-background-task';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/useSettingsStore';
import { handleBackgroundWeatherFetch } from '@/tasks/backgroundWeatherTask';
import { fetchCoordinates, fetchWeather } from '@/services/weather.service';

vi.mock('@/services/weather.service', () => ({
  fetchCoordinates: vi.fn(),
  fetchWeather: vi.fn(),
}));

vi.mock('expo-location', () => ({
  getLastKnownPositionAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  Accuracy: { Balanced: 3 },
}));

vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: vi.fn(),
}));

describe('backgroundWeatherTask', () => {
  const mockFetchWeather = vi.mocked(fetchWeather);
  const mockFetchCoordinates = vi.mocked(fetchCoordinates);
  const mockGetLastKnownPositionAsync = vi.mocked(Location.getLastKnownPositionAsync);
  const mockScheduleNotificationAsync = vi.mocked(Notifications.scheduleNotificationAsync);

  beforeEach(() => {
    useSettingsStore.setState({
      backgroundRefreshEnabled: false,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      lastBackgroundWeatherCode: null,
    });
    vi.clearAllMocks();
  });

  it('returns Success if backgroundRefreshEnabled is false', async () => {
    const result = await handleBackgroundWeatherFetch();
    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    expect(mockFetchWeather).not.toHaveBeenCalled();
  });

  it('fetches location & weather, updates lastBackgroundWeatherCode without notification on initial run', async () => {
    useSettingsStore.setState({ backgroundRefreshEnabled: true });
    mockGetLastKnownPositionAsync.mockResolvedValueOnce({
      coords: { latitude: 35.6762, longitude: 139.6503 },
    } as never);
    mockFetchWeather.mockResolvedValueOnce({
      current: { weather_code: 0, temperature_2m: 22.5 },
    } as never);

    const result = await handleBackgroundWeatherFetch();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    expect(mockFetchWeather).toHaveBeenCalledWith(35.6762, 139.6503, 'celsius', 'kmh');
    expect(useSettingsStore.getState().lastBackgroundWeatherCode).toBe(0);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('triggers notification when weather condition changes', async () => {
    useSettingsStore.setState({
      backgroundRefreshEnabled: true,
      lastBackgroundWeatherCode: 0,
    });
    mockGetLastKnownPositionAsync.mockResolvedValueOnce({
      coords: { latitude: 35.6762, longitude: 139.6503 },
    } as never);
    mockFetchWeather.mockResolvedValueOnce({
      current: { weather_code: 61, temperature_2m: 18.0 },
    } as never);

    const result = await handleBackgroundWeatherFetch();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    expect(useSettingsStore.getState().lastBackgroundWeatherCode).toBe(61);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: expect.any(String),
        body: expect.stringContaining('18'),
        data: { weatherCode: 61 },
      },
      trigger: null,
    });
  });

  it('falls back to fetchCoordinates if getLastKnownPositionAsync returns null', async () => {
    useSettingsStore.setState({ backgroundRefreshEnabled: true });
    mockGetLastKnownPositionAsync.mockResolvedValueOnce(null as never);
    mockFetchCoordinates.mockResolvedValueOnce({ latitude: 40.7128, longitude: -74.006 });
    mockFetchWeather.mockResolvedValueOnce({
      current: { weather_code: 1, temperature_2m: 20 },
    } as never);

    const result = await handleBackgroundWeatherFetch();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    expect(mockFetchCoordinates).toHaveBeenCalled();
    expect(mockFetchWeather).toHaveBeenCalledWith(40.7128, -74.006, 'celsius', 'kmh');
  });

  it('returns Failed when fetchWeather throws error', async () => {
    useSettingsStore.setState({ backgroundRefreshEnabled: true });
    mockGetLastKnownPositionAsync.mockResolvedValueOnce({
      coords: { latitude: 35.6762, longitude: 139.6503 },
    } as never);
    mockFetchWeather.mockRejectedValueOnce(new Error('Network error'));

    const result = await handleBackgroundWeatherFetch();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Failed);
  });
});
