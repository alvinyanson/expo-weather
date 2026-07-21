import { create } from 'zustand';
import { BatteryState } from 'expo-battery';

interface BatteryStore {
  isLowPowerMode: boolean;
  batteryLevel: number;
  batteryState: BatteryState;
  isBatterySaverActive: boolean;
  setBatteryStatus: (status: {
    isLowPowerMode?: boolean;
    batteryLevel?: number;
    batteryState?: BatteryState;
  }) => void;
}

const computeIsBatterySaverActive = (
  isLowPowerMode: boolean,
  batteryLevel: number,
  batteryState: BatteryState,
): boolean => {
  if (isLowPowerMode) return true;
  if (batteryLevel >= 0 && batteryLevel <= 0.2 && batteryState === BatteryState.UNPLUGGED) {
    return true;
  }
  return false;
};

export const useBatteryStore = create<BatteryStore>()((set, get) => ({
  isLowPowerMode: false,
  batteryLevel: -1,
  batteryState: BatteryState.UNKNOWN,
  isBatterySaverActive: false,
  setBatteryStatus: (status) => {
    const current = get();
    const nextLowPower = status.isLowPowerMode ?? current.isLowPowerMode;
    const nextLevel = status.batteryLevel ?? current.batteryLevel;
    const nextState = status.batteryState ?? current.batteryState;

    set({
      isLowPowerMode: nextLowPower,
      batteryLevel: nextLevel,
      batteryState: nextState,
      isBatterySaverActive: computeIsBatterySaverActive(nextLowPower, nextLevel, nextState),
    });
  },
}));
