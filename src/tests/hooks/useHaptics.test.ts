import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettingsStore } from '@/store/useSettingsStore';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const { selectionAsync, notificationAsync, impactAsync } = vi.hoisted(() => ({
  selectionAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
  impactAsync: vi.fn(() => Promise.resolve()),
}));

vi.mock('expo-haptics', () => ({
  selectionAsync,
  notificationAsync,
  impactAsync,
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

describe('useHaptics', () => {
  beforeEach(() => {
    useSettingsStore.setState({ hapticsEnabled: true });
    vi.clearAllMocks();
  });

  it('selection() calls Haptics.selectionAsync', () => {
    const { result } = renderHook(() => useHaptics());
    result.current.selection();
    expect(selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('success() calls notificationAsync with Success', () => {
    const { result } = renderHook(() => useHaptics());
    result.current.success();
    expect(notificationAsync).toHaveBeenCalledWith('success');
  });

  it('error() calls notificationAsync with Error', () => {
    const { result } = renderHook(() => useHaptics());
    result.current.error();
    expect(notificationAsync).toHaveBeenCalledWith('error');
  });

  it('impact() defaults to Light style', () => {
    const { result } = renderHook(() => useHaptics());
    result.current.impact();
    expect(impactAsync).toHaveBeenCalledWith('light');
  });

  it('impact() accepts an explicit style', () => {
    const { result } = renderHook(() => useHaptics());
    result.current.impact('medium' as never);
    expect(impactAsync).toHaveBeenCalledWith('medium');
  });

  it('swallows rejections (fire-and-forget)', () => {
    selectionAsync.mockRejectedValueOnce(new Error('no vibrator'));
    const { result } = renderHook(() => useHaptics());
    expect(() => result.current.selection()).not.toThrow();
  });

  it('is a no-op for every helper when hapticsEnabled is false', () => {
    useSettingsStore.setState({ hapticsEnabled: false });
    const { result } = renderHook(() => useHaptics());
    result.current.selection();
    result.current.success();
    result.current.error();
    result.current.impact();
    expect(selectionAsync).not.toHaveBeenCalled();
    expect(notificationAsync).not.toHaveBeenCalled();
    expect(impactAsync).not.toHaveBeenCalled();
  });
});
