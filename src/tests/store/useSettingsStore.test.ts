import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '@/store/useSettingsStore';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  };
});

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      notificationsEnabled: false,
      expoPushToken: undefined,
      language: 'system',
      hapticsEnabled: true,
    });
    vi.clearAllMocks();
  });

  it('has default units, language, and notification settings', () => {
    const state = useSettingsStore.getState();
    expect(state.temperatureUnit).toBe('celsius');
    expect(state.windSpeedUnit).toBe('kmh');
    expect(state.notificationsEnabled).toBe(false);
    expect(state.language).toBe('system');
    expect(state.expoPushToken).toBeUndefined();
    expect(state.hapticsEnabled).toBe(true);
  });

  it('can set hapticsEnabled', () => {
    useSettingsStore.getState().setHapticsEnabled(false);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);

    useSettingsStore.getState().setHapticsEnabled(true);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(true);
  });

  it('can set temperatureUnit', () => {
    useSettingsStore.getState().setTemperatureUnit('fahrenheit');
    expect(useSettingsStore.getState().temperatureUnit).toBe('fahrenheit');
    expect(useSettingsStore.getState().windSpeedUnit).toBe('kmh');
  });

  it('can set windSpeedUnit', () => {
    useSettingsStore.getState().setWindSpeedUnit('mph');
    expect(useSettingsStore.getState().temperatureUnit).toBe('celsius');
    expect(useSettingsStore.getState().windSpeedUnit).toBe('mph');
  });

  it('can set notificationsEnabled', () => {
    useSettingsStore.getState().setNotificationsEnabled(true);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });

  it('can set language', () => {
    useSettingsStore.getState().setLanguage('ja');
    expect(useSettingsStore.getState().language).toBe('ja');

    useSettingsStore.getState().setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('can set and clear expoPushToken', () => {
    useSettingsStore.getState().setExpoPushToken('push-token-123');
    expect(useSettingsStore.getState().expoPushToken).toBe('push-token-123');

    useSettingsStore.getState().setExpoPushToken(undefined);
    expect(useSettingsStore.getState().expoPushToken).toBeUndefined();
  });
});
