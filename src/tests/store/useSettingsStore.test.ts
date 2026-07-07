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
    });
    vi.clearAllMocks();
  });

  it('has default units', () => {
    expect(useSettingsStore.getState().temperatureUnit).toBe('celsius');
    expect(useSettingsStore.getState().windSpeedUnit).toBe('kmh');
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
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
});
