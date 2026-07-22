import axios from 'axios';
import * as Location from 'expo-location';
import { LocationSearchResult } from '@/interfaces';
import { t } from './i18n';
import { logBreadcrumb } from './crash.service';

const GEOCODING_API_URL =
  process.env.EXPO_PUBLIC_GEOCODING_API_URL || 'https://geocoding-api.open-meteo.com/v1/search';

export const searchLocations = async (query: string): Promise<LocationSearchResult[]> => {
  if (query.length < 2) {
    return [];
  }

  const response = await axios.get(GEOCODING_API_URL, {
    params: {
      name: query,
      count: 10,
    },
  });

  return response.data.results || [];
};

export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address?.city || address?.region || address?.district || t('unknownLocation');
  } catch (e) {
    logBreadcrumb(
      `[Location] Reverse geocode failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return t('unknownLocation');
  }
};
