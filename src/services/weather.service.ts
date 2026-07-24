import * as Location from 'expo-location';
import { LocationData, WeatherResponse } from '@/interfaces';
import apiClient from './api.client';
import { t } from './i18n';
import { reverseGeocode } from './location.service';

export class LocationPermissionError extends Error {
  canAskAgain: boolean;
  status: Location.PermissionStatus;

  constructor(message: string, canAskAgain: boolean, status: Location.PermissionStatus) {
    super(message);
    this.name = 'LocationPermissionError';
    this.canAskAgain = canAskAgain;
    this.status = status;
  }
}

export const fetchCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
  let permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (permission.status !== 'granted') {
    throw new LocationPermissionError(
      t('errLocationDenied'),
      permission.canAskAgain,
      permission.status,
    );
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
  const city = await reverseGeocode(latitude, longitude);
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
      current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,surface_pressure',
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
