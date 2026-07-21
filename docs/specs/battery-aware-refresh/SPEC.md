# Feature: Battery-Aware Refresh

## Intent

When the device enters battery saver (low power) mode or drops below a battery threshold, the app automatically adapts by reducing weather query refresh frequency (increasing TanStack Query `staleTime` and disabling refetch on window focus) and surfacing a subtle animated indicator banner, with a user-facing setting to toggle this behavior.

## Context

- **Problem statement:** Weather queries refetch automatically on standard timers (`staleTime: 10m` in `src/hooks/useFetchWeather.ts:16`) and window focus, regardless of device power state or battery saver mode. The app has no awareness of battery status, `expo-battery` is not installed, and users cannot configure power-saving refresh policies.
- **Current code:**
  - `src/hooks/useFetchWeather.ts` exposes `useFetchWeather(location)` using TanStack Query `useQuery` (`:11`) with a fixed `staleTime` of 10 minutes (`1000 * 60 * 10`).
  - `src/app/_layout.tsx` sets up root-level providers (`PersistQueryClientProvider` at `:102`) and invokes global monitoring hooks (`useNetworkMonitor` at `:48`, `useAuthListener` at `:49`, `useNotificationListeners` at `:50`). It renders a full-width global `<OfflineIndicator />` (`:74`) inside `SafeAreaView`.
  - `src/store/useSettingsStore.ts` manages user preferences via Zustand persisted with `AsyncStorage` (`:42`). It currently holds units, language, notifications, and haptics preferences.
  - `src/components/OfflineIndicator.tsx` provides the template for top-of-screen animated banners using `react-native-reanimated` (`useAnimatedStyle`, `withTiming`).
  - `src/app/settings.tsx` renders toggle settings using `Switch` components bound to `useSettingsStore` state.
  - `src/services/i18n.ts` manages localized copy in English (`en`) and Japanese (`ja`).
  - Tests live under `src/tests/`, with global Expo module mocks set up in `src/tests/setup.ts`.
- **User impact:** Devices in battery saver mode or running low on battery consume less network and processing power. Users receive clear visual feedback when refresh behavior is throttled and retain control via Settings.
- **Dependencies:** Adds `expo-battery` (installed via `npx expo install expo-battery`, pinning the Expo SDK 56 version). On Android, `expo-battery` uses standard battery APIs without requiring extra custom native permissions in `app.json`.

## Data Model

- **`useSettingsStore` (`src/store/useSettingsStore.ts`)** gains one persisted setting:
  - `batterySaverAware: boolean` — default `true` (default-on power awareness).
  - `setBatterySaverAware: (enabled: boolean) => void`.
  - Storage key `'settings-storage'` remains unchanged; non-`false` values hydrate as `true`.
- **`useBatteryStore` (`src/store/useBatteryStore.ts`)** (new transient Zustand store):
  - `isLowPowerMode: boolean` — whether OS Battery Saver / Low Power Mode is active (default `false`).
  - `batteryLevel: number` — battery charge ratio from `0.0` to `1.0`, or `-1` if unknown (default `-1`).
  - `batteryState: BatteryState` — `BatteryState.UNPLUGGED | CHARGING | FULL | UNKNOWN` (default `UNKNOWN`).
  - `isBatterySaverActive: boolean` — derived state: `true` when (`isLowPowerMode === true` OR (`batteryLevel >= 0` AND `batteryLevel <= 0.20` AND `batteryState === BatteryState.UNPLUGGED`)).
  - Actions: `setBatteryStatus: (status: { isLowPowerMode?: boolean; batteryLevel?: number; batteryState?: BatteryState }) => void`.

## Interfaces / API

### `useBatteryMonitor` (hook) - `src/hooks/useBatteryMonitor.ts`

```ts
export const useBatteryMonitor: () => void;
```

- Invoked once in `RootApp` (`src/app/_layout.tsx`).
- On mount:
  - Fetches initial battery state via `Battery.isLowPowerModeEnabledAsync()`, `Battery.getBatteryLevelAsync()`, and `Battery.getBatteryStateAsync()`.
  - Updates `useBatteryStore`.
  - Subscribes to `Battery.addLowPowerModeListener`, `Battery.addBatteryLevelListener`, and `Battery.addBatteryStateListener`.
- On unmount:
  - Cleans up all three event subscriptions via `.remove()`.

### `useFetchWeather` (updated hook) - `src/hooks/useFetchWeather.ts`

```ts
export const useFetchWeather: (location?: LocationData) => UseQueryResult<WeatherResponse, Error>;
```

- Reads `batterySaverAware` from `useSettingsStore` and `isBatterySaverActive` from `useBatteryStore`.
- Computes effective stale configuration:
  - `isThrottled = batterySaverAware && isBatterySaverActive`.
  - `staleTime`: `1000 * 60 * 30` (30 minutes) when `isThrottled`, else `1000 * 60 * 10` (10 minutes).
  - `refetchOnWindowFocus`: `!isThrottled`.

### `BatterySaverIndicator` (component) - `src/components/BatterySaverIndicator.tsx`

```ts
export const BatterySaverIndicator: () => React.JSX.Element;
```

- Renders an animated top banner using `react-native-reanimated`, styled similarly to `OfflineIndicator`.
- Displays when `batterySaverAware` is `true` AND `isBatterySaverActive` is `true`.
- Displays localized text `t('batterySaverBannerText')` ("Battery Saver Active • Weather refresh frequency reduced").

## Files Created

| File                                                  | Purpose                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/store/useBatteryStore.ts`                        | Transient Zustand store for device battery level, power mode, charging state, and derived active status. |
| `src/hooks/useBatteryMonitor.ts`                      | Custom hook that listens to `expo-battery` events and populates `useBatteryStore`.                       |
| `src/components/BatterySaverIndicator.tsx`            | Animated banner component alerting the user when battery-aware refresh throttling is active.             |
| `src/tests/store/useBatteryStore.test.ts`             | Unit tests verifying derived `isBatterySaverActive` logic across low power mode and low level states.    |
| `src/tests/hooks/useBatteryMonitor.test.ts`           | Unit tests for battery event subscription, initial async fetches, and teardown logic.                    |
| `src/tests/components/BatterySaverIndicator.test.tsx` | Unit tests ensuring the banner animates in/out according to store states.                                |

## Files Modified

| File                                       | Change                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `package.json`                             | Add `expo-battery` dependency via `npx expo install expo-battery`.                                                 |
| `src/store/useSettingsStore.ts`            | Add `batterySaverAware` boolean (default `true`) and `setBatterySaverAware` setter.                                |
| `src/hooks/useFetchWeather.ts`             | Dynamically adjust `staleTime` (30m vs 10m) and `refetchOnWindowFocus` based on battery throttling status.         |
| `src/hooks/index.ts`                       | Re-export `useBatteryMonitor` from the hooks barrel.                                                               |
| `src/app/_layout.tsx`                      | Invoke `useBatteryMonitor()` in `RootApp` and render `<BatterySaverIndicator />` alongside `<OfflineIndicator />`. |
| `src/app/settings.tsx`                     | Add a Battery-Aware Refresh settings row with a `Switch` and description text.                                     |
| `src/services/i18n.ts`                     | Add translation keys `batterySaverLabel`, `batterySaverDesc`, and `batterySaverBannerText` in `en` and `ja`.       |
| `src/tests/setup.ts`                       | Add global mock for `expo-battery` (`isLowPowerModeEnabledAsync`, listeners, `BatteryState` enum).                 |
| `src/tests/store/useSettingsStore.test.ts` | Verify `batterySaverAware` default value and setter behavior.                                                      |
| `src/tests/hooks/useFetchWeather.test.ts`  | Verify query options (`staleTime`, `refetchOnWindowFocus`) adapt when battery saver is active vs inactive.         |
| `src/tests/app/settings.test.tsx`          | Verify the new Battery Saver setting row renders and toggles properly.                                             |

## Implementation Steps

1. Install `expo-battery`: Run `npx expo install expo-battery` to pin the SDK 56-compatible version in `package.json`.
2. Add global test mock: Update `src/tests/setup.ts` to mock `expo-battery` methods (`getBatteryLevelAsync`, `getBatteryStateAsync`, `isLowPowerModeEnabledAsync`, listeners, and `BatteryState` enum).
3. Update `useSettingsStore`: Add `batterySaverAware: boolean` (default `true`) and `setBatterySaverAware` setter to `src/store/useSettingsStore.ts`. Update `src/tests/store/useSettingsStore.test.ts`.
4. Create `useBatteryStore`: Implement `src/store/useBatteryStore.ts` with state for `isLowPowerMode`, `batteryLevel`, `batteryState`, and derived getter/property for `isBatterySaverActive` (active when low power mode is true OR level <= 0.20 while unplugged). Write `src/tests/store/useBatteryStore.test.ts`.
5. Create `useBatteryMonitor`: Implement `src/hooks/useBatteryMonitor.ts` to query initial battery status asynchronously and listen to `expo-battery` events, updating `useBatteryStore`. Re-export from `src/hooks/index.ts` and test in `src/tests/hooks/useBatteryMonitor.test.ts`.
6. Update `useFetchWeather`: Modify `src/hooks/useFetchWeather.ts` to consume `batterySaverAware` and `isBatterySaverActive`, dynamically configuring `staleTime` (30 mins when throttled vs 10 mins normal) and `refetchOnWindowFocus`. Update `src/tests/hooks/useFetchWeather.test.ts`.
7. Add i18n copy: Add `batterySaverLabel`, `batterySaverDesc`, and `batterySaverBannerText` entries under `en` and `ja` in `src/services/i18n.ts`.
8. Create `BatterySaverIndicator`: Build `src/components/BatterySaverIndicator.tsx` using `react-native-reanimated` (height and opacity animation), rendering when throttled. Add tests in `src/tests/components/BatterySaverIndicator.test.tsx`.
9. Wire UI components: Render `<BatterySaverIndicator />` and invoke `useBatteryMonitor()` in `src/app/_layout.tsx`. Add a new settings row with `Switch` in `src/app/settings.tsx`. Update `src/tests/app/settings.test.tsx`.
10. Verification: Run `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` to ensure zero type errors, lint issues, or broken tests.

## Style & Conventions

- Strictly adheres to Expo SDK 56 standard module patterns (`expo-battery`).
- Follows existing project architecture: Zustand stores for state, custom hooks re-exported from `src/hooks/index.ts`, animated banners in `src/components/`, and localization through `t(...)` in `src/services/i18n.ts`.
- Uses `react-native-reanimated` for smooth UI transitions on banner appearance.
- Maintains strict TypeScript types with zero `any` usages.

## Acceptance Criteria

- [ ] `expo-battery` is included in `package.json` under SDK 56 versions.
- [ ] `useBatteryStore` accurately evaluates `isBatterySaverActive` when OS Low Power Mode is on OR when battery <= 20% while unplugged.
- [ ] `useFetchWeather` increases `staleTime` from 10m to 30m and disables `refetchOnWindowFocus` when `batterySaverAware` is enabled and battery saver is active.
- [ ] `BatterySaverIndicator` displays an animated top banner when battery throttling is active and hides when inactive or toggled off.
- [ ] Settings screen contains a "Battery-Aware Refresh" row with a switch control localized in `en` and `ja`.
- [ ] `npx tsc --noEmit` completes with no TypeScript errors.
- [ ] `pnpm run lint` passes with no linter warnings or errors.
- [ ] `pnpm test` passes all unit tests, including new store, hook, component, and updated screen tests.

## Constraints

- **Scope boundary:** Battery-aware throttling applies strictly to weather data fetching. Search geocoding and auth operations remain unthrottled.
- **Android focus:** Native battery event listeners behave per Android system event limits; emulator environments where battery state is static default gracefully without crashing.
- **Non-goals:** No custom per-city refresh schedules or manual battery threshold sliders in Settings.
