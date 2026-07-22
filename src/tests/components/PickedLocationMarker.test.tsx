import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PickedLocationMarker } from '@/components/PickedLocationMarker';

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

const defaultProps = {
  latitude: 35.68,
  longitude: 139.69,
  city: 'Tokyo',
  isResolvingCity: false,
  isSaved: false,
  onViewDetails: vi.fn(),
  onToggleSave: vi.fn(),
  onDismiss: vi.fn(),
};

const renderMarker = (props = {}) => render(<PickedLocationMarker {...defaultProps} {...props} />);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PickedLocationMarker', () => {
  it('renders the resolving placeholder when city resolution is in progress', () => {
    mockWeatherHook.mockReturnValue(weatherHookState({ isLoading: true }));

    renderMarker({ isResolvingCity: true, city: 'Unknown Location' });

    expect(screen.getByText('Resolving location…')).toBeTruthy();
    expect(screen.getByTestId('picked-marker-loading')).toBeTruthy();
  });

  it('renders the resolved city name and loaded weather data', () => {
    mockWeatherHook.mockReturnValue(weatherHookState({ data: weather }));

    renderMarker();

    expect(screen.getByText('Tokyo')).toBeTruthy();
    expect(screen.getByText('24°C')).toBeTruthy();
    expect(screen.getByText('Clear Sky')).toBeTruthy();
    expect(screen.queryByTestId('picked-marker-loading')).toBeNull();
  });

  it('triggers onViewDetails when view details button is pressed', () => {
    const onViewDetails = vi.fn();
    mockWeatherHook.mockReturnValue(weatherHookState({ data: weather }));

    renderMarker({ onViewDetails });

    fireEvent.click(screen.getByTestId('picked-marker-details'));

    expect(onViewDetails).toHaveBeenCalledWith({
      id: 'picked-location',
      latitude: 35.68,
      longitude: 139.69,
      city: 'Tokyo',
      isCurrentLocation: false,
    });
  });

  it('triggers onToggleSave with coordinates and city when save button is pressed', () => {
    const onToggleSave = vi.fn();
    mockWeatherHook.mockReturnValue(weatherHookState({ data: weather }));

    renderMarker({ onToggleSave, isSaved: false });

    fireEvent.click(screen.getByTestId('picked-marker-save'));

    expect(onToggleSave).toHaveBeenCalledWith({
      lat: 35.68,
      lon: 139.69,
      city: 'Tokyo',
    });
  });

  it('triggers onDismiss when dismiss button is pressed', () => {
    const onDismiss = vi.fn();
    mockWeatherHook.mockReturnValue(weatherHookState({ data: weather }));

    renderMarker({ onDismiss });

    fireEvent.click(screen.getByTestId('picked-marker-dismiss'));

    expect(onDismiss).toHaveBeenCalled();
  });
});
