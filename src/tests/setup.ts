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

// @maplibre/maplibre-react-native is a native module with no react-native-web
// equivalent, so tests can't render the real map. Replace it with passthrough
// stubs (render children only) so markers/callouts still land in the DOM -
// same approach as the expo-battery/expo-sensors mocks below.
vi.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const passthrough = ({ children }: any) => React.createElement(React.Fragment, null, children);
  return {
    Map: passthrough,
    Camera: () => null,
    Marker: passthrough,
    Callout: passthrough,
    ViewAnnotation: passthrough,
  };
});

vi.mock('expo-battery', () => ({
  BatteryState: {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  },
  isLowPowerModeEnabledAsync: vi.fn(() => Promise.resolve(false)),
  getBatteryLevelAsync: vi.fn(() => Promise.resolve(0.75)),
  getBatteryStateAsync: vi.fn(() => Promise.resolve(1)), // UNPLUGGED
  addLowPowerModeListener: vi.fn(() => ({ remove: vi.fn() })),
  addBatteryLevelListener: vi.fn(() => ({ remove: vi.fn() })),
  addBatteryStateListener: vi.fn(() => ({ remove: vi.fn() })),
}));
