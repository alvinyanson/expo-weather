import axios from 'axios';
import { LocationSearchResult } from '@/interfaces';

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
