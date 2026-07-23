import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { LocationData, WeatherResponse } from '@/interfaces';
import { fetchWeather } from '@/services';
import { insertWeatherSnapshot } from '@/services/weatherHistory.service';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBatteryStore } from '@/store/useBatteryStore';

export const useFetchWeather = (location?: LocationData) => {
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const windSpeedUnit = useSettingsStore((state) => state.windSpeedUnit);
  const batterySaverAware = useSettingsStore((state) => state.batterySaverAware);
  const isBatterySaverActive = useBatteryStore((state) => state.isBatterySaverActive);

  const isThrottled = batterySaverAware && isBatterySaverActive;

  const query = useQuery<WeatherResponse, Error>({
    queryKey: ['weather', location?.latitude, location?.longitude, temperatureUnit, windSpeedUnit],
    queryFn: () =>
      fetchWeather(location!.latitude, location!.longitude, temperatureUnit, windSpeedUnit),
    enabled: !!location,
    staleTime: isThrottled ? 1000 * 60 * 30 : 1000 * 60 * 10, // 30 minutes throttled, 10 minutes normal
    refetchOnWindowFocus: !isThrottled,
  });

  const db = useDatabase();
  // Use a ref to track the last dataUpdatedAt we inserted for this query,
  // so we don't write a duplicate row on every re-render.
  const lastInsertedAt = useRef<number>(0);

  useEffect(() => {
    const { data, dataUpdatedAt } = query;

    if (!data || !location || !db) return;
    if (dataUpdatedAt <= lastInsertedAt.current) return;

    lastInsertedAt.current = dataUpdatedAt;

    const snapshot = {
      fetched_at: new Date(dataUpdatedAt).toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      temperature: data.current.temperature_2m,
      weather_code: data.current.weather_code,
      humidity: data.current.relative_humidity_2m,
      wind_speed: data.current.wind_speed_10m,
      pressure: data.current.surface_pressure ?? null,
      temp_max: data.daily.temperature_2m_max[0] ?? 0,
      temp_min: data.daily.temperature_2m_min[0] ?? 0,
      temperature_unit: temperatureUnit,
      wind_speed_unit: windSpeedUnit,
    } satisfies Parameters<typeof insertWeatherSnapshot>[1];

    insertWeatherSnapshot(db, snapshot).catch((err) => {
      console.error('[useFetchWeather] Failed to insert snapshot:', err);
    });
  }, [query.data, query.dataUpdatedAt, location, db, temperatureUnit, windSpeedUnit]);

  return query;
};
