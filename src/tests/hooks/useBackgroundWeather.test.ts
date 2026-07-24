import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBackgroundWeather } from '@/hooks/useBackgroundWeather';
import { BACKGROUND_WEATHER_TASK } from '@/tasks/backgroundWeatherTask';

vi.mock('@/tasks/backgroundWeatherTask', () => ({
  BACKGROUND_WEATHER_TASK: 'BACKGROUND_WEATHER_REFRESH_TASK',
  handleBackgroundWeatherFetch: vi.fn(),
}));

describe('useBackgroundWeather', () => {
  const mockIsTaskRegisteredAsync = vi.mocked(TaskManager.isTaskRegisteredAsync);
  const mockRegisterTaskAsync = vi.mocked(BackgroundTask.registerTaskAsync);
  const mockUnregisterTaskAsync = vi.mocked(BackgroundTask.unregisterTaskAsync);

  beforeEach(() => {
    useSettingsStore.setState({
      backgroundRefreshEnabled: false,
    });
    vi.clearAllMocks();
  });

  it('checks task registration on mount and unregisters if backgroundRefreshEnabled is false', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValueOnce(true);
    mockIsTaskRegisteredAsync.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useBackgroundWeather());

    await waitFor(() => {
      expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_WEATHER_TASK);
    });

    expect(result.current.isRegistered).toBe(false);
  });

  it('registers task when backgroundRefreshEnabled is true', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useBackgroundWeather());

    await act(async () => {
      useSettingsStore.setState({ backgroundRefreshEnabled: true });
    });

    await waitFor(() => {
      expect(mockRegisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_WEATHER_TASK, {
        minimumInterval: 15,
      });
    });

    expect(result.current.isRegistered).toBe(true);
  });

  it('allows manual register and unregister calls', async () => {
    mockIsTaskRegisteredAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useBackgroundWeather());

    await act(async () => {
      await result.current.register();
    });

    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_WEATHER_TASK, expect.any(Object));
    expect(result.current.isRegistered).toBe(true);

    mockIsTaskRegisteredAsync.mockResolvedValueOnce(true);

    await act(async () => {
      await result.current.unregister();
    });

    expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(BACKGROUND_WEATHER_TASK);
    expect(result.current.isRegistered).toBe(false);
  });
});
