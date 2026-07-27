import { WeatherHistoryRow } from '@/components/WeatherHistoryRow';
import type { WeatherHistoryRow as WeatherHistoryRowType } from '@/interfaces';
import { formatTime } from '@/utils/formatters';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-symbols', () => ({
  SymbolView: (props: { name: unknown }) => (
    <span data-testid="symbol-view" data-name={JSON.stringify(props.name)} />
  ),
}));

const mockRowCelsiusKmh: WeatherHistoryRowType = {
  id: 1,
  fetched_at: '2026-07-23T14:30:00.000Z',
  latitude: 14.5995,
  longitude: 120.9842,
  city: 'Manila',
  temperature: 28.4,
  weather_code: 0,
  humidity: 65,
  wind_speed: 12.8,
  pressure: 1013.2,
  temp_max: 33,
  temp_min: 24,
  temperature_unit: 'celsius',
  wind_speed_unit: 'kmh',
};

const mockRowFahrenheitMphNullPressure: WeatherHistoryRowType = {
  id: 2,
  fetched_at: '2026-07-23T16:45:00.000Z',
  latitude: 40.7128,
  longitude: -74.006,
  city: 'New York',
  temperature: 75.6,
  weather_code: 3,
  humidity: 80,
  wind_speed: 8.2,
  pressure: null,
  temp_max: 82,
  temp_min: 68,
  temperature_unit: 'fahrenheit',
  wind_speed_unit: 'mph',
};

describe('WeatherHistoryRow', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders formatted timestamp, temperature in °C, humidity, wind speed in km/h, and pressure in hPa', () => {
    render(<WeatherHistoryRow row={mockRowCelsiusKmh} />);

    const expectedTime = formatTime(mockRowCelsiusKmh.fetched_at);
    expect(screen.getByText(expectedTime)).toBeTruthy();
    expect(screen.getByText('28°C')).toBeTruthy(); // Math.round(28.4)
    expect(screen.getByText('65%')).toBeTruthy();
    expect(screen.getByText('13 km/h')).toBeTruthy(); // Math.round(12.8)
    expect(screen.getByText('1013 hPa')).toBeTruthy(); // Math.round(1013.2)
  });

  it('renders temperature in °F and wind speed in mph when units are fahrenheit and mph', () => {
    render(<WeatherHistoryRow row={mockRowFahrenheitMphNullPressure} />);

    const expectedTime = formatTime(mockRowFahrenheitMphNullPressure.fetched_at);
    expect(screen.getByText(expectedTime)).toBeTruthy();
    expect(screen.getByText('76°F')).toBeTruthy(); // Math.round(75.6)
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('8 mph')).toBeTruthy(); // Math.round(8.2)
  });

  it('renders pressure fallback dash "—" when pressure is null or undefined', () => {
    render(<WeatherHistoryRow row={mockRowFahrenheitMphNullPressure} />);

    expect(screen.getByText('—')).toBeTruthy();
  });

  it('renders weather symbol views', () => {
    render(<WeatherHistoryRow row={mockRowCelsiusKmh} />);

    const symbols = screen.getAllByTestId('symbol-view');
    expect(symbols.length).toBeGreaterThan(0);
  });
});
