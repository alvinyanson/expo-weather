# Feature: Component and Hook Test Coverage Expansion

## Intent

Expand Vitest unit and integration test coverage across previously untested data-fetching hooks (`useFetchWeather`, `useFetchLocation`, `useSearchLocation`, `useSavedLocations`), presentational components (`WeatherHistoryRow`), and screens (`history.tsx`), verifying end-to-end async data flows, cache behaviors, side effects, and state interactions.

## Context

- **Problem statement:** While services, Zustand stores, and select UI components have tests in `src/tests/`, several core React Query hooks (`useFetchWeather`, `useFetchLocation`, `useSearchLocation`, `useSavedLocations`), the weather history row component (`WeatherHistoryRow.tsx`), and the history screen (`history.tsx`) lack dedicated test files.
  - `useFetchWeather.ts` includes side effects like automatic SQLite snapshot persistence via `insertWeatherSnapshot` and battery-aware polling interval logic, which need isolated async hook test verification.
  - `useFetchLocation.ts` and `useSearchLocation.ts` wrap native location fetching and Open-Meteo geocoding search but lack assertions for query key dependencies, minimum query length gating, and error handling.
  - `useSavedLocations.ts` manages Firestore integration, optimistic list state updates, and haptics/toast side effects, but is missing unit coverage for CRUD actions.
  - `src/components/WeatherHistoryRow.tsx` formats and displays historical weather metrics (°C/°F, km/h/mph, humidity, pressure fallback) without a unit test.
  - `src/app/history.tsx` renders historical weather snapshots grouped by date via SQLite database queries without an integration test.
- **Current code:**
  - `src/hooks/useFetchWeather.ts` reads `useSettingsStore` and `useBatteryStore`, executes `fetchWeather`, and invokes `insertWeatherSnapshot` when new data lands.
  - `src/hooks/useFetchLocation.ts` invokes `fetchLocation` with `retry: 1`.
  - `src/hooks/useSearchLocation.ts` gates search queries on `query.length >= 2`.
  - `src/hooks/useSavedLocations.ts` interacts with Firestore services, `useSavedStore`, `useHaptics`, and `Toast`.
  - `src/components/WeatherHistoryRow.tsx` formats timestamp via `formatTime`, maps weather code to symbol/tint, and displays temperature/wind units and pressure fallback.
  - `src/app/history.tsx` retrieves data via `useWeatherHistory`, renders a `SectionList` or an empty state, and handles clear history and back navigation actions.
  - `src/tests/setup.ts` configures Vitest mocks for Expo SDK APIs, SQLite, Reanimated, Firebase, and MMKV.
- **User impact:** Prevents regressions in core data fetching, caching logic, unit formatting, and database snapshot side effects during future refactoring.
- **Dependencies:** Vitest, `@testing-library/react`, `@tanstack/react-query`. No new packages or external services are needed.

## Data Model

- N/A — No changes to data models, database schemas, or interfaces. Standard test mock objects for `WeatherResponse`, `LocationData`, `WeatherHistoryRow`, and `DailyWeatherSummary` will be declared inside test files.

## Interfaces / API

New test suites in `src/tests/` exporting `describe` blocks covering the contracts of:

- `useFetchWeather(location?: LocationData)`
  - Contract: Returns Query result object. Executes `fetchWeather` when location is provided; side-effect `insertWeatherSnapshot` fires when `dataUpdatedAt` advances. Adjusts `staleTime` and `refetchOnWindowFocus` when battery saver is active.
- `useFetchLocation()`
  - Contract: Returns Query result object. Executes `fetchLocation` and handles loading/error states with retry limit of 1.
- `useSearchLocation(query: string)`
  - Contract: Returns Query result object. `enabled` is `false` when `query.length < 2`; fires `searchLocations` when `query.length >= 2`.
- `useSavedLocations()`
  - Contract: Returns saved locations list, loading status, and `toggleSavedLocation`, `confirmDeleteLocation`, and `reorderLocations` handlers. Triggers haptics/toasts on success or failure.
- `WeatherHistoryRow({ row: WeatherHistoryRowType })`
  - Contract: Renders formatted timestamp, weather symbol, temperature (°C/°F), humidity, wind speed (km/h/mph), and pressure (`hPa` or `—` when null).
- `HistoryScreen()`
  - Contract: Renders `ActivityIndicator` when loading, empty state text when no summaries exist, or a `SectionList` grouped by date with clear history and back navigation actions.

## Files Created

| File                                              | Purpose                                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/tests/hooks/useFetchWeather.test.tsx`        | Unit tests for `useFetchWeather` hook testing query execution, unit dependencies, battery saver throttling, and SQLite snapshot insertion side effect. |
| `src/tests/hooks/useFetchLocation.test.tsx`       | Unit tests for `useFetchLocation` hook testing coordinate fetching, loading/error states, and retry behavior.                                          |
| `src/tests/hooks/useSearchLocation.test.tsx`      | Unit tests for `useSearchLocation` hook testing minimum query length gating (`>= 2`), query key caching, and service integration.                      |
| `src/tests/hooks/useSavedLocations.test.tsx`      | Unit tests for `useSavedLocations` hook testing saved location query, toggle/delete mutations, optimistic store updates, and haptic/toast triggers.    |
| `src/tests/components/WeatherHistoryRow.test.tsx` | Component unit tests for `WeatherHistoryRow` testing formatted output, unit switching, weather symbol mapping, and pressure fallback (`—`).            |
| `src/tests/app/history.test.tsx`                  | Screen integration tests for `history.tsx` testing loading spinner, section headers, clear history action, back navigation, and empty state layout.    |

## Files Modified

| File  | Change                                                                                |
| ----- | ------------------------------------------------------------------------------------- |
| `N/A` | N/A — No existing application code files need to be modified for this test expansion. |

## Implementation Steps

1. Create `src/tests/hooks/useFetchWeather.test.tsx`:
   - Mock `@/services` (`fetchWeather`), `@/services/weatherHistory.service` (`insertWeatherSnapshot`), and `@/contexts/DatabaseContext` (`useDatabase`).
   - Define a `QueryClientProvider` wrapper helper (`createWrapper`) with `retry: false`.
   - Test disabled query behavior when `location` parameter is `undefined`.
   - Test successful weather data fetching when valid coordinates are provided.
   - Test side effect: verify `insertWeatherSnapshot` is called with correctly formatted snapshot data upon successful query fetch.
   - Test battery saver aware mode: verify `staleTime` and `refetchOnWindowFocus` configuration when `batterySaverAware` and `isBatterySaverActive` are set.

2. Create `src/tests/hooks/useFetchLocation.test.tsx`:
   - Mock `@/services` (`fetchLocation`).
   - Test successful resolution returning `LocationData`.
   - Test error handling when `fetchLocation` rejects.

3. Create `src/tests/hooks/useSearchLocation.test.tsx`:
   - Mock `@/services/location.service` (`searchLocations`).
   - Test query disabled state when input string length is less than 2 characters (`query.length < 2`).
   - Test query activation and service call when input string length is 2 or more characters (`query.length >= 2`).

4. Create `src/tests/hooks/useSavedLocations.test.tsx`:
   - Mock `@/services/firestore.service` (`getSavedLocations`, `saveLocation`, `deleteLocation`), `useHaptics`, and `react-native-toast-message`.
   - Test initial loading and data fetching of saved locations.
   - Test `toggleSavedLocation` (save and remove branches) and `confirmDeleteLocation` verifying optimistic store updates, service calls, and haptics/toast feedback.

5. Create `src/tests/components/WeatherHistoryRow.test.tsx`:
   - Render `WeatherHistoryRow` with mock `WeatherHistoryRowType` data.
   - Assert formatted timestamp output from `formatTime`.
   - Assert temperature display with °C vs °F unit strings based on `temperature_unit`.
   - Assert wind speed display with km/h vs mph unit strings based on `wind_speed_unit`.
   - Assert pressure display showing `X hPa` when pressure value is provided, and `—` fallback when pressure is `null` or `undefined`.

6. Create `src/tests/app/history.test.tsx`:
   - Mock `expo-router` (`useRouter`, `useLocalSearchParams`).
   - Mock `useWeatherHistory` and `useDatabase`.
   - Test rendering of `ActivityIndicator` while `isLoading` is `true`.
   - Test empty state view when `summaries` array is empty.
   - Test `SectionList` rendering with section date headers and min/max temperature summaries when data is populated.
   - Test back button click invoking `router.back()`.
   - Test trash button click invoking `clearHistory()`.

7. Run validation commands:
   - Type check: `npx tsc --noEmit`
   - Lint check: `pnpm run lint`
   - Test suite: `pnpm test`

## Style & Conventions

- Follows established repository testing patterns in `src/tests/` using Vitest (`describe`, `it`, `expect`, `vi.mock`, `renderHook`, `render`, `waitFor`).
- Uses `@/` path alias for imports matching `tsconfig.json`.
- Maintains strict typing and isolation across test suites with clean mocks and `afterEach(() => { cleanup(); vi.clearAllMocks(); })`.
- Implements `QueryClientProvider` wrapper helpers with `retry: false` to ensure deterministic async hook testing.

## Acceptance Criteria

- [ ] `useFetchWeather`, `useFetchLocation`, `useSearchLocation`, and `useSavedLocations` have unit test suites in `src/tests/hooks/`.
- [ ] `WeatherHistoryRow` component has unit test assertions covering all metrics, unit options, and fallback values in `src/tests/components/WeatherHistoryRow.test.tsx`.
- [ ] `HistoryScreen` has integration tests in `src/tests/app/history.test.tsx` covering loading state, empty state, summary sections, clear history, and back navigation.
- [ ] `npx tsc --noEmit` completes with zero type errors.
- [ ] `pnpm run lint` completes with zero lint errors.
- [ ] `pnpm test` passes all tests cleanly.

## Constraints

- **Scope boundaries:** Focuses strictly on Vitest unit and integration test coverage expansion for hooks, presentational components, and screens in `src/tests/`. Maestro E2E test flows are explicitly out of scope for this spec.
- **No application code mutations:** Application logic in `src/` must remain untouched unless a bug is uncovered during test creation.
- **Strict test isolation:** All network calls, device sensors, location APIs, Firebase calls, and database operations must be fully mocked so tests execute offline and deterministically in jsdom.
