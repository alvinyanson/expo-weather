import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/useSettingsStore';
import { fetchCoordinates, fetchWeather } from '@/services/weather.service';
import { weatherCodeToCondition } from '@/utils/weatherMapper';
import { t } from '@/services/i18n';

export const BACKGROUND_WEATHER_TASK = 'BACKGROUND_WEATHER_REFRESH_TASK';

export const handleBackgroundWeatherFetch =
  async (): Promise<BackgroundTask.BackgroundTaskResult> => {
    try {
      const {
        backgroundRefreshEnabled,
        temperatureUnit,
        windSpeedUnit,
        lastBackgroundWeatherCode,
        setLastBackgroundWeatherCode,
      } = useSettingsStore.getState();

      if (!backgroundRefreshEnabled) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }

      let lat: number;
      let lon: number;
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown?.coords) {
          lat = lastKnown.coords.latitude;
          lon = lastKnown.coords.longitude;
        } else {
          const coords = await fetchCoordinates();
          lat = coords.latitude;
          lon = coords.longitude;
        }
      } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
      }

      const weatherData = await fetchWeather(lat, lon, temperatureUnit, windSpeedUnit);
      if (weatherData?.current?.weather_code === undefined) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }

      const currentCode = weatherData.current.weather_code;
      const tempUnitSymbol = temperatureUnit === 'celsius' ? '°C' : '°F';
      const condition = weatherCodeToCondition(currentCode);

      if (lastBackgroundWeatherCode !== null && lastBackgroundWeatherCode !== currentCode) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t('backgroundNotificationTitle'),
            body: t('backgroundNotificationBody', {
              condition,
              temp: Math.round(weatherData.current.temperature_2m),
              unit: tempUnitSymbol,
            }),
            data: { weatherCode: currentCode },
          },
          trigger: null,
        });
      }

      setLastBackgroundWeatherCode(currentCode);

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  };

TaskManager.defineTask(BACKGROUND_WEATHER_TASK, handleBackgroundWeatherFetch);
