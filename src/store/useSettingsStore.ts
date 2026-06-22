import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph';

interface SettingsStore {
  temperatureUnit: TemperatureUnit;
  windSpeedUnit: WindSpeedUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setWindSpeedUnit: (unit) => set({ windSpeedUnit: unit }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
