import { describe, it, expect, vi } from 'vitest';
import type { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

import { buildWeatherShareMessage } from '@/utils/shareWeather';

const weather = {
  current: { temperature_2m: 23.6, weather_code: 0, relative_humidity_2m: 60, wind_speed_10m: 12 },
  daily: {
    time: ['2026-06-18', '2026-06-19'],
    weather_code: [0, 3],
    temperature_2m_max: [30.4, 28],
    temperature_2m_min: [19.7, 19],
    uv_index_max: [7, 5],
  },
} as unknown as WeatherResponse;

describe('buildWeatherShareMessage', () => {
  it('composes the localized summary with city, condition, temp, high and low', () => {
    const message = buildWeatherShareMessage({ city: 'Manila', weather, tempUnit: '°C' });

    // Clear Sky for code 0, 24 (23.6), high 30, low 20
    expect(message).toBe('Manila: Clear Sky, 24°C now (high 30°C, low 20°C).');
  });

  it('interpolates the provided temperature unit', () => {
    const message = buildWeatherShareMessage({ city: 'Manila', weather, tempUnit: '°F' });

    expect(message).toContain('24°F');
    expect(message).toContain('high 30°F');
    expect(message).toContain('low 20°F');
  });

  it('falls back to 0 when daily high/low are missing', () => {
    const noDaily = {
      current: { temperature_2m: 10, weather_code: 0 },
      daily: { temperature_2m_max: [], temperature_2m_min: [] },
    } as unknown as WeatherResponse;

    const message = buildWeatherShareMessage({ city: 'Nowhere', weather: noDaily, tempUnit: '°C' });

    expect(message).toBe('Nowhere: Clear Sky, 10°C now (high 0°C, low 0°C).');
  });
});
