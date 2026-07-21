import { vi } from 'vitest';

// Define global __DEV__ for react-native/expo packages in testing environment
vi.stubGlobal('__DEV__', true);

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
  getCalendars: () => [
    { calendar: 'gregorian', timeZone: 'UTC', uses24hourClock: true, firstWeekday: 1 },
  ],
}));

vi.mock('react-native-toast-message', () => ({
  default: {
    show: vi.fn(),
    hide: vi.fn(),
  },
}));

vi.mock('@react-native-firebase/crashlytics', () => ({
  default: () => ({
    recordError: vi.fn(),
    log: vi.fn(),
    setUserId: vi.fn(),
    setAttributes: vi.fn(),
    setCrashlyticsCollectionEnabled: vi.fn(),
    crash: vi.fn(),
  }),
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-haptics', () => ({
  selectionAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
  impactAsync: vi.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('expo-sensors', () => ({
  Barometer: {
    isAvailableAsync: vi.fn(() => Promise.resolve(false)),
    setUpdateInterval: vi.fn(),
    addListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));
