import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import HomeScreen from '@/app/index';

const { pushMock, backMock } = vi.hoisted(() => ({ pushMock: vi.fn(), backMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
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
    time: ['2026-06-18'],
    weather_code: [0],
    temperature_2m_max: [30],
    temperature_2m_min: [20],
    uv_index_max: [7],
  },
};

const hookState = (overrides = {}) =>
  ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }) as never;

afterEach(cleanup);

describe('HomeScreen', () => {
  it('shows the loading indicator while fetching', () => {
    mockLocationHook.mockReturnValue(hookState({ isLoading: true }));
    mockWeatherHook.mockReturnValue(hookState({ isLoading: true }));

    render(<HomeScreen />);

    expect(screen.getByText('Fetching weather data...')).toBeTruthy();
  });

  it('renders the city, temperature and condition once loaded', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));

    render(<HomeScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('24°C')).toBeTruthy(); // 23.6 rounded
    expect(screen.getByText('Clear Sky')).toBeTruthy(); // weather_code 0
    expect(screen.getByText('Tap for more details')).toBeTruthy();
  });

  it('navigates to the details screen when the hero is pressed', () => {
    mockLocationHook.mockReturnValue(hookState({ data: location }));
    mockWeatherHook.mockReturnValue(hookState({ data: weather }));

    render(<HomeScreen />);
    fireEvent.click(screen.getByText('24°C'));

    expect(pushMock).toHaveBeenCalledWith('/details');
  });

  it('shows the error message and retries on press', () => {
    const refetchLocation = vi.fn();
    const refetchWeather = vi.fn();
    mockLocationHook.mockReturnValue(
      hookState({ error: new Error('Permission denied'), refetch: refetchLocation }),
    );
    mockWeatherHook.mockReturnValue(hookState({ refetch: refetchWeather }));

    render(<HomeScreen />);
    expect(screen.getByText('Permission denied')).toBeTruthy();

    fireEvent.click(screen.getByText('Retry'));
    expect(refetchLocation).toHaveBeenCalled();
    expect(refetchWeather).toHaveBeenCalled();
  });
});
