import * as Linking from 'expo-linking';

export interface DeepLinkCityParams {
  latitude: number;
  longitude: number;
  city: string;
}

export interface RawDeepLinkQueryParams {
  lat?: string | number | string[];
  lon?: string | number | string[];
  city?: string | string[];
}

const extractString = (
  val?: string | number | string[] | (string | number)[],
): string | undefined => {
  if (Array.isArray(val)) {
    const first = val[0];
    return first !== undefined ? String(first) : undefined;
  }
  if (val !== undefined && val !== null) {
    return String(val);
  }
  return undefined;
};

export const validateDeepLinkParams = (
  params?: RawDeepLinkQueryParams | null,
): DeepLinkCityParams | null => {
  if (!params) return null;

  const rawLat = extractString(params.lat);
  const rawLon = extractString(params.lon);
  const rawCity = extractString(params.city);

  if (rawLat === undefined || rawLon === undefined || rawCity === undefined) {
    return null;
  }

  const trimmedCity = rawCity.trim();
  if (trimmedCity.length === 0) {
    return null;
  }

  const latitude = Number(rawLat);
  const longitude = Number(rawLon);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return null;
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
    city: trimmedCity,
  };
};

export const createCityDeepLink = (lat: number, lon: number, city: string): string => {
  return Linking.createURL('weather', {
    queryParams: {
      lat: String(lat),
      lon: String(lon),
      city,
    },
  });
};

export const parseCityDeepLink = (url: string): DeepLinkCityParams | null => {
  try {
    const parsed = Linking.parse(url);
    if (!parsed || !parsed.queryParams) {
      return null;
    }
    return validateDeepLinkParams(parsed.queryParams as RawDeepLinkQueryParams);
  } catch {
    return null;
  }
};
