import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const { shareMock } = vi.hoisted(() => ({ shareMock: vi.fn() }));

vi.mock('react-native', () => ({
  Share: {
    share: shareMock,
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}));

const { successMock, errorMock } = vi.hoisted(() => ({
  successMock: vi.fn(),
  errorMock: vi.fn(),
}));

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    selection: vi.fn(),
    success: successMock,
    error: errorMock,
    impact: vi.fn(),
  }),
}));

const { toastShowMock } = vi.hoisted(() => ({ toastShowMock: vi.fn() }));
vi.mock('react-native-toast-message', () => ({
  default: { show: toastShowMock },
}));

const { reportErrorMock } = vi.hoisted(() => ({ reportErrorMock: vi.fn() }));
vi.mock('@/services/crash.service', () => ({
  reportError: reportErrorMock,
}));

import { useShareWeather } from '@/hooks/useShareWeather';

const weather = {
  current: { temperature_2m: 23.6, weather_code: 0 },
  daily: { temperature_2m_max: [30], temperature_2m_min: [20] },
} as unknown as WeatherResponse;

const args = { city: 'Manila', weather, tempUnit: '°C' };

describe('useShareWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls Share.share with the composed message and dialog title', async () => {
    shareMock.mockResolvedValueOnce({ action: 'sharedAction' });
    const { result } = renderHook(() => useShareWeather());

    await result.current.share(args);

    expect(shareMock).toHaveBeenCalledWith(
      { message: 'Manila: Clear Sky, 24°C now (high 30°C, low 20°C).', title: 'Share weather' },
      { dialogTitle: 'Share weather' },
    );
  });

  it('fires a success haptic when the share completes', async () => {
    shareMock.mockResolvedValueOnce({ action: 'sharedAction' });
    const { result } = renderHook(() => useShareWeather());

    await result.current.share(args);

    expect(successMock).toHaveBeenCalledTimes(1);
    expect(toastShowMock).not.toHaveBeenCalled();
  });

  it('is a silent no-op when the user dismisses the sheet', async () => {
    shareMock.mockResolvedValueOnce({ action: 'dismissedAction' });
    const { result } = renderHook(() => useShareWeather());

    await result.current.share(args);

    expect(successMock).not.toHaveBeenCalled();
    expect(toastShowMock).not.toHaveBeenCalled();
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it('reports the error and shows a toast when Share throws, without rethrowing', async () => {
    const err = new Error('boom');
    shareMock.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useShareWeather());

    await expect(result.current.share(args)).resolves.toBeUndefined();

    expect(reportErrorMock).toHaveBeenCalledWith(err, { where: 'useShareWeather.share' });
    expect(toastShowMock).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Share failed',
      text2: 'Could not share the weather. Please try again.',
    });
    expect(successMock).not.toHaveBeenCalled();
  });
});
