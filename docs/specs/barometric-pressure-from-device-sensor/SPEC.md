# Feature: Barometric Pressure from Device Sensor

## Intent

The details screen shows a live atmospheric-pressure reading from the device barometer alongside the forecast pressure from Open-Meteo, with a short note comparing the two, and degrades gracefully to a clear "not available" message on devices without a barometer.

## Context

- **Problem statement:** The app never reads any device sensor and never shows atmospheric pressure. `expo-sensors` is not in `package.json`, nothing under `src/` references `Barometer`, and the forecast request in `src/services/weather.service.ts:58` does not ask Open-Meteo for a pressure field, so there is no forecast pressure to compare against either.
- **Current code:**
  - `src/app/details.tsx` resolves a non-null `targetLocation` and `weather` before the final render (guarded at `:134`), lays the content out in a left column (`WeatherSummaryCard`) and a right column (`DailyForecastList`), and already holds a `useHaptics()` instance. New cards are added to the left column next to `WeatherSummaryCard`.
  - `src/components/WeatherSummaryCard.tsx` is the established "card" pattern: a `View` with `theme.colors.surfaceSubtle` background, `borderRadius`, `borderLight` border, a `testID`, detail rows with `t(...)` labels, and values formatted via `src/utils/formatters.ts` (`formatRound`). The new pressure card mirrors this styling.
  - `src/interfaces/weather.ts` defines `WeatherResponse.current` as `{ temperature_2m, weather_code, relative_humidity_2m, wind_speed_10m }`. Open-Meteo exposes `surface_pressure` (hPa, station-level, elevation-corrected) as a `current` field; adding it gives a forecast value in the same unit the barometer reports.
  - `src/hooks/useHaptics.ts` gates fire-and-forget haptics on the `hapticsEnabled` setting. Device-action hooks (`src/hooks/useShareWeather.ts`, `src/hooks/useCopyCoordinates.ts`) are the precedent for wrapping a native API in a `use*` hook re-exported from the `src/hooks/index.ts` barrel.
  - Reusable presentational components live in `src/components/` (one component per file, named export, no barrel). Formatters are pure functions in `src/utils/formatters.ts`, unit-tested under `src/tests/utils/`.
  - i18n: all user copy routes through `t(...)` in `src/services/i18n.ts` with `en` and `ja` blocks; interpolation uses the `%{name}` placeholder syntax (e.g. `updatedPrefix: 'Updated %{time}'` at `:15`).
  - Tests mirror `src/` under `src/tests/`. `src/tests/app/details.test.tsx` already mocks the whole `@/hooks` module (`:16`), and `src/tests/services/weather.service.test.ts` asserts the `apiClient.get` params for `fetchWeather`.
- **User impact:** On the details screen, users with a barometer-equipped Android device see a live pressure reading and how it compares to the forecast. Users without the sensor see a clear message instead of a broken or empty card. No existing card, layout, or data flow changes.
- **Dependencies:** Adds `expo-sensors` (install with `npx expo install expo-sensors` to pin the SDK 56 version). The `Barometer` sensor needs no runtime permission on Android and is included in Expo Go; no config plugin is required. It requires a real device; simulators/emulators report the sensor as unavailable, which the graceful-degradation path already covers.

## Data Model

- **`WeatherResponse.current.surface_pressure?: number`** (new, optional) in `src/interfaces/weather.ts`. Optional because the TanStack Query cache is persisted to AsyncStorage for 24h, so a `WeatherResponse` cached before this change will lack the field; the card must guard against it being `undefined`.
- **`BarometerStatus`** (new local type in `src/hooks/useBarometer.ts`): `'checking' | 'available' | 'unavailable'`.
- No database, persistence, or store changes. The live sensor value is transient component state and is not persisted.

## Interfaces / API

### `useBarometer` (hook) - `src/hooks/useBarometer.ts`

```ts
export type BarometerStatus = 'checking' | 'available' | 'unavailable';

export const useBarometer: (options?: { intervalMs?: number }) => {
  status: BarometerStatus;
  pressure: number | null; // hPa, null until the first reading arrives
};
```

- On mount: `status` starts `'checking'`, `pressure` is `null`. Calls `await Barometer.isAvailableAsync()`.
  - If unavailable: sets `status = 'unavailable'` and does not subscribe.
  - If available: sets `status = 'available'`, calls `Barometer.setUpdateInterval(intervalMs ?? 1000)`, and `Barometer.addListener(({ pressure }) => setPressure(pressure))`.
- On unmount: `subscription.remove()`. Guards against setting state after unmount (cancelled flag) so the async availability check cannot update an unmounted component.
- `relativeAltitude` and `timestamp` from `BarometerMeasurement` are ignored; only `pressure` (hPa) is used. `relativeAltitude` is iOS-only and this feature is Android-scoped.
- Effect dependency is `intervalMs` only; re-subscribes if the interval changes.

### `formatPressure` (pure) - `src/utils/formatters.ts`

```ts
export const formatPressure: (value: number) => string;
```

- Returns the pressure rounded to a whole number as a string, e.g. `formatPressure(1013.2)` -> `"1013"`. Pressure is conventionally shown as an integer hPa. Added alongside the existing formatters, no new file.

### `PressureCard` (component) - `src/components/PressureCard.tsx`

```ts
interface PressureCardProps {
  forecastPressure?: number; // weather.current.surface_pressure (hPa), may be undefined for stale cache
}
```

- Named export, calls `useBarometer()` internally (keeps `details.tsx` thin, matching how cards own their own display concerns).
- Renders a card styled like `WeatherSummaryCard` with `testID="pressure-card"` and a `t('pressureCardTitle')` heading.
- Body by `status`:
  - `'checking'`: a small `ActivityIndicator` or `t('pressureChecking')` text.
  - `'unavailable'`: `t('pressureUnavailable')` message. No sensor value shown; if `forecastPressure` is present it may still be shown under the forecast label so the card is not empty.
  - `'available'` with `pressure != null`: sensor row `t('pressureSensorLabel')` = `formatPressure(pressure)` `t('pressureUnit')`; when `forecastPressure` is a number, a forecast row `t('pressureForecastLabel')` = `formatPressure(forecastPressure)` `t('pressureUnit')` plus a comparison note.
- Comparison note (only when both sensor and `forecastPressure` are numbers): `delta = Math.round(pressure - forecastPressure)`.
  - `Math.abs(delta) <= 1` -> `t('pressureMatchesForecast')`.
  - `delta > 1` -> `t('pressureAboveForecast', { delta })` (delta positive).
  - `delta < -1` -> `t('pressureBelowForecast', { delta: Math.abs(delta) })`.

### `fetchWeather` request change - `src/services/weather.service.ts`

- Append `surface_pressure` to the existing `current` CSV param: `current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,surface_pressure'`. No signature change; no new query key (pressure is not unit-dependent, so `useFetchWeather` keying is untouched).

## Files Created

| File                                         | Purpose                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/hooks/useBarometer.ts`                  | Subscribes to `Barometer` with availability detection and lifecycle cleanup; returns status + hPa. |
| `src/components/PressureCard.tsx`            | Details-screen card showing sensor vs forecast pressure and the graceful unavailable state.        |
| `src/tests/hooks/useBarometer.test.ts`       | Tests the hook: available (emits reading), unavailable, and unsubscribe-on-unmount paths.          |
| `src/tests/components/PressureCard.test.tsx` | Tests each status branch and the above/below/matches comparison note.                              |
| `src/tests/utils/formatPressure.test.ts`     | Unit tests for the `formatPressure` formatter (rounding).                                          |

## Files Modified

| File                                         | Change                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/interfaces/weather.ts`                  | Add optional `surface_pressure?: number` to `WeatherResponse.current`.                            |
| `src/services/weather.service.ts`            | Add `surface_pressure` to the `current` request param.                                            |
| `src/utils/formatters.ts`                    | Add the pure `formatPressure(value)` helper.                                                      |
| `src/hooks/index.ts`                         | Re-export `useBarometer` from the hooks barrel.                                                   |
| `src/app/details.tsx`                        | Render `<PressureCard forecastPressure={weather.current.surface_pressure} />` in the left column. |
| `src/services/i18n.ts`                       | Add the pressure keys below under both `en` and `ja`.                                             |
| `package.json`                               | Add `expo-sensors` (via `npx expo install`).                                                      |
| `src/tests/services/weather.service.test.ts` | Update the expected `current` param string to include `surface_pressure`.                         |
| `src/tests/app/details.test.tsx`             | Add `useBarometer` to the `@/hooks` mock and assert the pressure card renders.                    |

## Implementation Steps

1. Install the dependency: `npx expo install expo-sensors` (pins the SDK 56 version, updates `package.json`).
2. Add `surface_pressure?: number` to `WeatherResponse.current` in `src/interfaces/weather.ts`.
3. Append `surface_pressure` to the `current` CSV in `src/services/weather.service.ts`, and update the expected param string in `src/tests/services/weather.service.test.ts`.
4. Add localized copy to `src/services/i18n.ts` (`en` + `ja`) under a `// Pressure` comment: `pressureCardTitle`, `pressureSensorLabel`, `pressureForecastLabel`, `pressureUnit` (`'hPa'` in both), `pressureChecking`, `pressureUnavailable`, `pressureMatchesForecast`, `pressureAboveForecast` (`'%{delta} hPa above forecast'`), `pressureBelowForecast` (`'%{delta} hPa below forecast'`).
5. Add `formatPressure(value)` to `src/utils/formatters.ts` (round to a whole number, return string).
6. Create `src/hooks/useBarometer.ts`: `useState` for `status` (`'checking'`) and `pressure` (`null`); a `useEffect` that runs `Barometer.isAvailableAsync()`, and on `true` sets the interval, adds the listener, and stores the subscription; cleanup removes the subscription; use a cancelled flag so the async check never sets state post-unmount. Import `{ Barometer } from 'expo-sensors'`.
7. Re-export `useBarometer` from `src/hooks/index.ts`.
8. Create `src/components/PressureCard.tsx`: call `useBarometer()`, render the card by `status`, format values with `formatPressure` + `t('pressureUnit')`, and compute the comparison note when both values exist. Style with `theme` tokens mirroring `WeatherSummaryCard`; add `testID="pressure-card"`.
9. Wire `src/app/details.tsx`: render `<PressureCard forecastPressure={weather.current.surface_pressure} />` in the left column below `WeatherSummaryCard` (both columns already exist).
10. Add tests: `formatPressure.test.ts` (rounding); `useBarometer.test.ts` (mock `expo-sensors` `Barometer` with `isAvailableAsync`, `setUpdateInterval`, `addListener` returning a `{ remove }` subscription; assert available emits the reading, unavailable sets status and never subscribes, unmount calls `remove`); `PressureCard.test.tsx` (mock `useBarometer` to drive each branch and assert the sensor/forecast rows and above/below/matches note); update `details.test.tsx` (add `useBarometer` to the `@/hooks` mock, assert `pressure-card` renders).
11. Verify: `npx tsc --noEmit`, `pnpm run lint`, `pnpm test`. Confirm on a physical Android device (barometer-equipped and one without) that the live value updates and the unavailable message shows correctly; the user runs native builds.

## Style & Conventions

- Follows `CLAUDE.md` and the react-native skill: one hook per file re-exported from the `index.ts` barrel, one component per file with a named export in `src/components/` (no barrel), `@/` imports, TypeScript strict, functional components, formatters in `src/utils/formatters.ts`, styling via `StyleSheet.create` with `src/theme` tokens.
- Mirrors `WeatherSummaryCard` for card layout and `useShareWeather`/`useCopyCoordinates` for the device-API hook shape (side effects and lifecycle encapsulated in the hook).
- All user-facing copy routes through `t(...)` in both `en` and `ja`, using the `%{name}` interpolation syntax. No em-dashes in any added strings or comments; keep comments brief.
- React Compiler is enabled, so effects/handlers are not hand-wrapped in `useMemo`/`useCallback` unless profiling shows a need.
- Per `AGENTS.md`, the `Barometer` API is taken from the SDK 56 docs (`isAvailableAsync`, `addListener` returning a subscription with `remove()`, `setUpdateInterval`, measurement `{ pressure, relativeAltitude?, timestamp }` in hPa).

## Acceptance Criteria

- [ ] On a barometer-equipped device, the details screen shows a `pressure-card` with a live sensor reading in hPa that updates over time.
- [ ] When the forecast `surface_pressure` is present, the card shows a forecast row and a comparison note that reads matches / above / below correctly based on the signed difference (threshold 1 hPa).
- [ ] On a device without a barometer (`isAvailableAsync` resolves `false`), the card shows the localized `pressureUnavailable` message and never subscribes to the sensor.
- [ ] Unmounting the card removes the barometer subscription (no listener leak) and the async availability check does not set state after unmount.
- [ ] `fetchWeather` requests `surface_pressure` in the `current` param, and `WeatherResponse.current.surface_pressure` is typed as optional so a pre-change cached response still type-checks and renders (card omits the forecast row).
- [ ] `formatPressure` is pure and covered by a unit test; `pressureCardTitle`, `pressureSensorLabel`, `pressureForecastLabel`, `pressureUnit`, `pressureChecking`, `pressureUnavailable`, `pressureMatchesForecast`, `pressureAboveForecast`, and `pressureBelowForecast` exist under both `en` and `ja`.
- [ ] `expo-sensors` is added to `package.json` at an SDK 56-compatible version.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass, including the new util/hook/component tests and the updated `weather.service` and `details` tests.

## Constraints

- **Placement:** a single card on the details screen only. No pressure on the home screen, saved-location list, or in notifications.
- **Android-only focus** per the roadmap. `relativeAltitude` (iOS-only) is ignored; the sensor is unavailable on web and on most emulators, which is treated as the normal unavailable path, not an error.
- **The comparison is informational.** The raw sensor reports absolute station pressure and its calibration varies by device, while Open-Meteo `surface_pressure` is a modeled elevation-corrected value, so a nonzero delta is expected and is not a bug. No sea-level (MSL) normalization is performed.
- **Update cadence** defaults to ~1s (`setUpdateInterval`) to balance responsiveness against battery; the value is not smoothed or averaged.
- **Non-goals:** unit conversion (inHg/mmHg/kPa), a pressure trend/history graph, altimeter/altitude display, storing readings, a settings toggle for the sensor, pressure-based alerts, and any pressure UI outside the details card.
- **Unresolved until implementation:** confirm Open-Meteo returns `surface_pressure` under `current` for the existing `/forecast` request shape (documented field, to be verified against a live response during implementation); `pressure_msl` is the fallback field name if `surface_pressure` is not returned.
