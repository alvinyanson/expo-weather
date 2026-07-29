import type { WeatherResponse } from '@/interfaces';
import { t } from '@/services/i18n';
import { formatRound } from '@/utils/formatters';
import { weatherCodeToCondition } from '@/utils/weatherMapper';
import { createCityDeepLink } from '@/utils/deepLink';

export interface BuildWeatherShareMessageArgs {
  city: string;
  weather: WeatherResponse;
  tempUnit: string; // '°C' | '°F', already carrying the degree glyph
  lat?: number;
  lon?: number;
}

// Composes the localized weather summary shared via the share sheet.
export const buildWeatherShareMessage = ({
  city,
  weather,
  tempUnit,
  lat,
  lon,
}: BuildWeatherShareMessageArgs): string => {
  const baseMessage = t('shareMessage', {
    city,
    condition: weatherCodeToCondition(weather.current.weather_code),
    temp: formatRound(weather.current.temperature_2m),
    high: formatRound(weather.daily.temperature_2m_max[0] ?? 0),
    low: formatRound(weather.daily.temperature_2m_min[0] ?? 0),
    unit: tempUnit,
  });

  if (lat !== undefined && lon !== undefined) {
    const deepLink = createCityDeepLink(lat, lon, city);
    return `${baseMessage}\n\n${deepLink}`;
  }

  return baseMessage;
};
