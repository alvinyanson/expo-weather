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

vi.mock('@react-native-firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signInWithCredential: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: vi.fn(),
    hasPlayServices: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    revokeAccess: vi.fn(),
    isSignedIn: vi.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
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
  // require() inside a hoisted vi.mock factory bypasses the react-native ->
  // react-native-web alias, so pull Pressable from react-native-web directly.
  const { Pressable } = require('react-native-web');
  const passthrough = ({ children }: any) => React.createElement(React.Fragment, null, children);
  const MapMock = ({ children, onLongPress }: any) =>
    React.createElement(
      React.Fragment,
      null,
      onLongPress &&
        React.createElement(Pressable, {
          testID: 'map-longpress-trigger',
          onPress: () =>
            onLongPress({
              nativeEvent: { lngLat: [121.0, 14.5] },
            }),
        }),
      children,
    );
  return {
    Map: MapMock,
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

vi.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native-web');
  return {
    default: {
      View: (props: any) => React.createElement(View, props),
    },
    useSharedValue: vi.fn((init) => ({ value: init })),
    useAnimatedStyle: vi.fn((cb) => (cb ? cb() : {})),
    withTiming: vi.fn((toValue) => toValue),
    withSpring: vi.fn((toValue) => toValue),
    withRepeat: vi.fn((animation) => animation),
    withSequence: vi.fn((...animations) => animations[0]),
    interpolate: vi.fn((value, inputRange, outputRange) => {
      if (!inputRange || !outputRange) return 0;
      const ratio = (value - inputRange[0]) / (inputRange[1] - inputRange[0]);
      return outputRange[0] + ratio * (outputRange[1] - outputRange[0]);
    }),
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    runOnJS: vi.fn((fn) => fn),
    Easing: {
      out: vi.fn(),
      in: vi.fn(),
      ease: vi.fn(),
      inOut: vi.fn(),
    },
  };
});

function gestureChainable(): any {
  return new Proxy(
    {},
    {
      get: () => () => gestureChainable(),
    },
  );
}

vi.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native-web');
  return {
    Gesture: { Pan: () => gestureChainable() },
    GestureDetector: ({ children }: any) => React.createElement(View, null, children),
  };
});

vi.mock('react-native-draggable-flatlist', () => {
  const React = require('react');
  const { FlatList } = require('react-native-web');
  return {
    default: ({ data, renderItem, keyExtractor, ...props }: any) =>
      React.createElement(FlatList, {
        data,
        keyExtractor,
        renderItem: ({ item, index }: any) =>
          renderItem?.({ item, index, drag: vi.fn(), isActive: false }),
        ...props,
      }),
  };
});

const mmkvStorageMap = new Map<string, string | number | boolean>();

vi.mock('react-native-mmkv', () => {
  const createMockInstance = () => ({
    set: vi.fn((key: string, value: string | number | boolean) => {
      mmkvStorageMap.set(key, value);
    }),
    getString: vi.fn((key: string) => {
      const val = mmkvStorageMap.get(key);
      return typeof val === 'string' ? val : undefined;
    }),
    getNumber: vi.fn((key: string) => {
      const val = mmkvStorageMap.get(key);
      return typeof val === 'number' ? val : undefined;
    }),
    getBoolean: vi.fn((key: string) => {
      const val = mmkvStorageMap.get(key);
      return typeof val === 'boolean' ? val : undefined;
    }),
    remove: vi.fn((key: string) => {
      mmkvStorageMap.delete(key);
    }),
    delete: vi.fn((key: string) => {
      mmkvStorageMap.delete(key);
    }),
    contains: vi.fn((key: string) => mmkvStorageMap.has(key)),
    clearAll: vi.fn(() => {
      mmkvStorageMap.clear();
    }),
    getAllKeys: vi.fn(() => Array.from(mmkvStorageMap.keys())),
  });

  return {
    createMMKV: vi.fn().mockImplementation(createMockInstance),
    MMKV: vi.fn().mockImplementation(createMockInstance),
  };
});

// expo-sqlite mock - in-memory implementation using plain arrays/Maps
// so service unit tests run without any native bindings.
const sqliteRows: Map<string, Record<string, unknown>[]> = new Map();
let sqliteAutoId = 1;

function makeMockDb() {
  return {
    execAsync: vi.fn(async () => {
      // Ensure the in-memory table exists (idempotent).
      if (!sqliteRows.has('weather_history')) {
        sqliteRows.set('weather_history', []);
      }
    }),
    runAsync: vi.fn(async (sql: string, params: unknown[] = []) => {
      const s = sql.trim().toUpperCase();

      if (s.startsWith('INSERT INTO WEATHER_HISTORY')) {
        const table = sqliteRows.get('weather_history') ?? [];
        const [
          fetched_at,
          latitude,
          longitude,
          city,
          temperature,
          weather_code,
          humidity,
          wind_speed,
          pressure,
          temp_max,
          temp_min,
          temperature_unit,
          wind_speed_unit,
        ] = params as [
          string,
          number,
          number,
          string,
          number,
          number,
          number,
          number,
          number | null,
          number,
          number,
          string,
          string,
        ];
        table.push({
          id: sqliteAutoId++,
          fetched_at,
          latitude,
          longitude,
          city,
          temperature,
          weather_code,
          humidity,
          wind_speed,
          pressure,
          temp_max,
          temp_min,
          temperature_unit,
          wind_speed_unit,
        });
        sqliteRows.set('weather_history', table);
        return { lastInsertRowId: sqliteAutoId - 1, changes: 1 };
      }

      if (s.startsWith('DELETE FROM WEATHER_HISTORY')) {
        const table = sqliteRows.get('weather_history') ?? [];
        const before = table.length;

        let filtered = table;
        if (s.includes('WHERE FETCHED_AT <')) {
          const cutoff = params[0] as string;
          filtered = table.filter((r) => (r.fetched_at as string) >= cutoff);
        } else if (s.includes('WHERE LATITUDE BETWEEN')) {
          const latMin = params[0] as number;
          const latMax = params[1] as number;
          const lonMin = params[2] as number;
          const lonMax = params[3] as number;
          filtered = table.filter(
            (r) =>
              !(
                (r.latitude as number) >= latMin &&
                (r.latitude as number) <= latMax &&
                (r.longitude as number) >= lonMin &&
                (r.longitude as number) <= lonMax
              ),
          );
        }

        sqliteRows.set('weather_history', filtered);
        return { lastInsertRowId: 0, changes: before - filtered.length };
      }

      return { lastInsertRowId: 0, changes: 0 };
    }),
    getAllAsync: vi.fn(async (sql: string, params: unknown[] = []) => {
      const s = sql.trim().toUpperCase();
      const table = sqliteRows.get('weather_history') ?? [];

      if (s.includes('FROM WEATHER_HISTORY')) {
        let result = table;

        if (s.includes('WHERE LATITUDE BETWEEN')) {
          const latMin = params[0] as number;
          const latMax = params[1] as number;
          const lonMin = params[2] as number;
          const lonMax = params[3] as number;
          const limitVal = params[4] as number | undefined;
          result = table
            .filter(
              (r) =>
                (r.latitude as number) >= latMin &&
                (r.latitude as number) <= latMax &&
                (r.longitude as number) >= lonMin &&
                (r.longitude as number) <= lonMax,
            )
            .slice(0, limitVal ?? 200);
        }

        // ORDER BY fetched_at DESC
        return result.toSorted((a, b) =>
          (b.fetched_at as string).localeCompare(a.fetched_at as string),
        );
      }

      return [];
    }),
  };
}

// Reset in-memory data between tests.
beforeEach(() => {
  sqliteRows.clear();
  sqliteAutoId = 1;
  // Pre-create the table so execAsync is not strictly required.
  sqliteRows.set('weather_history', []);
});

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn(async () => makeMockDb()),
  SQLiteDatabase: vi.fn(),
}));
