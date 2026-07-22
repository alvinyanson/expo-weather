import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WeatherMapMarker } from '@/components/WeatherMapMarker';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/hooks', () => ({
  useFetchWeather: vi.fn(),
}));

import { useFetchWeather } from '@/hooks';

const mockWeatherHook = vi.mocked(useFetchWeather);

const weather = {
  current: { temperature_2m: 23.6, weather_code: 0, relative_humidity_2m: 60, wind_speed_10m: 12 },
} as never;

const weatherHookState = (overrides = {}) =>
  ({
    data: undefined,
    isLoading: false,
    ...overrides,
  }) as never;

const marker = {
  id: 'current-location',
  latitude: 14.6,
  longitude: 120.98,
  city: 'Manila',
  isCurrentLocation: true,
};

const renderMarker = (props = {}) =>
  render(
    <WeatherMapMarker
      marker={marker}
      isSelected={false}
      onToggleSelect={vi.fn()}
      onViewDetails={vi.fn()}
      {...props}
    />,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('WeatherMapMarker', () => {
  it('does not fetch weather while unselected', () => {
    mockWeatherHook.mockReturnValue(weatherHookState());

    renderMarker({ isSelected: false });

    expect(mockWeatherHook).toHaveBeenCalledWith(undefined);
    expect(screen.queryByTestId('map-marker-callout')).toBeNull();
  });

  it('fetches weather for its coordinates once selected', () => {
    mockWeatherHook.mockReturnValue(weatherHookState({ isLoading: true }));

    renderMarker({ isSelected: true });

    expect(mockWeatherHook).toHaveBeenCalledWith({
      latitude: 14.6,
      longitude: 120.98,
      city: 'Manila',
    });
  });

  it('shows a loading indicator in the callout while weather loads', () => {
    mockWeatherHook.mockReturnValue(weatherHookState({ isLoading: true }));

    renderMarker({ isSelected: true });

    expect(screen.getByTestId('map-marker-callout')).toBeTruthy();
    expect(screen.getByTestId('map-marker-loading')).toBeTruthy();
    expect(screen.getByText('Manila')).toBeTruthy();
  });

  it('renders the weather summary once loaded', () => {
    mockWeatherHook.mockReturnValue(weatherHookState({ data: weather }));

    renderMarker({ isSelected: true });

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('24°C')).toBeTruthy(); // 23.6 rounded
    expect(screen.getByText('Clear Sky')).toBeTruthy(); // weather_code 0
    expect(screen.queryByTestId('map-marker-loading')).toBeNull();
  });

  it('toggles selection when the pin is pressed', () => {
    const onToggleSelect = vi.fn();
    mockWeatherHook.mockReturnValue(weatherHookState());

    renderMarker({ isSelected: false, onToggleSelect });

    fireEvent.click(screen.getByTestId('map-marker-current-location'));

    expect(onToggleSelect).toHaveBeenCalledWith('current-location');
  });

  it('navigates to details when the callout is pressed', () => {
    const onViewDetails = vi.fn();
    mockWeatherHook.mockReturnValue(weatherHookState({ data: weather }));

    renderMarker({ isSelected: true, onViewDetails });

    fireEvent.click(screen.getByTestId('map-marker-callout'));

    expect(onViewDetails).toHaveBeenCalledWith(marker);
  });
});
