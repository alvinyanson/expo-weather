import { useQuery } from '@tanstack/react-query';
import { LocationData, WeatherResponse } from '@/interfaces';
import { fetchWeather } from '@/services';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useBatteryStore } from '@/store/useBatteryStore';

export const useFetchWeather = (location?: LocationData) => {
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const windSpeedUnit = useSettingsStore((state) => state.windSpeedUnit);
  const batterySaverAware = useSettingsStore((state) => state.batterySaverAware);
  const isBatterySaverActive = useBatteryStore((state) => state.isBatterySaverActive);

  const isThrottled = batterySaverAware && isBatterySaverActive;

  return useQuery<WeatherResponse, Error>({
    queryKey: ['weather', location?.latitude, location?.longitude, temperatureUnit, windSpeedUnit],
    queryFn: () =>
      fetchWeather(location!.latitude, location!.longitude, temperatureUnit, windSpeedUnit),
    enabled: !!location,
    staleTime: isThrottled ? 1000 * 60 * 30 : 1000 * 60 * 10, // 30 minutes throttled, 10 minutes normal
    refetchOnWindowFocus: !isThrottled,
  });
};
