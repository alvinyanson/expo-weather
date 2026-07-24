# Feature: Background Weather Refresh

## Intent

Register a minimal, periodic background task using `expo-task-manager` and `expo-background-fetch` that fetches current weather for the user's location when the app is backgrounded or closed, and triggers a local notification when weather conditions change significantly.

## Context

- **Problem statement:** Weather forecasts currently refresh only when the app is actively running in the foreground (`src/hooks/useFetchWeather.ts`). When the app is closed or backgrounded, users receive no updates or alerts about changing weather conditions.
- **Current code:**
  - `src/services/weather.service.ts`: provides `fetchCoordinates()` (GPS location) and `fetchWeather(lat, lon, tempUnit, windUnit)` for raw API calls.
  - `src/hooks/useNotifications.ts`: configures notification handler (`Notifications.setNotificationHandler`) and permissions. `Notifications.scheduleNotificationAsync` allows firing local notifications.
  - `src/store/useSettingsStore.ts`: Zustand store persisting user preferences (`notificationsEnabled`, units, language) via MMKV storage.
  - `src/app/_layout.tsx`: mounts global listeners (`useNetworkMonitor`, `useAuthListener`, `useNotificationListeners`, `useBatteryMonitor`) at app initialization.
  - `src/services/i18n.ts`: centralized translation helper `t(...)` covering English (`en`) and Japanese (`ja`).
  - `src/utils/weatherMapper.ts`: maps WMO weather codes to conditions (`weatherCodeToCondition`).
- **User impact:** Users receive timely background notification alerts when weather conditions change (e.g., clear weather turning to rain or storms), built cleanly with minimal file touches so the core mechanics of Expo background tasks can be easily digested.
- **Dependencies:** Adds `expo-task-manager` and `expo-background-fetch` (installed via `npx expo install expo-task-manager expo-background-fetch` to match Expo SDK 56). `expo-notifications` and `expo-location` are already installed.

## Data Model

- **`useSettingsStore` (`src/store/useSettingsStore.ts`)** gains two persisted fields:
  - `backgroundRefreshEnabled: boolean` — user setting to toggle periodic background weather checks (default `false`).
  - `setBackgroundRefreshEnabled: (enabled: boolean) => void`.
  - `lastBackgroundWeatherCode: number | null` — stores the weather code from the previous background check to compare and detect condition shifts (default `null`).
  - `setLastBackgroundWeatherCode: (code: number | null) => void`.

## Interfaces / API

### `BACKGROUND_WEATHER_TASK` & Task Handler (`src/tasks/backgroundWeatherTask.ts`)

```ts
export const BACKGROUND_WEATHER_TASK = 'BACKGROUND_WEATHER_REFRESH_TASK';

export const handleBackgroundWeatherFetch =
  async (): Promise<BackgroundFetch.BackgroundFetchResult> => {
    // 1. Read state from useSettingsStore.getState()
    // 2. Obtain current coordinates via Location.getLastKnownPositionAsync or fetchCoordinates()
    // 3. Fetch weather via fetchWeather(lat, lon, tempUnit, windUnit)
    // 4. Compare current weather_code with lastBackgroundWeatherCode
    // 5. If weather condition changed or severe weather detected, trigger local notification via Notifications.scheduleNotificationAsync
    // 6. Update lastBackgroundWeatherCode in store
    // 7. Return BackgroundFetch.BackgroundFetchResult.NewData (or NoData / Failed)
  };
```

- Task definition must be called at module import top-level: `TaskManager.defineTask(BACKGROUND_WEATHER_TASK, handleBackgroundWeatherFetch)`.

### `useBackgroundWeather` (hook) - `src/hooks/useBackgroundWeather.ts`

```ts
export const useBackgroundWeather: () => {
  isRegistered: boolean;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
};
```

- Automatically registers/unregisters `BACKGROUND_WEATHER_TASK` with `BackgroundFetch.registerTaskAsync(BACKGROUND_WEATHER_TASK, { minimumInterval: 15 * 60, stopOnTerminate: false, startOnBoot: true })` whenever `backgroundRefreshEnabled` changes in `useSettingsStore`.
- Executed inside `RootApp` in `src/app/_layout.tsx`.

## Files Created

| File                                            | Purpose                                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/tasks/backgroundWeatherTask.ts`            | Top-level task definition with `TaskManager.defineTask` and headless execution logic for fetching weather and firing notifications. |
| `src/hooks/useBackgroundWeather.ts`             | Custom hook managing registration/unregistration of the background fetch task based on user settings.                               |
| `src/tests/tasks/backgroundWeatherTask.test.ts` | Unit tests for background task handler (success, notification trigger on condition change, error handling).                         |
| `src/tests/hooks/useBackgroundWeather.test.ts`  | Unit tests verifying background task registration and unregistration behavior.                                                      |

## Files Modified

| File                                       | Change                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`                             | Add `expo-task-manager` and `expo-background-fetch` dependencies via `npx expo install`.                                                                     |
| `src/store/useSettingsStore.ts`            | Add `backgroundRefreshEnabled` and `lastBackgroundWeatherCode` fields + setters.                                                                             |
| `src/app/_layout.tsx`                      | Import `src/tasks/backgroundWeatherTask` (for top-level `defineTask` execution) and invoke `useBackgroundWeather()` in `RootApp`.                            |
| `src/app/settings.tsx`                     | Add a "Background Weather Refresh" setting row with a `Switch`.                                                                                              |
| `src/services/i18n.ts`                     | Add translation keys `backgroundRefreshLabel`, `backgroundRefreshDesc`, `backgroundNotificationTitle`, and `backgroundNotificationBody` under `en` and `ja`. |
| `src/hooks/index.ts`                       | Re-export `useBackgroundWeather` from the hooks barrel.                                                                                                      |
| `src/tests/setup.ts`                       | Add global mocks for `expo-task-manager` and `expo-background-fetch`.                                                                                        |
| `src/tests/store/useSettingsStore.test.ts` | Verify `backgroundRefreshEnabled` and `lastBackgroundWeatherCode` initial state and setters.                                                                 |
| `src/tests/app/settings.test.tsx`          | Verify the new Background Refresh setting row renders and toggles properly.                                                                                  |

## Implementation Steps

1. Install dependencies: Run `npx expo install expo-task-manager expo-background-fetch` to add SDK 56-compatible background fetch modules.
2. Add global test mocks: Update `src/tests/setup.ts` to mock `expo-task-manager` (`defineTask`, `isTaskRegisteredAsync`) and `expo-background-fetch` (`registerTaskAsync`, `unregisterTaskAsync`, `getStatusAsync`, `BackgroundFetchResult`, `BackgroundFetchStatus`).
3. Update `useSettingsStore`: Add `backgroundRefreshEnabled: boolean` (default `false`), `lastBackgroundWeatherCode: number | null` (default `null`), and setters in `src/store/useSettingsStore.ts`. Update tests in `src/tests/store/useSettingsStore.test.ts`.
4. Create background task module: Implement `src/tasks/backgroundWeatherTask.ts` with top-level `TaskManager.defineTask`. Implement `handleBackgroundWeatherFetch` to read store state, get location, call `fetchWeather`, detect condition changes against `lastBackgroundWeatherCode`, schedule local notification, update store state, and return `BackgroundFetchResult`. Write `src/tests/tasks/backgroundWeatherTask.test.ts`.
5. Create `useBackgroundWeather` hook: Implement `src/hooks/useBackgroundWeather.ts` to register (`BackgroundFetch.registerTaskAsync`) or unregister (`BackgroundFetch.unregisterTaskAsync`) based on `backgroundRefreshEnabled`. Re-export from `src/hooks/index.ts` and test in `src/tests/hooks/useBackgroundWeather.test.ts`.
6. Add i18n translation strings: Add `backgroundRefreshLabel`, `backgroundRefreshDesc`, `backgroundNotificationTitle`, `backgroundNotificationBody` in `en` and `ja` in `src/services/i18n.ts`.
7. Wire task and settings UI: Import `src/tasks/backgroundWeatherTask` at the top of `src/app/_layout.tsx` and call `useBackgroundWeather()` inside `RootApp`. Add setting toggle row in `src/app/settings.tsx`. Update `src/tests/app/settings.test.tsx`.
8. Verification: Run `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` to confirm zero type errors, lint issues, or broken tests.

## Style & Conventions

- Follows Expo SDK 56 versioned standards (`expo-task-manager`, `expo-background-fetch`).
- Cites `AGENTS.md` and `CLAUDE.md` architecture: Zustand store for settings, isolated task module, re-exported hook in `src/hooks/index.ts`, and i18n via `t(...)`.
- Keeps touch points minimal and modular so background task concepts (`TaskManager.defineTask`, `BackgroundFetch.registerTaskAsync`, background fetch lifecycle) remain easy to understand.
- Strict TypeScript types throughout with zero `any` declarations.

## Acceptance Criteria

- [ ] `expo-task-manager` and `expo-background-fetch` are included in `package.json` under SDK 56 compatible versions.
- [ ] Task `BACKGROUND_WEATHER_REFRESH_TASK` is defined at top-level in `src/tasks/backgroundWeatherTask.ts` using `TaskManager.defineTask`.
- [ ] `handleBackgroundWeatherFetch` correctly queries location, calls `fetchWeather`, detects weather code changes against `lastBackgroundWeatherCode`, schedules a local notification on change, and returns `BackgroundFetchResult.NewData`.
- [ ] `useBackgroundWeather` hook registers the task when `backgroundRefreshEnabled` is true and unregisters it when false.
- [ ] Settings screen renders a "Background Weather Refresh" row with a functional switch localized in `en` and `ja`.
- [ ] `npx tsc --noEmit` completes with zero TypeScript errors.
- [ ] `pnpm run lint` passes with no linter warnings or errors.
- [ ] `pnpm test` passes all unit tests, including new task, hook, and updated settings/store tests.

## Constraints

- **Minimal Scope:** Background execution is limited strictly to periodic weather fetching for the current location and firing local notifications on condition shifts. No background geofencing or complex background sync queues.
- **Android Limits:** Android OS enforces a minimum background fetch interval (typically 15 minutes) and restricts background execution when battery saver or Doze mode is enabled.
- **Non-goals:** No remote server push infrastructure, no per-city fetch interval options, no custom sound selection for notifications.
