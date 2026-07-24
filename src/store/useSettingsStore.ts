import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvZustandStorage } from '@/services/storage';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph';
export type Language = 'system' | 'en' | 'ja';

interface SettingsStore {
  temperatureUnit: TemperatureUnit;
  windSpeedUnit: WindSpeedUnit;
  notificationsEnabled: boolean;
  expoPushToken?: string;
  language: Language;
  hapticsEnabled: boolean;
  batterySaverAware: boolean;
  backgroundRefreshEnabled: boolean;
  lastBackgroundWeatherCode: number | null;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setExpoPushToken: (token?: string) => void;
  setLanguage: (lang: Language) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setBatterySaverAware: (enabled: boolean) => void;
  setBackgroundRefreshEnabled: (enabled: boolean) => void;
  setLastBackgroundWeatherCode: (code: number | null) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      notificationsEnabled: false,
      expoPushToken: undefined,
      language: 'system',
      hapticsEnabled: true,
      batterySaverAware: true,
      backgroundRefreshEnabled: false,
      lastBackgroundWeatherCode: null,
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setWindSpeedUnit: (unit) => set({ windSpeedUnit: unit }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setExpoPushToken: (token) => set({ expoPushToken: token }),
      setLanguage: (lang) => set({ language: lang }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setBatterySaverAware: (enabled) => set({ batterySaverAware: enabled }),
      setBackgroundRefreshEnabled: (enabled) => set({ backgroundRefreshEnabled: enabled }),
      setLastBackgroundWeatherCode: (code) => set({ lastBackgroundWeatherCode: code }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvZustandStorage),
    },
  ),
);
