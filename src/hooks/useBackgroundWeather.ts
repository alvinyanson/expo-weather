import { useCallback, useEffect, useState } from 'react';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { BACKGROUND_WEATHER_TASK } from '@/tasks/backgroundWeatherTask';
import { useSettingsStore } from '@/store/useSettingsStore';

export const useBackgroundWeather = (): {
  isRegistered: boolean;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
} => {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const backgroundRefreshEnabled = useSettingsStore((state) => state.backgroundRefreshEnabled);

  const checkStatus = useCallback(async () => {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
    setIsRegistered(registered);
  }, []);

  const register = useCallback(async () => {
    try {
      await BackgroundTask.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
        minimumInterval: 15,
      });
      setIsRegistered(true);
    } catch (error) {
      console.warn('Failed to register background weather task:', error);
    }
  }, []);

  const unregister = useCallback(async () => {
    try {
      const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
      if (registered) {
        await BackgroundTask.unregisterTaskAsync(BACKGROUND_WEATHER_TASK);
      }
      setIsRegistered(false);
    } catch (error) {
      console.warn('Failed to unregister background weather task:', error);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (backgroundRefreshEnabled) {
      register();
    } else {
      unregister();
    }
  }, [backgroundRefreshEnabled, register, unregister]);

  return {
    isRegistered,
    register,
    unregister,
  };
};
