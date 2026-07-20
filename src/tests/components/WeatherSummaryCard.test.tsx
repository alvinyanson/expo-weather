import { cleanup, render, screen } from '@testing-library/react';
import { WeatherSummaryCard } from '@/components/WeatherSummaryCard';
import type { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const weather = {
  current: { temperature_2m: 28.5, relative_humidity_2m: 80, wind_speed_10m: 15, weather_code: 0 },
  daily: { uv_index_max: [8] },
} as unknown as WeatherResponse;

afterEach(() => {
  cleanup();
});

describe('WeatherSummaryCard', () => {
  it('renders correctly', () => {
    render(<WeatherSummaryCard weather={weather} tempUnit="°C" windUnit="km/h" />);

    expect(screen.getByText('29°C')).toBeTruthy(); // Math.round(28.5)
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('15 km/h')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy(); // UV Index
  });
});
