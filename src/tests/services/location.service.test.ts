import axios from 'axios';
import { searchLocations } from '@/services/location.service';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

beforeAll(() => {
  process.env.EXPO_PUBLIC_GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
});

describe('Location Service', () => {
  it('should not call the API if query length is less than 2', async () => {
    const results = await searchLocations('a');
    expect(results).toEqual([]);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('should call the API and return mapped results when query length is >= 2', async () => {
    const mockData = {
      data: {
        results: [
          {
            id: 1,
            name: 'Manila',
            latitude: 14.5995,
            longitude: 120.9842,
            country: 'Philippines',
            admin1: 'Metro Manila',
          },
        ],
      },
    };
    mockedAxios.get.mockResolvedValueOnce(mockData);

    const results = await searchLocations('Manila');

    expect(mockedAxios.get).toHaveBeenCalledWith('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: 'Manila',
        count: 10,
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Manila');
    expect(results[0].country).toBe('Philippines');
  });

  it('should return empty array when API returns no results', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    const results = await searchLocations('UnknownCityxyz');

    expect(results).toEqual([]);
  });
});
