import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as Battery from 'expo-battery';
import { useBatteryMonitor } from '@/hooks/useBatteryMonitor';
import { useBatteryStore } from '@/store/useBatteryStore';

vi.mock('expo-battery', () => {
  const BatteryState = {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  };
  return {
    BatteryState,
    isLowPowerModeEnabledAsync: vi.fn(() => Promise.resolve(false)),
    getBatteryLevelAsync: vi.fn(() => Promise.resolve(0.75)),
    getBatteryStateAsync: vi.fn(() => Promise.resolve(BatteryState.UNPLUGGED)),
    addLowPowerModeListener: vi.fn(() => ({ remove: vi.fn() })),
    addBatteryLevelListener: vi.fn(() => ({ remove: vi.fn() })),
    addBatteryStateListener: vi.fn(() => ({ remove: vi.fn() })),
  };
});

const mockBattery = vi.mocked(Battery);

describe('useBatteryMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBatteryStore.setState({
      isLowPowerMode: false,
      batteryLevel: -1,
      batteryState: Battery.BatteryState.UNKNOWN,
      isBatterySaverActive: false,
    });
  });

  it('fetches initial battery state on mount', async () => {
    renderHook(() => useBatteryMonitor());

    await vi.waitFor(() => {
      expect(mockBattery.isLowPowerModeEnabledAsync).toHaveBeenCalledTimes(1);
      expect(mockBattery.getBatteryLevelAsync).toHaveBeenCalledTimes(1);
      expect(mockBattery.getBatteryStateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('subscribes to all three battery event listeners', () => {
    renderHook(() => useBatteryMonitor());

    expect(mockBattery.addLowPowerModeListener).toHaveBeenCalledTimes(1);
    expect(mockBattery.addBatteryLevelListener).toHaveBeenCalledTimes(1);
    expect(mockBattery.addBatteryStateListener).toHaveBeenCalledTimes(1);
  });

  it('cleans up subscriptions on unmount', () => {
    const removeLowPower = vi.fn();
    const removeLevel = vi.fn();
    const removeState = vi.fn();

    mockBattery.addLowPowerModeListener.mockReturnValue({ remove: removeLowPower });
    mockBattery.addBatteryLevelListener.mockReturnValue({ remove: removeLevel });
    mockBattery.addBatteryStateListener.mockReturnValue({ remove: removeState });

    const { unmount } = renderHook(() => useBatteryMonitor());
    unmount();

    expect(removeLowPower).toHaveBeenCalledTimes(1);
    expect(removeLevel).toHaveBeenCalledTimes(1);
    expect(removeState).toHaveBeenCalledTimes(1);
  });

  it('updates store with initial battery values', async () => {
    mockBattery.isLowPowerModeEnabledAsync.mockResolvedValue(true);
    mockBattery.getBatteryLevelAsync.mockResolvedValue(0.15);
    mockBattery.getBatteryStateAsync.mockResolvedValue(Battery.BatteryState.UNPLUGGED);

    renderHook(() => useBatteryMonitor());

    await vi.waitFor(() => {
      const state = useBatteryStore.getState();
      expect(state.isLowPowerMode).toBe(true);
      expect(state.batteryLevel).toBe(0.15);
      expect(state.batteryState).toBe(Battery.BatteryState.UNPLUGGED);
      expect(state.isBatterySaverActive).toBe(true);
    });
  });
});
