import { useEffect } from 'react';
import * as Battery from 'expo-battery';
import { useBatteryStore } from '@/store/useBatteryStore';

export const useBatteryMonitor = (): void => {
  useEffect(() => {
    const fetchInitialStatus = async () => {
      const [isLowPowerMode, batteryLevel, batteryState] = await Promise.all([
        Battery.isLowPowerModeEnabledAsync(),
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
      ]);

      useBatteryStore.getState().setBatteryStatus({
        isLowPowerMode,
        batteryLevel,
        batteryState,
      });
    };

    fetchInitialStatus();

    const lowPowerSub = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
      useBatteryStore.getState().setBatteryStatus({ isLowPowerMode: lowPowerMode });
    });

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      useBatteryStore.getState().setBatteryStatus({ batteryLevel });
    });

    const stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
      useBatteryStore.getState().setBatteryStatus({ batteryState });
    });

    return () => {
      lowPowerSub.remove();
      levelSub.remove();
      stateSub.remove();
    };
  }, []);
};
