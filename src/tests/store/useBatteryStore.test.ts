import { describe, it, expect, beforeEach } from 'vitest';
import { BatteryState } from 'expo-battery';
import { useBatteryStore } from '@/store/useBatteryStore';

describe('useBatteryStore', () => {
  beforeEach(() => {
    useBatteryStore.setState({
      isLowPowerMode: false,
      batteryLevel: -1,
      batteryState: BatteryState.UNKNOWN,
      isBatterySaverActive: false,
    });
  });

  it('has correct default values', () => {
    const state = useBatteryStore.getState();
    expect(state.isLowPowerMode).toBe(false);
    expect(state.batteryLevel).toBe(-1);
    expect(state.batteryState).toBe(BatteryState.UNKNOWN);
    expect(state.isBatterySaverActive).toBe(false);
  });

  it('activates battery saver when low power mode is on', () => {
    useBatteryStore.getState().setBatteryStatus({ isLowPowerMode: true });
    expect(useBatteryStore.getState().isBatterySaverActive).toBe(true);
  });

  it('activates battery saver when battery level <= 20% and unplugged', () => {
    useBatteryStore.getState().setBatteryStatus({
      batteryLevel: 0.15,
      batteryState: BatteryState.UNPLUGGED,
    });
    expect(useBatteryStore.getState().isBatterySaverActive).toBe(true);
  });

  it('activates battery saver at exactly 20% when unplugged', () => {
    useBatteryStore.getState().setBatteryStatus({
      batteryLevel: 0.2,
      batteryState: BatteryState.UNPLUGGED,
    });
    expect(useBatteryStore.getState().isBatterySaverActive).toBe(true);
  });

  it('does NOT activate battery saver when low battery but charging', () => {
    useBatteryStore.getState().setBatteryStatus({
      batteryLevel: 0.1,
      batteryState: BatteryState.CHARGING,
    });
    expect(useBatteryStore.getState().isBatterySaverActive).toBe(false);
  });

  it('does NOT activate battery saver when battery is above 20% and unplugged', () => {
    useBatteryStore.getState().setBatteryStatus({
      batteryLevel: 0.25,
      batteryState: BatteryState.UNPLUGGED,
    });
    expect(useBatteryStore.getState().isBatterySaverActive).toBe(false);
  });

  it('does NOT activate battery saver when battery level is unknown', () => {
    useBatteryStore.getState().setBatteryStatus({
      batteryLevel: -1,
      batteryState: BatteryState.UNPLUGGED,
    });
    expect(useBatteryStore.getState().isBatterySaverActive).toBe(false);
  });

  it('merges partial updates without overwriting other fields', () => {
    useBatteryStore.getState().setBatteryStatus({
      batteryLevel: 0.5,
      batteryState: BatteryState.UNPLUGGED,
    });
    useBatteryStore.getState().setBatteryStatus({ isLowPowerMode: true });
    const state = useBatteryStore.getState();
    expect(state.batteryLevel).toBe(0.5);
    expect(state.batteryState).toBe(BatteryState.UNPLUGGED);
    expect(state.isLowPowerMode).toBe(true);
    expect(state.isBatterySaverActive).toBe(true);
  });
});
