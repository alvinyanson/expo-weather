import * as Location from 'expo-location';
import apiClient from '@/services/api.client';
import {
  LocationPermissionError,
  fetchCoordinates,
  fetchLocation,
  fetchWeather,
} from '@/services/weather.service';

vi.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  getLastKnownPositionAsync: vi.fn(),
  reverseGeocodeAsync: vi.fn(),
}));

vi.mock('@/services/api.client', () => ({
  default: { get: vi.fn() },
}));

const mockLocation = vi.mocked(Location);
const mockGet = vi.mocked(apiClient.get);

const grant = () => {
  mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  } as never);
  mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  } as never);
};

const positionAt = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as never;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('fetchCoordinates', () => {
  it('throws LocationPermissionError with canAskAgain: true when permission is denied once', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: true,
    } as never);
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: true,
    } as never);

    try {
      await fetchCoordinates();
      expect.fail('Should have thrown LocationPermissionError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(LocationPermissionError);
      expect(err.canAskAgain).toBe(true);
      expect(err.message).toBe('Permission to access location was denied');
    }
  });

  it('throws LocationPermissionError with canAskAgain: false when permanently blocked', async () => {
    mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    } as never);
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    } as never);

    try {
      await fetchCoordinates();
      expect.fail('Should have thrown LocationPermissionError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(LocationPermissionError);
      expect(err.canAskAgain).toBe(false);
      expect(err.message).toBe('Permission to access location was denied');
    }
  });

  it('returns coordinates from the current position', async () => {
    grant();
    mockLocation.getCurrentPositionAsync.mockResolvedValue(positionAt(1.5, 2.5));

    await expect(fetchCoordinates()).resolves.toEqual({ latitude: 1.5, longitude: 2.5 });
    expect(mockLocation.getLastKnownPositionAsync).not.toHaveBeenCalled();
  });

  it('falls back to the last known position when the current position fails', async () => {
    grant();
    mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('timeout'));
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(positionAt(3, 4));

    await expect(fetchCoordinates()).resolves.toEqual({ latitude: 3, longitude: 4 });
  });

  it('throws when no location can be determined', async () => {
    grant();
    mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('timeout'));
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(null);

    await expect(fetchCoordinates()).rejects.toThrow('Could not determine your location');
  });
});

describe('fetchLocation', () => {
  beforeEach(() => {
    grant();
    mockLocation.getCurrentPositionAsync.mockResolvedValue(positionAt(10, 20));
  });

  it('returns the city from reverse geocoding', async () => {
    mockLocation.reverseGeocodeAsync.mockResolvedValue([{ city: 'Manila' }] as never);

    await expect(fetchLocation()).resolves.toEqual({ latitude: 10, longitude: 20, city: 'Manila' });
  });

  it('falls back to region, then district, then a default label', async () => {
    mockLocation.reverseGeocodeAsync.mockResolvedValue([
      { city: null, region: null, district: 'Makati' },
    ] as never);

    await expect(fetchLocation()).resolves.toMatchObject({ city: 'Makati' });
  });

  it('defaults to "Unknown Location" when reverse geocoding fails', async () => {
    mockLocation.reverseGeocodeAsync.mockRejectedValue(new Error('geocode failed'));

    await expect(fetchLocation()).resolves.toMatchObject({ city: 'Unknown Location' });
  });
});

describe('fetchWeather', () => {
  it('requests the forecast with the expected params and returns the data for metric default', async () => {
    const data = { current: { temperature_2m: 25 } };
    mockGet.mockResolvedValue({ data } as never);

    await expect(fetchWeather(10, 20)).resolves.toBe(data);
    expect(mockGet).toHaveBeenCalledWith(
      '/forecast',
      expect.objectContaining({
        params: expect.objectContaining({
          latitude: 10,
          longitude: 20,
          current:
            'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,surface_pressure',
          temperature_unit: 'celsius',
          wind_speed_unit: 'kmh',
        }),
      }),
    );
  });

  it('requests the forecast with custom units when specified', async () => {
    const data = { current: { temperature_2m: 77 } };
    mockGet.mockResolvedValue({ data } as never);

    await expect(fetchWeather(10, 20, 'fahrenheit', 'mph')).resolves.toBe(data);
    expect(mockGet).toHaveBeenCalledWith(
      '/forecast',
      expect.objectContaining({
        params: expect.objectContaining({
          temperature_unit: 'fahrenheit',
          wind_speed_unit: 'mph',
        }),
      }),
    );
  });

  it('propagates API errors', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    await expect(fetchWeather(10, 20)).rejects.toThrow('Network Error');
  });
});
