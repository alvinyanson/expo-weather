import { Alert } from 'react-native';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomeScreen from '@/app/index';

const { pushMock, backMock } = vi.hoisted(() => ({ pushMock: vi.fn(), backMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const mockSaveLocation = vi.fn();
vi.mock('@/hooks', () => ({
  useFetchLocation: vi.fn(),
  useFetchWeather: vi.fn(),
  useDebounce: vi.fn((val) => val), // mock debounce to return value immediately
  useSearchLocation: vi.fn(),
  useSavedLocations: vi.fn(() => ({ saveLocation: mockSaveLocation, isSaving: false })),
}));

const mockAddSearch = vi.fn();
vi.mock('@/store/useSearchStore', () => ({
  useSearchStore: vi.fn(() => ({
    addSearch: mockAddSearch,
    recentSearches: [],
  })),
}));

import { useFetchLocation, useFetchWeather, useSearchLocation } from '@/hooks';

const mockLocationHook = vi.mocked(useFetchLocation);
const mockWeatherHook = vi.mocked(useFetchWeather);
const mockSearchHook = vi.mocked(useSearchLocation);

const location = { latitude: 1, longitude: 2, city: 'Manila' };
const weather = {
  current: { temperature_2m: 23.6, weather_code: 0, relative_humidity_2m: 60, wind_speed_10m: 12 },
  hourly: {
    time: [
      new Date().toISOString(),
      new Date(Date.now() + 3600000).toISOString(),
      new Date(Date.now() + 7200000).toISOString(),
    ],
    temperature_2m: [23.6, 23.0, 22.5],
    weather_code: [0, 0, 1],
    precipitation_probability: [0, 10, 20],
  },
  daily: {
    time: ['2026-06-18'],
    weather_code: [0],
    temperature_2m_max: [30],
    temperature_2m_min: [20],
    uv_index_max: [7],
  },
};

const searchResults = [
  { id: 101, name: 'Tokyo', latitude: 35.6895, longitude: 139.6917, country: 'Japan' },
];

const hookState = (overrides = {}) =>
  ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }) as never;

const searchHookState = (overrides = {}) =>
  ({
    data: undefined,
    isFetching: false,
    ...overrides,
  }) as never;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomeScreen', () => {
  it('shows the loading indicator while fetching', () => {
    mockLocationHook.mockReturnValue(hookState({ isLoading: true }));
    mockWeatherHook.mockReturnValue(hookState({ isLoading: true }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);

    expect(screen.getByText('Fetching weather data...')).toBeTruthy();
  });

  it('renders the city, temperature and condition once loaded', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('24°C')).toBeTruthy(); // 23.6 rounded
    expect(screen.getByText('Clear Sky')).toBeTruthy(); // weather_code 0
    expect(screen.getByText('Tap for more details')).toBeTruthy();
  });

  it('navigates to the details screen when the hero is pressed', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);
    fireEvent.click(screen.getByText('24°C'));

    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: { lat: 1, lon: 2, city: 'Manila' },
    });
  });

  it('shows the error message and retries on press', () => {
    const refetchLocation = vi.fn();
    const refetchWeather = vi.fn();
    mockLocationHook.mockReturnValue(
      hookState({ error: new Error('Permission denied'), refetch: refetchLocation }),
    );
    mockWeatherHook.mockReturnValue(hookState({ refetch: refetchWeather }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);
    expect(screen.getByText('Permission denied')).toBeTruthy();

    fireEvent.click(screen.getByText('Retry'));
    expect(refetchLocation).toHaveBeenCalled();
    expect(refetchWeather).toHaveBeenCalled();
  });

  it('shows search results and selects a location', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));
    mockSearchHook.mockReturnValue(searchHookState({ data: searchResults }));

    render(<HomeScreen />);

    const searchInput = screen.getByPlaceholderText('Search city...');
    fireEvent.change(searchInput, { target: { value: 'Tok' } });

    // The mock debounce returns immediately, so useSearchLocation gets 'Tok' and we mocked its return data
    expect(screen.getByText('Tokyo, Japan')).toBeTruthy();

    // Select Tokyo
    fireEvent.click(screen.getByText('Tokyo, Japan'));

    // addSearch should be called
    expect(mockAddSearch).toHaveBeenCalledWith(searchResults[0]);

    // should navigate to details with new location params
    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: { lat: 35.6895, lon: 139.6917, city: 'Tokyo' },
    });
  });

  it('renders the Save Location button once weather is loaded', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);

    expect(screen.getByText('Save Location')).toBeTruthy();
  });

  it('saves the current location and confirms success', async () => {
    mockSaveLocation.mockResolvedValue('doc-1');
    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);
    fireEvent.click(screen.getByText('Save Location'));

    expect(mockSaveLocation).toHaveBeenCalledWith({ city: 'Manila', lat: 1, lon: 2 });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Saved', 'Location saved successfully.');
    });
  });

  it('navigates to the saved locations screen', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));
    mockSearchHook.mockReturnValue(searchHookState());

    render(<HomeScreen />);
    fireEvent.click(screen.getByLabelText('Saved locations'));

    expect(pushMock).toHaveBeenCalledWith('/saved');
  });
});
