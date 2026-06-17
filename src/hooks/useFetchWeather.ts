import { useQuery } from '@tanstack/react-query';
import { LocationData, WeatherResponse } from '../interfaces';
import { fetchWeather } from '../services/weather.service';

export const useFetchWeather = (location?: LocationData) => {
  return useQuery<WeatherResponse, Error>({
    queryKey: ['weather', location?.latitude, location?.longitude],
    queryFn: () => fetchWeather(location!.latitude, location!.longitude),
    enabled: !!location,
  });
};
