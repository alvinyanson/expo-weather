import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useBarometer } from '@/hooks/useBarometer';

const { isAvailableAsync, setUpdateInterval, addListener, remove } = vi.hoisted(() => ({
  isAvailableAsync: vi.fn(),
  setUpdateInterval: vi.fn(),
  addListener: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('expo-sensors', () => ({
  Barometer: { isAvailableAsync, setUpdateInterval, addListener },
}));

// Captured listener so tests can emit a reading.
let emit: ((m: { pressure: number }) => void) | undefined;

beforeEach(() => {
  emit = undefined;
  addListener.mockImplementation((listener: (m: { pressure: number }) => void) => {
    emit = listener;
    return { remove };
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBarometer', () => {
  it('subscribes and emits the reading when the sensor is available', async () => {
    isAvailableAsync.mockResolvedValue(true);

    const { result } = renderHook(() => useBarometer());
    expect(result.current.status).toBe('checking');
    expect(result.current.pressure).toBeNull();

    await waitFor(() => expect(result.current.status).toBe('available'));
    expect(setUpdateInterval).toHaveBeenCalledWith(5000);

    act(() => emit?.({ pressure: 1013.2 }));
    expect(result.current.pressure).toBe(1013.2);
  });

  it('uses a custom interval', async () => {
    isAvailableAsync.mockResolvedValue(true);

    renderHook(() => useBarometer({ intervalMs: 500 }));

    await waitFor(() => expect(setUpdateInterval).toHaveBeenCalledWith(500));
  });

  it('sets status unavailable and never subscribes when the sensor is missing', async () => {
    isAvailableAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useBarometer());

    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(addListener).not.toHaveBeenCalled();
    expect(result.current.pressure).toBeNull();
  });

  it('removes the subscription on unmount', async () => {
    isAvailableAsync.mockResolvedValue(true);

    const { result, unmount } = renderHook(() => useBarometer());
    await waitFor(() => expect(result.current.status).toBe('available'));

    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
