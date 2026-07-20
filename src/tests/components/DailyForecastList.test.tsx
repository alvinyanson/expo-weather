import { cleanup, render, screen } from '@testing-library/react';
import { DailyForecastList } from '@/components/DailyForecastList';
import type { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const weather = {
  daily: {
    time: ['2026-06-18', '2026-06-19'],
    weather_code: [0, 1],
    temperature_2m_max: [30.1, 32.5],
    temperature_2m_min: [24.4, 25.1],
  },
} as unknown as WeatherResponse;

afterEach(() => {
  cleanup();
});

describe('DailyForecastList', () => {
  it('renders forecast items', () => {
    const onRefresh = vi.fn();
    render(
      <DailyForecastList
        weather={weather}
        tempUnit="°C"
        refreshing={false}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText('8-Day Forecast')).toBeTruthy();

    // Check first day (2026-06-18 is a Thursday)
    expect(screen.getByText('Thursday')).toBeTruthy();
    expect(screen.getByText('30°C')).toBeTruthy();
    expect(screen.getByText('24°C')).toBeTruthy();

    // Check second day (2026-06-19 is a Friday)
    expect(screen.getByText('Friday')).toBeTruthy();
    expect(screen.getByText('33°C')).toBeTruthy(); // 32.5 rounded
    expect(screen.getByText('25°C')).toBeTruthy(); // 25.1 rounded
  });

  it('returns null if no daily data', () => {
    const onRefresh = vi.fn();
    const { container } = render(
      <DailyForecastList
        weather={{} as unknown as WeatherResponse}
        tempUnit="°C"
        refreshing={false}
        onRefresh={onRefresh}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
