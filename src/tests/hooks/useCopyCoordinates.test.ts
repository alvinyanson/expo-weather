import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const { setStringAsyncMock } = vi.hoisted(() => ({ setStringAsyncMock: vi.fn() }));
vi.mock('expo-clipboard', () => ({
  setStringAsync: setStringAsyncMock,
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

import { useCopyCoordinates } from '@/hooks/useCopyCoordinates';

describe('useCopyCoordinates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes the formatted coordinates to the clipboard', async () => {
    setStringAsyncMock.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useCopyCoordinates());

    await result.current.copy(14.5995, 120.9842);

    expect(setStringAsyncMock).toHaveBeenCalledWith('14.5995, 120.9842');
  });

  it('fires a success haptic and a success toast on success', async () => {
    setStringAsyncMock.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useCopyCoordinates());

    await result.current.copy(14.5995, 120.9842);

    expect(successMock).toHaveBeenCalledTimes(1);
    expect(toastShowMock).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Coordinates copied',
      text2: '14.5995, 120.9842',
    });
    expect(errorMock).not.toHaveBeenCalled();
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it('reports the error and shows an error toast when the write throws, without rethrowing', async () => {
    const err = new Error('boom');
    setStringAsyncMock.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useCopyCoordinates());

    await expect(result.current.copy(14.5995, 120.9842)).resolves.toBeUndefined();

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(reportErrorMock).toHaveBeenCalledWith(err, { where: 'useCopyCoordinates.copy' });
    expect(toastShowMock).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Copy failed',
      text2: 'Could not copy the coordinates. Please try again.',
    });
    expect(successMock).not.toHaveBeenCalled();
  });
});
