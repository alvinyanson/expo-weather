# Feature: Hourly Temperature Chart

## Intent

The details screen shows the next 24 hours of temperature as a smooth line/area chart with a precipitation-probability bar row underneath, drawn from the hourly data the app already fetches, and sizes itself responsively to the screen width.

## Context

- **Problem statement:** The `/forecast` request already asks Open-Meteo for `hourly: 'temperature_2m,weather_code,precipitation_probability'` (`src/services/weather.service.ts:52`) and `WeatherResponse.hourly` is fully typed (`src/interfaces/weather.ts:17`), but on the details screen that hourly data is unused. The only consumer of `weather.hourly` today is `HourlyForecast`, and it is rendered on the home screen only (`src/app/index.tsx:121`), never on details. The details screen shows current, pressure, and daily forecast, with no intra-day temperature trend and no charting anywhere in the app.
- **Current code:**
  - `src/app/details.tsx` resolves a non-null `weather` and `targetLocation` before its final render (guarded at `:127`) and lays content out in a left column (`WeatherSummaryCard`, `PressureCard`) and a right column (`DailyForecastList`). It already derives `tempUnit` (`'°C'`/`'°F'`, `:33`) and reads `useWindowDimensions()` (`:27`). The chart is added to the left column, matching how `PressureCard` was added next to `WeatherSummaryCard`.
  - `src/components/HourlyForecast.tsx:30` computes a "next 24 hours" slice inline: `weather.hourly.time.reduce(...)`, keeping entries whose time is `>= Date.now() - 3600000` up to 24 items, reading `temperature_2m[i]`, `weather_code[i]`, `precipitation_probability[i]` with `?? 0` fallbacks. This selection logic is duplicated by the chart, so it is extracted into a shared helper both components use.
  - No charting or SVG dependency exists. `package.json` has neither `react-native-svg`, `@shopify/react-native-skia`, nor `victory-native`. `react-native-reanimated` (4.3.1) is present but is not a drawing primitive.
  - `src/utils/formatters.ts` holds pure formatters (`formatRound`, `formatHourlyTime` -> `"10AM"`) unit-tested under `src/tests/utils/`. `weatherCodeToSymbol`/`getIconTintColor` live in `src/utils/weatherMapper.ts`.
  - Presentational components live in `src/components/` (one per file, named export, no barrel). Cards use `theme.colors.surfaceSubtle` backgrounds, `theme.borderRadius`, and a `testID`.
  - i18n: all copy routes through `t(...)` in `src/services/i18n.ts` with `en` + `ja` blocks and `%{name}` interpolation.
  - Tests mirror `src/` under `src/tests/`. The vitest config (`vitest.config.ts:8`) aliases `react-native` -> `react-native-web` under jsdom; native-only modules are mocked per test (e.g. `vi.mock('expo-symbols', ...)` in `src/tests/app/details.test.tsx:11`).
- **User impact:** On the details screen users see how temperature moves across the next 24 hours and when precipitation is likely, surfacing data the API already returns. Nothing on the home screen or the existing daily forecast changes.
- **Dependencies:** Adds `react-native-svg` (install with `npx expo install react-native-svg` to pin the SDK 56 version). It is an Expo-supported package with a config-plugin-free autolinked native module and first-class `react-native-web` support. It is chosen over Skia-based options (`@shopify/react-native-skia`, current `victory-native`) because Skia does not run under the repo's jsdom + `react-native-web` test harness, whereas the drawing math here is isolated in a pure, directly unit-testable helper and the SVG primitives are mocked in component tests.

## Data Model

- No changes to `src/interfaces/weather.ts`; `WeatherResponse.hourly` already carries every field the chart needs.
- New local types in `src/utils/hourlyChart.ts` (not shared interfaces, since only the chart and its helper use them):

```ts
export interface HourlyPoint {
  time: string; // ISO string from weather.hourly.time
  temperature: number; // in the user's unit (already unit-converted by the API)
  precipitation: number; // probability 0..100
}

export interface ChartGeometry {
  width: number;
  height: number;
  linePath: string; // SVG path "d" for the smooth temperature line
  areaPath: string; // SVG path "d" for the filled area under the line
  precipBars: { x: number; y: number; width: number; height: number; value: number }[];
  hourLabels: { x: number; label: string }[]; // sparse x-axis labels
  tempLabels: { y: number; label: string }[]; // min/max y-axis labels
  minTemp: number;
  maxTemp: number;
}
```

- No persistence, store, or query changes. The chart is a pure render of the existing cached `WeatherResponse`.

## Interfaces / API

### `selectNext24Hours` (pure) - `src/utils/hourlyChart.ts`

```ts
export const selectNext24Hours: (
  hourly: WeatherResponse['hourly'] | undefined,
  now?: number, // defaults to Date.now(); param makes it deterministic in tests
) => HourlyPoint[];
```

- Mirrors the existing `HourlyForecast` selection: keep entries whose `new Date(time).getTime() >= now - 3_600_000`, cap at 24, apply `?? 0` fallbacks. Returns `[]` when `hourly` is undefined/empty. `weather_code` is not needed by the chart, so it is not included in `HourlyPoint`.

### `buildChartGeometry` (pure) - `src/utils/hourlyChart.ts`

```ts
export const buildChartGeometry: (
  points: HourlyPoint[],
  opts: {
    width: number;
    height: number;
    tempUnit: string; // "°C" / "°F", for the min/max labels
    padding?: { top: number; right: number; bottom: number; left: number };
    hourLabelEvery?: number; // default 6 -> a label every 6 hours
    formatHour?: (iso: string) => string; // default formatHourlyTime
  },
) => ChartGeometry | null;
```

- Returns `null` when `points.length < 2` (nothing meaningful to draw).
- Vertical split: the temperature line/area occupies the top band and the precipitation bars the bottom band (default ~70% / ~30% of the plot height) sharing one x-axis. `x` maps point index across the plot width; temperature `y` maps `[minTemp, maxTemp]` (with a small padding so flat lines are not clipped) into the top band, inverted so higher temp is higher on screen.
- `linePath`/`areaPath` use a smooth curve (Catmull-Rom converted to cubic beziers) through the temperature points; `areaPath` closes down to the temperature-band baseline for the fill.
- `precipBars` are computed for every point, height proportional to `precipitation/100` within the bottom band; a bar with `value === 0` has `height === 0`.
- `hourLabels` are emitted every `hourLabelEvery` points (index 0 labelled from the first point's hour); `tempLabels` are the rounded min and max at their band positions. No timezone math beyond `formatHour(iso)`, which reuses `formatHourlyTime`.

### `HourlyTemperatureChart` (component) - `src/components/HourlyTemperatureChart.tsx`

```ts
interface HourlyTemperatureChartProps {
  weather: WeatherResponse;
  tempUnit: string; // "°C" / "°F"
}
```

- Named export. Calls `selectNext24Hours(weather.hourly)` internally; renders `null` when `!weather.hourly` or the slice has fewer than 2 points (graceful empty state, consistent with `HourlyForecast` returning `null` on missing hourly).
- Measures its own width via `onLayout` (container `View`), stores it in state, and only renders the SVG once width `> 0`; height is a fixed constant from `theme.spacing`. Passes width/height/`tempUnit` to `buildChartGeometry`.
- Renders inside a card (`theme.colors.surfaceSubtle`, `borderRadius`, `testID="hourly-temperature-chart"`) with a `t('hourlyChartTitle')` heading. Draws with `react-native-svg`: `Path` (area fill using `theme.colors.accent` at low opacity, and the line stroke), `Rect` per precip bar (`theme.colors.secondary`), and `SvgText`/RN `Text` for hour and min/max temp labels. The "Now" position (first point) gets a small `Circle` marker.
- Decorative SVG shapes set `accessible={false}`; the card exposes a summarized `accessibilityLabel` (e.g. min/max over the next 24h) so the trend is announced without reading every point.

### Weather request

- No change. `fetchWeather` already requests the hourly fields; `useFetchWeather` keying is untouched (temperature is already returned in the selected unit).

## Files Created

| File                                                   | Purpose                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/utils/hourlyChart.ts`                             | Pure helpers: `selectNext24Hours` (shared 24h slice) and `buildChartGeometry` (paths, bars, axis labels). |
| `src/components/HourlyTemperatureChart.tsx`            | Details-screen card that renders the temperature line/area + precip bars via `react-native-svg`.          |
| `src/tests/utils/hourlyChart.test.ts`                  | Unit tests for the slice selection and geometry math (empty/short input, scaling, bar heights, labels).   |
| `src/tests/components/HourlyTemperatureChart.test.tsx` | Tests render with mocked `react-native-svg`: renders with data, returns null on missing/short hourly.     |

## Files Modified

| File                                | Change                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/services/i18n.ts`              | Add chart copy under `en` + `ja` (`hourlyChartTitle`, `hourlyChartEmpty`, `hourlyChartPrecipLabel`, `hourlyChartA11yLabel`). |
| `src/components/HourlyForecast.tsx` | Replace the inline 24h reduce with `selectNext24Hours(weather.hourly)` (dedup; behavior unchanged).                          |
| `src/app/details.tsx`               | Render `<HourlyTemperatureChart weather={weather} tempUnit={tempUnit} />` in the left column.                                |
| `src/tests/app/details.test.tsx`    | Add a `vi.mock('react-native-svg', ...)`; add `hourly` to the `weather` fixture; assert the chart renders.                   |
| `package.json`                      | Add `react-native-svg` (via `npx expo install`).                                                                             |

## Implementation Steps

1. Install the dependency: `npx expo install react-native-svg` (pins the SDK 56 version, updates `package.json`).
2. Create `src/utils/hourlyChart.ts` with `HourlyPoint`, `ChartGeometry`, `selectNext24Hours(hourly, now?)`, and `buildChartGeometry(points, opts)`. Keep both functions pure and free of React. Default `formatHour` to `formatHourlyTime` from `src/utils/formatters.ts`.
3. Add `src/tests/utils/hourlyChart.test.ts`: `selectNext24Hours` with a fixed `now` (empty/undefined -> `[]`, filters past hours, caps at 24, `?? 0` fallbacks); `buildChartGeometry` (returns `null` for `< 2` points, min/max scaling with a flat series, `precipBars` height 0 at 0% and full at 100%, `hourLabels` cadence, `tempLabels` values).
4. Refactor `src/components/HourlyForecast.tsx` to build its list from `selectNext24Hours(weather.hourly)` instead of the inline reduce, keeping the existing rendering and `testID`. Confirm `src/tests/components/HourlyForecast.test.tsx` still passes unchanged.
5. Add localized copy to `src/services/i18n.ts` (`en` + `ja`) under a `// HourlyTemperatureChart` comment: `hourlyChartTitle` (e.g. `'Next 24 Hours'`), `hourlyChartEmpty`, `hourlyChartPrecipLabel` (e.g. `'Precipitation'`), `hourlyChartA11yLabel` (`'Temperature from %{min}%{unit} to %{max}%{unit} over the next 24 hours.'`).
6. Create `src/components/HourlyTemperatureChart.tsx`: call `selectNext24Hours`, guard for missing/short data, measure width via `onLayout`, call `buildChartGeometry`, and render the card with `react-native-svg` `Path`/`Rect`/`Circle`/`SvgText` styled from `theme`. Add `testID="hourly-temperature-chart"` and the summarized `accessibilityLabel`.
7. Wire `src/app/details.tsx`: render `<HourlyTemperatureChart weather={weather} tempUnit={tempUnit} />` in the left column below `WeatherSummaryCard`/`PressureCard`.
8. Add `src/tests/components/HourlyTemperatureChart.test.tsx`: `vi.mock('react-native-svg', ...)` returning stub elements; assert the card renders with a valid `hourly` fixture, and renders `null` when `hourly` is omitted or has one point.
9. Update `src/tests/app/details.test.tsx`: mock `react-native-svg`, extend the `weather` fixture with an `hourly` block, and assert `hourly-temperature-chart` is present.
10. Verify: `npx tsc --noEmit`, `pnpm run lint`, `pnpm test`. Confirm on a physical Android device that the chart draws, scales, and lays out correctly on phone and tablet widths (the user runs native builds).

## Style & Conventions

- Follows `CLAUDE.md` and the react-native skill: one component per file with a named export in `src/components/` (no barrel), pure helpers in `src/utils/`, `@/` imports, TypeScript strict, `StyleSheet.create` with `src/theme` tokens over literals.
- Mirrors `WeatherSummaryCard`/`PressureCard` for card styling and the existing `HourlyForecast` for the 24h selection semantics (now shared, not duplicated).
- All user-facing copy routes through `t(...)` in both `en` and `ja` using `%{name}` interpolation. No em-dashes in added strings or comments; keep comments brief.
- React Compiler is enabled, so effects/handlers are not hand-wrapped in `useMemo`/`useCallback` unless profiling shows a need.
- Per `AGENTS.md`, the `react-native-svg` API (`Svg`, `Path`, `Rect`, `Circle`, `Text`, `G`) is taken from its SDK 56-compatible version; drawing math lives in the pure helper, not the component.

## Acceptance Criteria

- [ ] The details screen renders a `hourly-temperature-chart` card showing a smooth temperature line/area for the next 24 hours with a precipitation-probability bar row beneath it, sharing one x-axis.
- [ ] The chart uses the already-fetched `weather.hourly` data with no change to `fetchWeather` or the query key; temperatures display in the user's selected unit.
- [ ] The chart sizes to the measured container width (phone and tablet) and shows sparse hour labels plus min/max temperature labels.
- [ ] With `weather.hourly` absent or fewer than two upcoming hours, the component renders `null` and the rest of the details screen is unaffected.
- [ ] `selectNext24Hours` and `buildChartGeometry` are pure and covered by unit tests (empty/short input, temperature scaling, precip bar heights at 0% and 100%, label cadence); the refactored `HourlyForecast` keeps its existing tests green.
- [ ] `hourlyChartTitle`, `hourlyChartEmpty`, `hourlyChartPrecipLabel`, and `hourlyChartA11yLabel` exist under both `en` and `ja`.
- [ ] `react-native-svg` is added to `package.json` at an SDK 56-compatible version.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass, including the new util/component tests and the updated `HourlyForecast` and `details` tests.

## Constraints

- **Placement:** a single card on the details screen only. No chart on the home screen (which keeps the existing scrollable `HourlyForecast`), saved list, or notifications.
- **Horizon:** exactly the next 24 hours from the current hour, matching the existing `HourlyForecast` window; no zoom, pan, tooltip, or point-selection interaction.
- **Rendering choice:** `react-native-svg`, not Skia, so the drawing is testable in the existing jsdom + `react-native-web` harness; the smooth curve is a Catmull-Rom/bezier approximation, not a statistically fitted spline.
- **Android-only focus** per the roadmap; not styled or verified for iOS or web beyond what the shared components already provide.
- **Non-goals:** feels-like/apparent-temperature or humidity series, weather-code icons on the curve, animated draw-in, gesture interaction, a second (daily) chart, day/night shading, and any charting on screens other than details.
- **Unresolved until implementation:** the exact curve-smoothing tension and the top/bottom band split are visual-tuning constants to finalize against a real device; `precipitation_probability` is assumed present in cached responses because it has long been part of the hourly request, but the helper still applies a `?? 0` fallback per element.

```

```
