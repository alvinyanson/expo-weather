import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import MapScreen from '@/app/map';

const { backMock, pushMock } = vi.hoisted(() => ({ backMock: vi.fn(), pushMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: backMock, push: pushMock }),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/hooks', () => ({
  useFetchLocation: vi.fn(),
  useSavedLocations: vi.fn(),
  useFetchWeather: vi.fn(),
}));

import { useFetchLocation, useSavedLocations, useFetchWeather } from '@/hooks';

const mockLocationHook = vi.mocked(useFetchLocation);
const mockSavedHook = vi.mocked(useSavedLocations);
const mockWeatherHook = vi.mocked(useFetchWeather);

const gpsLocation = { latitude: 14.6, longitude: 120.98, city: 'Manila' };
const savedLocations = [
  { id: '1', city: 'Tokyo', lat: 35.68, lon: 139.69, userId: 'u1', createdAt: 1700000000000 },
  { id: '2', city: 'Osaka', lat: 34.69, lon: 135.5, userId: 'u1', createdAt: 1700000000001 },
];

const weather = {
  current: { temperature_2m: 23.6, weather_code: 0, relative_humidity_2m: 60, wind_speed_10m: 12 },
} as never;

const locationState = (overrides = {}) => ({ data: undefined, ...overrides }) as never;
const savedState = (locations: unknown[] = []) => ({ savedLocations: locations }) as never;
const weatherState = (overrides = {}) =>
  ({ data: undefined, isLoading: false, ...overrides }) as never;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MapScreen', () => {
  it('renders a current-location marker when a GPS fix is available', () => {
    mockLocationHook.mockReturnValue(locationState({ data: gpsLocation }));
    mockSavedHook.mockReturnValue(savedState([]));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    expect(screen.getByTestId('map-marker-current-location')).toBeTruthy();
    expect(screen.queryByTestId('map-empty')).toBeNull();
  });

  it('renders one marker per saved location when there is no GPS fix', () => {
    mockLocationHook.mockReturnValue(locationState());
    mockSavedHook.mockReturnValue(savedState(savedLocations));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    expect(screen.queryByTestId('map-marker-current-location')).toBeNull();
    expect(screen.getByTestId('map-marker-1')).toBeTruthy();
    expect(screen.getByTestId('map-marker-2')).toBeTruthy();
  });

  it('renders both GPS and saved-location markers together', () => {
    mockLocationHook.mockReturnValue(locationState({ data: gpsLocation }));
    mockSavedHook.mockReturnValue(savedState(savedLocations));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    expect(screen.getByTestId('map-marker-current-location')).toBeTruthy();
    expect(screen.getByTestId('map-marker-1')).toBeTruthy();
    expect(screen.getByTestId('map-marker-2')).toBeTruthy();
  });

  it('shows the empty state when there is no GPS fix and no saved locations', () => {
    mockLocationHook.mockReturnValue(locationState());
    mockSavedHook.mockReturnValue(savedState([]));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    expect(screen.getByTestId('map-empty')).toBeTruthy();
    expect(screen.queryByTestId('map-marker-current-location')).toBeNull();
  });

  it('navigates to details with the marker coordinates when its callout is pressed', () => {
    mockLocationHook.mockReturnValue(locationState({ data: gpsLocation }));
    mockSavedHook.mockReturnValue(savedState([]));
    mockWeatherHook.mockReturnValue(weatherState({ data: weather }));

    render(<MapScreen />);

    // Select the marker so its callout renders, then tap the callout.
    fireEvent.click(screen.getByTestId('map-marker-current-location'));
    fireEvent.click(screen.getByTestId('map-marker-callout'));

    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: { lat: 14.6, lon: 120.98, city: 'Manila' },
    });
  });

  it('renders zoom controls over the map and handles presses without crashing', () => {
    mockLocationHook.mockReturnValue(locationState({ data: gpsLocation }));
    mockSavedHook.mockReturnValue(savedState([]));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    const zoomIn = screen.getByTestId('map-zoom-in-button');
    const zoomOut = screen.getByTestId('map-zoom-out-button');
    expect(zoomIn).toBeTruthy();
    expect(zoomOut).toBeTruthy();

    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
  });

  it('does not render zoom controls in the empty state', () => {
    mockLocationHook.mockReturnValue(locationState());
    mockSavedHook.mockReturnValue(savedState([]));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    expect(screen.queryByTestId('map-zoom-in-button')).toBeNull();
    expect(screen.queryByTestId('map-zoom-out-button')).toBeNull();
  });

  it('goes back when the header back button is pressed', () => {
    mockLocationHook.mockReturnValue(locationState());
    mockSavedHook.mockReturnValue(savedState([]));
    mockWeatherHook.mockReturnValue(weatherState());

    render(<MapScreen />);

    fireEvent.click(screen.getByTestId('map-back-button'));

    expect(backMock).toHaveBeenCalled();
  });
});
