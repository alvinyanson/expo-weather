import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DetailsScreen from '@/app/details';

const { backMock } = vi.hoisted(() => ({ backMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: backMock }),
  useLocalSearchParams: () => ({}),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/hooks', () => ({
  useFetchLocation: vi.fn(),
  useFetchWeather: vi.fn(),
}));

import { useFetchLocation, useFetchWeather } from '@/hooks';

const mockLocationHook = vi.mocked(useFetchLocation);
const mockWeatherHook = vi.mocked(useFetchWeather);

const location = { latitude: 1, longitude: 2, city: 'Manila' };
const weather = {
  current: { temperature_2m: 23.6, weather_code: 0, relative_humidity_2m: 60, wind_speed_10m: 12 },
  daily: {
    time: ['2026-06-18', '2026-06-19'],
    weather_code: [0, 3],
    temperature_2m_max: [30, 28],
    temperature_2m_min: [20, 19],
    uv_index_max: [7, 5],
  },
};

const hookState = (overrides = {}) =>
  ({ data: undefined, isLoading: false, ...overrides }) as never;

afterEach(cleanup);

describe('DetailsScreen', () => {
  it('shows a loading state while data is fetching', () => {
    mockLocationHook.mockReturnValue(hookState({ isLoading: true }));
    mockWeatherHook.mockReturnValue(hookState({ isLoading: true }));

    render(<DetailsScreen />);

    expect(screen.getByText('Loading details...')).toBeTruthy();
  });

  it('shows an empty state with a working "Go Back" when there is no data', () => {
    mockLocationHook.mockReturnValue(hookState());
    mockWeatherHook.mockReturnValue(hookState({ isError: true }));

    render(<DetailsScreen />);
    expect(screen.getByText('No weather data available.')).toBeTruthy();

    fireEvent.click(screen.getByText('Go Back'));
    expect(backMock).toHaveBeenCalled();
  });

  it('renders the current conditions summary once loaded', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));

    render(<DetailsScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('Clear Sky')).toBeTruthy(); // weather_code 0
    expect(screen.getByText('24°')).toBeTruthy(); // 23.6 rounded
    expect(screen.getByText('60%')).toBeTruthy(); // humidity
    expect(screen.getByText('12 km/h')).toBeTruthy(); // wind
    expect(screen.getByText('7')).toBeTruthy(); // uv index max rounded
    expect(screen.getByText('8-Day Forecast')).toBeTruthy();
  });
});
