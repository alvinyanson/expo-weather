import { cleanup, render, screen } from '@testing-library/react';
import { HourlyForecast } from '@/components/HourlyForecast';
import { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const mockTime = new Date(Date.now() + 3600000); // +1 hour

const weather = {
  current: {
    temperature_2m: 23.6,
    weather_code: 0,
    relative_humidity_2m: 60,
    wind_speed_10m: 12.4,
  },
  hourly: {
    time: [mockTime.toISOString()],
    temperature_2m: [25.1],
    weather_code: [1],
    precipitation_probability: [15],
  },
} as unknown as WeatherResponse;

afterEach(() => {
  cleanup();
});

describe('HourlyForecast', () => {
  it('renders the summary and hourly items', () => {
    render(<HourlyForecast weather={weather} />);

    // Summary text
    expect(screen.getByText(/Clear Sky conditions will continue/)).toBeTruthy();
    expect(screen.getByText(/12 km\/h/)).toBeTruthy();

    // Hourly item text
    expect(screen.getByText('Now')).toBeTruthy(); // first item is always 'Now'
    expect(screen.getByText('15%')).toBeTruthy();
    expect(screen.getByText('25°')).toBeTruthy();
  });

  it('returns null if no hourly data', () => {
    const emptyWeather = { current: weather.current } as unknown as WeatherResponse;
    const { container } = render(<HourlyForecast weather={emptyWeather} />);
    expect(container.firstChild).toBeNull();
  });
});
