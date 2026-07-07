import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph';

interface SettingsStore {
  temperatureUnit: TemperatureUnit;
  windSpeedUnit: WindSpeedUnit;
  notificationsEnabled: boolean;
  expoPushToken?: string;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setExpoPushToken: (token?: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      notificationsEnabled: false,
      expoPushToken: undefined,
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setWindSpeedUnit: (unit) => set({ windSpeedUnit: unit }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setExpoPushToken: (token) => set({ expoPushToken: token }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
