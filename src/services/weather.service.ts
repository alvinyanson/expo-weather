import * as Location from 'expo-location';
import { LocationData, WeatherResponse } from '../interfaces';
import apiClient from './api.client';

export const fetchCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied');
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
    throw new Error('Could not determine your location. Please check your GPS settings.');
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const fetchLocation = async (): Promise<LocationData> => {
  const { latitude, longitude } = await fetchCoordinates();

  let city = 'Unknown Location';
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    city = address?.city || address?.region || address?.district || 'Unknown Location';
  } catch (e) {
    console.error('[Location Error] Reverse geocode failed', e);
  }

  return { latitude, longitude, city };
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherResponse> => {
  const response = await apiClient.get<WeatherResponse>('/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max',
      timezone: 'auto',
      forecast_days: 8,
    },
  });
  return response.data;
};
