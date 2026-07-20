import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CurrentWeather } from '@/components/CurrentWeather';
import type { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const weather = {
  current: { temperature_2m: 23.6, weather_code: 0, relative_humidity_2m: 60, wind_speed_10m: 12 },
  hourly: {
    time: [new Date().toISOString()],
    temperature_2m: [23.6],
    weather_code: [0],
    precipitation_probability: [0],
  },
  daily: {
    time: ['2026-06-18'],
    weather_code: [0],
    temperature_2m_max: [30],
    temperature_2m_min: [20],
    uv_index_max: [7],
  },
} as unknown as WeatherResponse;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CurrentWeather', () => {
  it('renders city, temperature, and conditions', () => {
    const onPress = vi.fn();
    render(<CurrentWeather city="Manila" weather={weather} tempUnit="°C" onPress={onPress} />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('24°C')).toBeTruthy(); // Math.round(23.6)
    expect(screen.getByText('Clear Sky')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = vi.fn();
    render(<CurrentWeather city="Manila" weather={weather} tempUnit="°C" onPress={onPress} />);

    fireEvent.click(screen.getByText('24°C'));
    expect(onPress).toHaveBeenCalled();
  });
});
