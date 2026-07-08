import { useQuery } from '@tanstack/react-query';
import { LocationData, WeatherResponse } from '@/interfaces';
import { fetchWeather } from '@/services';

import { useSettingsStore } from '@/store/useSettingsStore';

export const useFetchWeather = (location?: LocationData) => {
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const windSpeedUnit = useSettingsStore((state) => state.windSpeedUnit);

  return useQuery<WeatherResponse, Error>({
    queryKey: ['weather', location?.latitude, location?.longitude, temperatureUnit, windSpeedUnit],
    queryFn: () =>
      fetchWeather(location!.latitude, location!.longitude, temperatureUnit, windSpeedUnit),
    enabled: !!location,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
