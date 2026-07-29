# Feature: Localized Units and Dates

## Intent

Extend internationalization (i18n) across the app to format all dates, times, numbers, and relative timestamps using the active app locale (`en`, `ja`, or resolved system default) via JavaScript standard `Intl` APIs, and audit components to ensure full localization coverage without adding a 3rd language or RTL support.

## Context

- **Problem statement:**
  - `src/utils/formatters.ts:8-29` relies on `toLocaleDateString('default', ...)` and `toLocaleTimeString('default', ...)`. Because `'default'` queries the device runtime's system locale, date and time strings fail to mirror user-selected language preferences when an explicit app language (`en` or `ja`) is chosen in Settings while the host OS locale differs.
  - Weather numbers (temperatures, wind speeds, atmospheric pressure, coordinates, humidity, precipitation) use raw `Math.round(value).toString()` (`src/utils/formatters.ts:3-5,37-39`) or inline string templates without locale-aware number formatting via `Intl.NumberFormat`.
  - Component timestamps (e.g. `DetailsHeader.tsx`, `SavedLocationItem.tsx`) display static date/time strings rather than localized relative time strings (e.g., "5 minutes ago" / "5分前" using `Intl.RelativeTimeFormat`).
- **Current code:**
  - `src/services/i18n.ts:443-465`: Initializes `i18n-js` with `en` and `ja` translations, subscribing to language changes from `useSettingsStore`.
  - `src/utils/formatters.ts:1-40`: Exports `formatRound`, `formatDateFull`, `formatDayName`, `formatTime`, `formatHourlyTime`, `formatCoordinates`, and `formatPressure`.
  - `src/store/useSettingsStore.ts:7,14,37,46`: Manages `language: Language` (`'system' | 'en' | 'ja'`).
  - `src/app/settings.tsx:168-221`: Renders the language setting toggle for System, English, and Japanese.
- **User impact:**
  - Changing language in Settings immediately updates all dates, times, numbers, and unit formatting across every screen to match the selected locale rules.
  - Relative time indicators render naturally in the selected locale ("Updated 3 minutes ago" vs. "3分前に更新").
- **Dependencies:** Standard `Intl` APIs (`Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`), `i18n-js` (`~4.5.0`), `expo-localization` (`~16.0.5`), and `useSettingsStore`.

## Data Model

### `AppLocale` Helper Type (`src/utils/formatters.ts`)

```ts
export type AppLocale = 'en' | 'ja' | string;
```

- Persistence schema in `useSettingsStore` (`settings-storage` key in MMKV) remains unchanged (`language: Language` as `'system' | 'en' | 'ja'`).

## Interfaces / API

### Locale Resolution Helper (`src/utils/formatters.ts`)

```ts
export const getAppLocale: () => string;
```

- Returns active locale string derived from `i18n.locale` (e.g. `'en'`, `'ja'`, or resolved locale like `'en-US'`).

### Updated Formatter Utility Signatures (`src/utils/formatters.ts`)

```ts
export const formatRound: (value: number, locale?: string) => string;
export const formatNumber: (
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string,
) => string;
export const formatDateFull: (dateStr?: string | number | Date, locale?: string) => string;
export const formatDayName: (dateStr: string | number | Date, locale?: string) => string;
export const formatTime: (dateStr: string | number | Date, locale?: string) => string;
export const formatHourlyTime: (dateStr: string | number | Date, locale?: string) => string;
export const formatRelativeTime: (dateStr: string | number | Date, locale?: string) => string;
export const formatCoordinates: (lat: number, lon: number, locale?: string) => string;
export const formatPressure: (value: number, locale?: string) => string;
```

- **`formatNumber`**: Uses `Intl.NumberFormat(locale ?? getAppLocale(), options).format(value)`.
- **`formatRelativeTime`**: Uses `Intl.RelativeTimeFormat(locale ?? getAppLocale(), { numeric: 'auto' })` to format elapsed time in seconds, minutes, hours, or days relative to current time. Includes fallback for environments lacking full `Intl.RelativeTimeFormat` support.
- **Date/Time formatters**: Replaces system `'default'` with `locale ?? getAppLocale()` in `toLocaleDateString` and `toLocaleTimeString` calls.

## Files Created

| File                                           | Purpose                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `docs/specs/localized-units-and-dates/SPEC.md` | Feature specification document for localized units and dates.                                                 |
| `src/tests/utils/formattersLocale.test.ts`     | Unit tests verifying locale-aware date, time, relative time, and number formatting for `en` and `ja` locales. |

## Files Modified

| File                                   | Change                                                                                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/formatters.ts`              | Update `formatDateFull`, `formatDayName`, `formatTime`, and `formatHourlyTime` to use active `getAppLocale()` instead of `'default'`. Add `formatNumber` and `formatRelativeTime`. |
| `src/services/i18n.ts`                 | Add missing keys identified during string audit.                                                                                                                                   |
| `src/components/DetailsHeader.tsx`     | Update updated-at timestamp display to use `formatRelativeTime`.                                                                                                                   |
| `src/components/SavedLocationItem.tsx` | Update saved timestamp display to use `formatRelativeTime`.                                                                                                                        |
| `src/components/CurrentWeather.tsx`    | Ensure date display uses updated locale-aware `formatDateFull`.                                                                                                                    |
| `src/components/DailyForecastList.tsx` | Ensure day name rendering uses updated locale-aware `formatDayName`.                                                                                                               |
| `src/components/HourlyForecast.tsx`    | Ensure hourly timestamp rendering uses updated locale-aware `formatHourlyTime`.                                                                                                    |
| `src/tests/utils/formatters.test.ts`   | Update existing formatter tests for new function signatures and locale parameters.                                                                                                 |

## Implementation Steps

1. Audit codebase UI screens (`src/app/`, `src/components/`) and add any missing translation keys to `en` and `ja` dictionaries in `src/services/i18n.ts`.
2. Update `src/utils/formatters.ts` with `getAppLocale()`, `formatNumber`, `formatRelativeTime`, and refactor existing date/time formatters to use `locale ?? getAppLocale()` instead of system `'default'`.
3. Write unit tests in `src/tests/utils/formattersLocale.test.ts` verifying date, time, relative time, and number formatting under both `en` and `ja` locales.
4. Update UI components (`CurrentWeather.tsx`, `DailyForecastList.tsx`, `HourlyForecast.tsx`, `DetailsHeader.tsx`, `SavedLocationItem.tsx`, `WeatherHistoryRow.tsx`, `WeatherSummaryCard.tsx`) to utilize updated locale-aware formatters and relative time functions.
5. Update existing component and formatter unit tests (`src/tests/utils/formatters.test.ts`, `src/tests/components/*.test.tsx`) to align with updated signatures.
6. Run verification commands: `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test`.

## Style & Conventions

- Follows architecture guidelines in `CLAUDE.md` and `AGENTS.md`.
- Relies on standard ES/JavaScript `Intl` native APIs (`Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`) without pulling in heavy external date libraries.
- Preserves existing Zustand persist adapter setup in `useSettingsStore.ts`.
- Uses Vitest for unit tests under `src/tests/`.

## Acceptance Criteria

- [ ] Changing language in Settings between English (`en`) and Japanese (`ja`) updates date names, time strings, numbers, and relative timestamps across all screens in the selected locale.
- [ ] `formatDateFull`, `formatDayName`, `formatTime`, and `formatHourlyTime` in `src/utils/formatters.ts` format using active `getAppLocale()` instead of system `'default'`.
- [ ] Last updated timestamps in `DetailsHeader` and saved timestamps in `SavedLocationItem` format using locale-aware relative time formatting (e.g. "5 minutes ago" vs "5分前").
- [ ] Codebase audit confirms zero remaining un-localized hardcoded text strings in UI components.
- [ ] Automated Vitest unit tests in `src/tests/utils/formattersLocale.test.ts` pass cleanly.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` execute with zero errors.

## Constraints

- **Explicit Non-Goal 1: Skip adding a 3rd language.** No additional language dictionaries (e.g., Spanish, French, German) will be added to `src/services/i18n.ts`. Supported languages remain `system`, `en`, and `ja`.
- **Explicit Non-Goal 2: Skip RTL (Right-to-Left) support.** Right-to-left layout adjustments, directional flex changes, and `I18nManager.forceRTL` handling are strictly excluded from scope per project directives.
- **Explicit Non-Goal 3: Pseudo-localization mode.** Pseudo-localization mode is excluded to keep scope focused and straightforward.
- Function signatures in `formatters.ts` must maintain backwards compatibility for callers omitting an explicit locale parameter.
