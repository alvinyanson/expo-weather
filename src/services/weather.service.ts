import * as Location from 'expo-location';
import { LocationData, WeatherResponse } from '@/interfaces';
import apiClient from './api.client';
import { t } from './i18n';
import { logBreadcrumb } from './crash.service';

export const fetchCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error(t('errLocationDenied'));
  }

  let location;
  try {
    // Try to get current position with balanced accuracy for better reliability on emulators
    location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    // Fallback to last known position if current position fails or times out
    location = await Location.getLastKnownPositionAsync({});
  }

  if (!location) {
    throw new Error(t('errLocationGpsCheck'));
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const fetchLocation = async (): Promise<LocationData> => {
  const { latitude, longitude } = await fetchCoordinates();

  let city = t('unknownLocation');
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    city = address?.city || address?.region || address?.district || t('unknownLocation');
  } catch (e) {
    // Expected degradation, not a bug: fall back to "Unknown location" and leave
    // a breadcrumb so a later crash has the context.
    logBreadcrumb(
      `[Location] Reverse geocode failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return { latitude, longitude, city };
};

export const fetchWeather = async (
  lat: number,
  lon: number,
  temperatureUnit: 'celsius' | 'fahrenheit' = 'celsius',
  windSpeedUnit: 'kmh' | 'mph' = 'kmh',
): Promise<WeatherResponse> => {
  const response = await apiClient.get<WeatherResponse>('/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max',
      hourly: 'temperature_2m,weather_code,precipitation_probability',
      timezone: 'auto',
      forecast_days: 8,
      temperature_unit: temperatureUnit,
      wind_speed_unit: windSpeedUnit,
    },
  });
  return response.data;
};
