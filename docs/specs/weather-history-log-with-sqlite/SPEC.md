# Feature: Weather History Log with SQLite

## Intent

Every successful weather fetch is persisted as a snapshot row in a local SQLite database; a new History screen lets the user browse recent conditions for any location, and aggregated row queries surface per-day min/max data alongside raw snapshots.

## Context

- **Problem statement:** The app fetches live weather but discards each response after the TanStack Query 24-hour cache window expires. There is no on-device record of how conditions for a saved or GPS location changed over time, so the user cannot review historical trends. `expo-sqlite` is not yet installed (`package.json` contains no `expo-sqlite` entry).
- **Current code:**
  - `src/services/weather.service.ts`: `fetchWeather(lat, lon, temperatureUnit, windSpeedUnit)` returns `WeatherResponse` via the Axios client. This is the single place where the raw API response is produced and is the correct insertion point for the side-effect write.
  - `src/hooks/useFetchWeather.ts`: Calls `fetchWeather` via `useQuery`. The `onSuccess`-style callback is not available in TanStack Query v5; the write must happen via a `useEffect` on `data`.
  - `src/interfaces/weather.ts`: `WeatherResponse` defines `current`, `daily`, and `hourly` sub-objects with typed fields. The snapshot will draw from `current` and the first entries of `daily`.
  - `src/interfaces/location.ts`: `LocationData { latitude, longitude, city }` — the composite key for grouping history rows.
  - `src/app/_layout.tsx`: Wraps the app in `PersistQueryClientProvider` + `SafeAreaProvider`. DB initialization must run before any screen renders; the correct place is a `useDatabaseInit` hook called inside `RootLayout`.
  - `src/app/details.tsx`: The details screen already renders weather data per location and has an action row in `DetailsHeader`. A "View History" button can be added here to push to `/history`.
  - `src/tests/setup.ts`: Mocks native modules. `expo-sqlite` will need a Vitest mock.
  - `src/services/index.ts` and `src/hooks/index.ts`: Barrel files for re-exporting new modules.
- **User impact:**
  - Users can open a History screen from the Details screen for any location and see a chronological list of past weather snapshots.
  - Each row shows date/time, condition, temperature, humidity, wind speed, and surface pressure.
  - A daily summary header shows the min/max temperatures across all snapshots for that day.
  - Data persists across app restarts and survives the TanStack Query cache eviction window.
- **Dependencies:**
  - `expo-sqlite` (not yet installed) — the only new package required.
  - No prerequisite features needed; the feature hooks directly into the existing `useFetchWeather` data flow.

## Data Model

### SQLite Schema — `weather_history` table

```sql
CREATE TABLE IF NOT EXISTS weather_history (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at       TEXT    NOT NULL,  -- ISO-8601 UTC timestamp, e.g. "2026-07-23T07:00:00.000Z"
  latitude         REAL    NOT NULL,
  longitude        REAL    NOT NULL,
  city             TEXT    NOT NULL,
  temperature      REAL    NOT NULL,  -- current.temperature_2m (in the user's selected unit)
  weather_code     INTEGER NOT NULL,  -- current.weather_code (WMO code)
  humidity         INTEGER NOT NULL,  -- current.relative_humidity_2m
  wind_speed       REAL    NOT NULL,  -- current.wind_speed_10m (in the user's selected unit)
  pressure         REAL,              -- current.surface_pressure (nullable — may be absent in cached responses)
  temp_max         REAL    NOT NULL,  -- daily.temperature_2m_max[0]
  temp_min         REAL    NOT NULL,  -- daily.temperature_2m_min[0]
  temperature_unit TEXT    NOT NULL,  -- 'celsius' | 'fahrenheit'
  wind_speed_unit  TEXT    NOT NULL   -- 'kmh' | 'mph'
);

CREATE INDEX IF NOT EXISTS idx_weather_history_location_time
  ON weather_history (latitude, longitude, fetched_at DESC);
```

- **Location matching:** rows are grouped by `(latitude, longitude)` rounded within ±0.01° — the same tolerance already used by `details.tsx` (line 76) and `index.tsx` (line 53) — so GPS drift between fetches does not create duplicate location groups.
- **Retention policy:** rows older than 30 days are pruned on each DB initialization to keep disk usage bounded.
- **No migration versioning** is required at initial implementation. If the schema changes in a future iteration, a `PRAGMA user_version` approach will be introduced then.

### TypeScript Interfaces

```ts
// src/interfaces/weatherHistory.ts
export interface WeatherHistoryRow {
  id: number;
  fetched_at: string; // ISO-8601 UTC
  latitude: number;
  longitude: number;
  city: string;
  temperature: number;
  weather_code: number;
  humidity: number;
  wind_speed: number;
  pressure: number | null;
  temp_max: number;
  temp_min: number;
  temperature_unit: 'celsius' | 'fahrenheit';
  wind_speed_unit: 'kmh' | 'mph';
}

export interface DailyWeatherSummary {
  date: string; // 'YYYY-MM-DD' derived from fetched_at UTC date
  temp_min: number;
  temp_max: number;
  snapshots: WeatherHistoryRow[];
}
```

## Interfaces / API

### `src/services/db.ts` (singleton opener)

```ts
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

export const DB_NAME = 'expo-weather.db';

/** Opens (or reuses) the app's single SQLite database. */
export async function getDatabase(): Promise<SQLiteDatabase>;
```

### `src/services/weatherHistory.service.ts`

```ts
import { SQLiteDatabase } from 'expo-sqlite';
import { WeatherHistoryRow } from '@/interfaces';

/**
 * Creates the weather_history table and index if they do not exist.
 * Prunes rows older than 30 days.
 * Must be called once on app startup before any reads or writes.
 */
export async function initWeatherHistoryDb(db: SQLiteDatabase): Promise<void>;

/**
 * Inserts one snapshot row. latitude and longitude are stored as-is (4 dp precision).
 */
export async function insertWeatherSnapshot(
  db: SQLiteDatabase,
  params: Omit<WeatherHistoryRow, 'id'>,
): Promise<void>;

/**
 * Returns all rows for a given location (matched within ±0.01°),
 * ordered by fetched_at DESC, limited to the most recent `limit` rows (default 200).
 */
export async function fetchWeatherHistory(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
  limit?: number,
): Promise<WeatherHistoryRow[]>;

/**
 * Deletes all rows for the specified location (matched within ±0.01°).
 */
export async function clearLocationHistory(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
): Promise<void>;
```

### `src/hooks/useDatabaseInit.ts`

```ts
/**
 * Opens the SQLite database and runs initWeatherHistoryDb() on mount.
 * Called once inside RootLayout. Returns { db, isReady }.
 */
export function useDatabaseInit(): { db: SQLiteDatabase | null; isReady: boolean };
```

### `src/hooks/useWeatherHistory.ts`

```ts
/**
 * Reads WeatherHistoryRow[] for a given location from SQLite and
 * groups them into DailyWeatherSummary[]. Exposes a clearHistory action
 * that deletes all rows for the location and re-queries.
 */
export function useWeatherHistory(
  db: SQLiteDatabase | null,
  latitude: number,
  longitude: number,
): {
  summaries: DailyWeatherSummary[];
  isLoading: boolean;
  clearHistory: () => Promise<void>;
};
```

### History Screen — `src/app/history.tsx`

- Route: `/history` (stack push from `details.tsx` via `router.push({ pathname: '/history', params: { lat, lon, city } })`).
- Params via `useLocalSearchParams`: `lat: string`, `lon: string`, `city: string`.
- Layout: sticky back header with city name and a trash icon for `clearHistory`; `SectionList` where section = `DailyWeatherSummary` (sticky header showing date + min/max), item = `WeatherHistoryRow` component.
- Empty state: centered icon and "No history yet" text.

### `src/components/WeatherHistoryRow.tsx`

A single snapshot row displaying `fetched_at` (formatted via `formatTime`), a WMO condition icon (`weatherCodeToCondition` + `SymbolView`), temperature with unit, humidity, wind speed with unit, and surface pressure (or "—" when null).

## Files Created

| File                                                 | Purpose                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/services/db.ts`                                 | Singleton `getDatabase()` that opens `expo-weather.db` via `expo-sqlite`.                       |
| `src/services/weatherHistory.service.ts`             | `initWeatherHistoryDb`, `insertWeatherSnapshot`, `fetchWeatherHistory`, `clearLocationHistory`. |
| `src/hooks/useDatabaseInit.ts`                       | Opens DB and runs schema init on app startup; returns `{ db, isReady }`.                        |
| `src/hooks/useWeatherHistory.ts`                     | Reads and groups history rows; exposes `clearHistory`.                                          |
| `src/interfaces/weatherHistory.ts`                   | `WeatherHistoryRow` and `DailyWeatherSummary` types.                                            |
| `src/app/history.tsx`                                | History screen at `/history`.                                                                   |
| `src/components/WeatherHistoryRow.tsx`               | Single snapshot row cell.                                                                       |
| `src/tests/services/weatherHistory.service.test.ts`  | Unit tests for service functions via SQLite mock.                                               |
| `src/tests/hooks/useWeatherHistory.test.ts`          | Hook tests with mocked DB and service.                                                          |
| `docs/specs/weather-history-log-with-sqlite/SPEC.md` | This specification.                                                                             |

## Files Modified

| File                           | Change                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `package.json`                 | Add `expo-sqlite`.                                                                                    |
| `app.json`                     | Add `expo-sqlite` to the `plugins` array (required for native module registration).                   |
| `src/app/_layout.tsx`          | Call `useDatabaseInit()` inside `RootLayout`; expose `db` via a `DatabaseContext` wrapping `RootApp`. |
| `src/hooks/useFetchWeather.ts` | Add a `useEffect` on `data` that calls `insertWeatherSnapshot` when a new result arrives.             |
| `src/interfaces/index.ts`      | Re-export `WeatherHistoryRow` and `DailyWeatherSummary`.                                              |
| `src/services/index.ts`        | Re-export `db.ts` and `weatherHistory.service.ts`.                                                    |
| `src/hooks/index.ts`           | Re-export `useDatabaseInit` and `useWeatherHistory`.                                                  |
| `src/app/details.tsx`          | Add "View History" `Pressable` that pushes to `/history` with `lat`, `lon`, `city` params.            |
| `src/tests/setup.ts`           | Add Vitest mock for `expo-sqlite` (`openDatabaseAsync`, `runAsync`, `getAllAsync`, `execAsync`).      |

## Implementation Steps

1. Install `expo-sqlite`: `pnpm add expo-sqlite`. Verify the version aligns with Expo SDK 56 via https://docs.expo.dev/versions/v56.0.0/sdk/sqlite/.
2. Add `"expo-sqlite"` to the `plugins` array in `app.json`.
3. Add an in-memory Vitest mock for `expo-sqlite` in `src/tests/setup.ts` using a `Map` and array storage so service unit tests run without native bindings.
4. Create `src/interfaces/weatherHistory.ts` with `WeatherHistoryRow` and `DailyWeatherSummary`.
5. Re-export the new types from `src/interfaces/index.ts`.
6. Create `src/services/db.ts` with `DB_NAME` and `getDatabase()` using `openDatabaseAsync`.
7. Create `src/services/weatherHistory.service.ts` implementing the four service functions. Use `db.runAsync` for mutations and `db.getAllAsync` for queries; use parameterized SQL throughout.
8. Re-export new service functions from `src/services/index.ts`.
9. Write unit tests in `src/tests/services/weatherHistory.service.test.ts`. Cover: table creation, insert + retrieve round trip, location-scoped query (±0.01° tolerance), clear, and 30-day pruning.
10. Create `src/hooks/useDatabaseInit.ts`. Call `getDatabase()` then `initWeatherHistoryDb()` in a `useEffect` on mount; set `isReady = true` on success.
11. Create `src/contexts/DatabaseContext.tsx` with `createContext<SQLiteDatabase | null>(null)`. Update `src/app/_layout.tsx` to call `useDatabaseInit()` and provide `db` via the context provider wrapping `RootApp`.
12. Create `src/hooks/useWeatherHistory.ts`. Read rows via `fetchWeatherHistory`; group into `DailyWeatherSummary[]` by ISO date prefix. Expose `clearHistory` calling `clearLocationHistory` + re-query trigger.
13. Re-export new hooks from `src/hooks/index.ts`.
14. Write hook tests in `src/tests/hooks/useWeatherHistory.test.ts`. Cover: empty state, grouped summaries, and `clearHistory` action.
15. Create `src/components/WeatherHistoryRow.tsx` using theme tokens (`theme.colors`, `theme.spacing`, `theme.typography`), `formatTime`, and `SymbolView` for the WMO condition icon.
16. Create `src/app/history.tsx` with a `SectionList` (sections = `DailyWeatherSummary`, items = `WeatherHistoryRow`), sticky section headers showing date + min/max temps, a clear button in the header, and an empty state view.
17. Update `src/hooks/useFetchWeather.ts`: add `useEffect` watching `data`. When `data` is defined and `location` and `db` are available, call `insertWeatherSnapshot`. Debounce duplicate inserts by checking the query `dataUpdatedAt` value to avoid re-inserting on re-renders.
18. Update `src/app/details.tsx`: add a "View History" `Pressable` (below the `DetailsHeader` or within its action row) that calls `router.push({ pathname: '/history', params: { lat: targetLocation.latitude, lon: targetLocation.longitude, city: targetLocation.city } })`.
19. Run full verification:
    - `npx tsc --noEmit`
    - `pnpm run lint`
    - `pnpm test`
    - Manually verify on Android emulator: fetch weather → navigate to Details → tap View History → confirm snapshot row appears.

## Style & Conventions

- Follows `CLAUDE.md` service → hook → screen data flow. All SQL is confined to `src/services/weatherHistory.service.ts`; no SQL appears in hooks or screens.
- New service functions and hooks are re-exported through their barrel `index.ts` files per established convention.
- Style uses `StyleSheet.create` with theme tokens from `src/theme/index.ts`. No hardcoded color or spacing literals.
- `SymbolView` from `expo-symbols` is used for condition icons in `WeatherHistoryRow` with the same `weatherCodeToCondition` symbol-name pattern from `src/utils/weatherMapper.ts`.
- React Compiler is enabled (`app.json` `reactCompiler: true`): avoid manual `useMemo`, `useCallback`, or `React.memo` unless profiling shows a concrete need.
- TanStack Query v5 constraint: `onSuccess` was removed. The insert side-effect **must** be in a `useEffect` watching `data`, not in `queryFn`.

## Acceptance Criteria

- [ ] A `weather_history` row is inserted each time `useFetchWeather` delivers a new successful `data` value for a resolved location (`db`, `data`, and `location` are all defined).
- [ ] `/history` is reachable from `details.tsx` and renders a `SectionList` grouped by UTC day with sticky daily min/max headers and individual snapshot rows.
- [ ] `WeatherHistoryRow` displays `fetched_at` (formatted local time), WMO condition icon, temperature (with unit), humidity, wind speed (with unit), and surface pressure (or "—" when `null`).
- [ ] The trash icon in the history header clears all rows for the location and transitions to the empty state immediately.
- [ ] Rows older than 30 days are deleted during `initWeatherHistoryDb` on each app startup.
- [ ] `src/tests/services/weatherHistory.service.test.ts` covers table init, insert, retrieve by location, clear, and 30-day pruning — all passing under `pnpm test`.
- [ ] `src/tests/hooks/useWeatherHistory.test.ts` covers empty state, grouped summaries, and clear — all passing under `pnpm test`.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass with zero errors.

## Constraints

- **Android only.** Scope is strictly Android per `docs/features.md` line 3; no iOS configuration required.
- **No native module in Vitest.** `expo-sqlite` uses JSI native bindings and must be fully mocked in `src/tests/setup.ts`; do not run real SQLite in unit tests.
- **No schema migrations at v1.** The initial schema is intentionally simple. Future column additions should introduce `PRAGMA user_version` versioning at that time.
- **No cloud sync.** History is strictly local; no Firestore integration is in scope.
- **No background writes.** Snapshots are only written when the user actively views weather via `useFetchWeather`. Background refresh (a separate roadmap feature) would extend this independently.
- **Retention fixed at 30 days.** Not user-configurable in v1.
- **Non-goals:** history charting beyond DailyWeatherSummary text, CSV export, cloud backup, iOS platform support, and concurrent multi-user history.
