import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeatherRouteHandler from '@/app/weather';
import Toast from 'react-native-toast-message';

const { mockParams, mockRedirect } = vi.hoisted(() => ({
  mockParams: { current: {} as any },
  mockRedirect: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams.current,
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
}));

vi.mock('react-native-toast-message', () => ({
  default: {
    show: vi.fn(),
  },
}));

describe('WeatherRouteHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /details with formatted params when query is valid', () => {
    mockParams.current = { lat: '14.5995', lon: '120.9842', city: 'Manila' };

    render(<WeatherRouteHandler />);

    expect(mockRedirect).toHaveBeenCalledWith({
      href: {
        pathname: '/details',
        params: {
          lat: '14.5995',
          lon: '120.9842',
          city: 'Manila',
        },
      },
    });
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('shows error toast and redirects to / when query is invalid', () => {
    mockParams.current = { lat: '999', lon: '120.9842', city: 'Manila' };

    render(<WeatherRouteHandler />);

    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Invalid Link',
      text2: 'The weather link is invalid or incomplete.',
    });

    expect(mockRedirect).toHaveBeenCalledWith({
      href: '/',
    });
  });
});
