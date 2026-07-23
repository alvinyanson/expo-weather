import { cleanup, render, screen } from '@testing-library/react';
import { HourlyTemperatureChart } from '@/components/HourlyTemperatureChart';
import { WeatherResponse } from '@/interfaces';

vi.mock('react-native-svg', () => {
  const React = require('react');
  const Dummy = ({ children, ...props }: any) => React.createElement('div', props, children);
  return {
    __esModule: true,
    default: Dummy,
    Path: Dummy,
    Rect: Dummy,
    Circle: Dummy,
    Text: Dummy,
  };
});

const mockNow = Date.now();
const hour1 = new Date(mockNow + 3600000).toISOString();
const hour2 = new Date(mockNow + 7200000).toISOString();

const validWeather = {
  current: { temperature_2m: 23 },
  hourly: {
    time: [hour1, hour2],
    temperature_2m: [25, 27],
    precipitation_probability: [10, 20],
  },
} as unknown as WeatherResponse;

afterEach(() => {
  cleanup();
});

describe('HourlyTemperatureChart', () => {
  it('renders chart card and title when valid hourly data is provided', () => {
    const { container } = render(<HourlyTemperatureChart weather={validWeather} tempUnit="°C" />);

    expect(screen.getByTestId('hourly-temperature-chart')).toBeTruthy();
    expect(screen.getByText('Next 24 Hours')).toBeTruthy();
    expect(container.firstChild).not.toBeNull();
  });

  it('returns null when hourly is missing', () => {
    const emptyWeather = { current: { temperature_2m: 23 } } as unknown as WeatherResponse;
    const { container } = render(<HourlyTemperatureChart weather={emptyWeather} tempUnit="°C" />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when hourly points count is less than 2', () => {
    const singlePointWeather = {
      current: { temperature_2m: 23 },
      hourly: {
        time: [hour1],
        temperature_2m: [25],
        precipitation_probability: [10],
      },
    } as unknown as WeatherResponse;

    const { container } = render(
      <HourlyTemperatureChart weather={singlePointWeather} tempUnit="°C" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
