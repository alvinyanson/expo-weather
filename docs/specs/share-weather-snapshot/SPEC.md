# Feature: Share Weather Snapshot (Text)

## Intent

The details screen offers a share action that composes a short localized text summary (city, condition, current temperature, and today's high/low) and opens the Android share sheet, letting users hand the current weather off to any other app.

## Context

- **Problem statement:** There is no way to share weather from the app. The details header (`src/components/DetailsHeader.tsx`) has a back action and an optional save action but nothing to share, and no code references React Native's `Share` API anywhere in `src/`.
- **Current code:**
  - `src/app/details.tsx` composes the details screen. It already has `targetLocation` (`{ latitude, longitude, city }`), the loaded `weather: WeatherResponse`, the resolved `tempUnit` (`'°C'` / `'°F'`, `:31`), and a `useHaptics()` instance (`:56`). It renders `<DetailsHeader ... onSave={handleSaveLocation} isSaved={isSaved} />` (`:123`).
  - `src/components/DetailsHeader.tsx` uses a `flexDirection: 'row'` header with `justifyContent: 'space-between'`: back (left, `48` wide), a centered title container, and a right slot that shows the save `Pressable` (`testID="details-save-button"`) when `onSave` is provided, otherwise a `48`-wide spacer `View`. With one icon per side the `space-between` layout keeps the title visually centered; a second right-side icon would break that centering. It uses `SymbolView` icons, `theme.colors`, `android_ripple`, and `t(...)` labels.
  - `WeatherResponse` (`src/interfaces/weather.ts`) exposes `current.temperature_2m`, `current.weather_code`, and `daily.temperature_2m_max[]` / `daily.temperature_2m_min[]`.
  - `weatherCodeToCondition(code)` (`src/utils/weatherMapper.ts:66`) maps a WMO code to a localized condition string; `formatRound(value)` (`src/utils/formatters.ts:3`) rounds a number to a string.
  - Toasts use `Toast.show({ type, text1, text2 })` from `react-native-toast-message`; errors are reported via `reportError(e, { where })` (used in `src/hooks/useSavedLocations.ts`).
  - Conventions: services/hooks are one-per-file re-exported from `index.ts` barrels; user copy goes through `t(...)` in `src/services/i18n.ts` (`en` + `ja`); tests mirror `src/` under `src/tests/`.
- **User impact:** Users can share a compact weather summary to messaging, notes, email, etc. via the standard Android share sheet. No existing behavior changes; the save action and header layout are preserved with the share icon added beside it.
- **Dependencies:** None new. React Native's built-in `Share` API covers text-only sharing. Image capture (`react-native-view-shot`, `expo-sharing`) is an explicit non-goal for this scope (see Constraints).

## Data Model

N/A — no new persisted state, database, or network changes. The feature reads the already-loaded `WeatherResponse` and existing settings. No new interface in `src/interfaces/`; the message-builder input is a small inline arg type.

## Interfaces / API

### `buildWeatherShareMessage` (pure) — `src/utils/shareWeather.ts`

```ts
export const buildWeatherShareMessage: (args: {
  city: string;
  weather: WeatherResponse;
  tempUnit: string; // '°C' | '°F', already carrying the degree glyph
}) => string;
```

- Reads `weather.current.temperature_2m`, `weather.current.weather_code`, `weather.daily.temperature_2m_max[0]`, `weather.daily.temperature_2m_min[0]`.
- Rounds temperatures with `formatRound`, resolves the condition with `weatherCodeToCondition`, and interpolates the localized `shareMessage` template via `t(...)`.
- Pure and synchronous; no side effects. Missing `daily[0]` values fall back to `0` (mirrors `WeatherSummaryCard`'s `?? 0` for UV) so the string is always well-formed.

### `useShareWeather` (hook) — `src/hooks/useShareWeather.ts`

```ts
export const useShareWeather: () => {
  share: (args: { city: string; weather: WeatherResponse; tempUnit: string }) => Promise<void>;
};
```

- Builds the message with `buildWeatherShareMessage`, then calls
  `Share.share({ message, title: t('shareDialogTitle') }, { dialogTitle: t('shareDialogTitle') })`.
- On a resolved `Share.sharedAction`, fires `haptics.success()`. A resolved `Share.dismissedAction` (user cancelled) is a no-op, no haptic, no toast.
- On a thrown error, calls `reportError(e, { where: 'useShareWeather.share' })` and `Toast.show({ type: 'error', text1: t('shareFailedTitle'), text2: t('shareFailedBody') })`. Never rethrows; sharing failure never breaks the screen.

### `DetailsHeader` prop addition — `src/components/DetailsHeader.tsx`

- New optional prop `onShare?: () => void`. When provided, a share `Pressable` (`testID="details-share-button"`, `accessibilityLabel={t('shareLabel')}`, `SymbolView` `{ ios: 'square.and.arrow.up', android: 'share' }`) renders in the header's right actions row alongside the save action (share first, then save). When absent, nothing extra renders. Save behavior/markup is unchanged.
- **Layout change to keep the title centered:** the header is restructured into three sections instead of relying on `justifyContent: 'space-between'`. The left slot (back) and the right slot (actions row) each get `flex: 1` (left `alignItems: 'flex-start'`, right `flexDirection: 'row'` + `alignItems: 'flex-end'` / `justifyContent: 'flex-end'`), with the title container in the middle at its natural width. Equal-flex side slots give equal margins, so the title stays screen-centered whether the right side holds one icon (save only) or two (share + save). The `48`-wide spacer fallback is no longer needed since the empty `flex: 1` slot reserves the symmetric space. Header `height` and `paddingHorizontal` are unchanged.

## Files Created

| File                                      | Purpose                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/utils/shareWeather.ts`               | Pure `buildWeatherShareMessage` composing the localized summary string.            |
| `src/hooks/useShareWeather.ts`            | Hook wrapping React Native `Share`, with success haptic and error toast/reporting. |
| `src/tests/utils/shareWeather.test.ts`    | Unit tests for the message builder (condition, temps, unit interpolation).         |
| `src/tests/hooks/useShareWeather.test.ts` | Tests the hook: shared vs dismissed vs error paths (mock `Share`, haptics, toast). |

## Files Modified

| File                                          | Change                                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/DetailsHeader.tsx`            | Add optional `onShare`; render a share `Pressable` beside save; restructure into `flex: 1` left/right slots with a centered title so it stays centered with two right-side icons. |
| `src/app/details.tsx`                         | Call `useShareWeather()`; add `handleShare` building args from `targetLocation`/`weather`/`tempUnit`; pass `onShare`.                                                             |
| `src/hooks/index.ts`                          | Re-export `useShareWeather` from the barrel.                                                                                                                                      |
| `src/services/i18n.ts`                        | Add `shareLabel`, `shareDialogTitle`, `shareMessage`, `shareFailedTitle`, `shareFailedBody` under `en` and `ja`.                                                                  |
| `src/tests/components/DetailsHeader.test.tsx` | Add cases: share button renders and fires `onShare` when provided; absent when `onShare` is omitted.                                                                              |
| `src/tests/app/details.test.tsx`              | Add `useShareWeather` to the `@/hooks` mock; assert the share button triggers `share` with the displayed data.                                                                    |

## Implementation Steps

1. Add the localized copy to `src/services/i18n.ts` (`en` + `ja`): `shareLabel` (button a11y label), `shareDialogTitle` (Android sheet title), `shareMessage` (template with `%{city}`, `%{condition}`, `%{temp}`, `%{high}`, `%{low}`, `%{unit}`), `shareFailedTitle`, `shareFailedBody`.
2. Create `src/utils/shareWeather.ts` with `buildWeatherShareMessage`, using `weatherCodeToCondition`, `formatRound`, and `t('shareMessage', {...})`. Import `WeatherResponse` from `@/interfaces`.
3. Create `src/hooks/useShareWeather.ts`: call `useHaptics()`; expose `share(args)` that builds the message, calls `Share.share(...)`, fires `success()` on `sharedAction`, and on catch reports the error and shows the error toast. Import `Share` from `react-native`.
4. Re-export `useShareWeather` from `src/hooks/index.ts`.
5. Extend `DetailsHeader.tsx`: restructure the header into three sections. Wrap the back button in a left slot (`flex: 1`, `alignItems: 'flex-start'`); keep the title container in the middle at natural width; wrap the actions in a right slot (`flex: 1`, `flexDirection: 'row'`, `alignItems: 'flex-end'`, `justifyContent: 'flex-end'`) rendering the share `Pressable` (when `onShare`) then the existing save `Pressable`. Drop the old `48`-wide spacer and the header's `justifyContent: 'space-between'` (the equal-flex slots handle spacing). Mirror the existing button styles, `android_ripple`, and icon sizing.
6. Wire `details.tsx`: get `share` from `useShareWeather()`; add `handleShare` that early-returns unless `weather` and `targetLocation` exist, then calls `share({ city: targetLocation.city, weather, tempUnit })`; pass `onShare={handleShare}` to `DetailsHeader`.
7. Add tests: `src/tests/utils/shareWeather.test.ts` (assert the composed string for a sample `weather`); `src/tests/hooks/useShareWeather.test.ts` (mock `react-native` `Share.share` to resolve `sharedAction`/`dismissedAction` and to reject; assert haptic/toast behavior via `renderHook`); update `DetailsHeader.test.tsx` and `details.test.tsx` per the table (add `useShareWeather` to the `@/hooks` mock in `details.test.tsx`).
8. Verify: `npx tsc --noEmit`, `pnpm run lint`, `pnpm test`. Confirm the share sheet opens on a physical Android device manually (the user runs native builds).

## Style & Conventions

- Follows `CLAUDE.md` and the react-native skill: one util/hook per file re-exported from the `index.ts` barrels, `@/` imports, TypeScript strict, functional components, `StyleSheet.create` with `theme` tokens, `SymbolView` cross-platform icon names.
- Side-effect encapsulation in a hook mirrors `useHaptics`; the testable string logic is isolated in a pure util, matching the utils in `src/utils/`.
- All user-facing copy goes through `t(...)` in both `en` and `ja`, per the i18n convention. No em-dashes in the composed strings.
- React Compiler is enabled, so handlers are not hand-wrapped in `useCallback` unless profiling shows a need.

## Acceptance Criteria

- [ ] A share button (`testID="details-share-button"`, localized `shareLabel`) renders in the details header beside the save action and opens the Android share sheet on press.
- [ ] The header title stays centered with both a share and a save icon on the right (verified on a physical/emulated Android device); the left/right slots use `flex: 1` and the existing `DetailsHeader` render/back/save tests still pass.
- [ ] The shared text contains the city, localized condition, rounded current temperature with unit, and today's rounded high and low.
- [ ] `buildWeatherShareMessage` is pure and covered by a unit test asserting the composed string for `en`.
- [ ] Completing a share fires a success haptic; cancelling (dismissed) fires no haptic and shows no toast; a thrown `Share` error is reported and surfaces the localized error toast without crashing.
- [ ] `shareLabel`, `shareDialogTitle`, `shareMessage`, `shareFailedTitle`, and `shareFailedBody` exist under both `en` and `ja`.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass, including the new util/hook tests and updated header/details tests.

## Constraints

- **Text only.** Image/view capture (`react-native-view-shot`) and `expo-sharing` file sharing are explicit non-goals for this scope; they are a documented future extension.
- **Android-only focus,** per the roadmap. The React Native `Share` API is cross-platform, so no platform special-casing is added, but only Android is targeted for verification.
- **Non-goals:** no share entry point outside the details screen, no share of forecast/hourly data, no deep link or URL in the payload (a `expoweather://` deep link would pair well once that feature lands, but is out of scope here), and no analytics on shares.
- Sharing must never block or break the screen: cancellation is silent and errors are swallowed after a toast.
- The right-side header actions row grows to two icons. The header is restructured to `flex: 1` side slots with a centered title so it stays screen-centered; this is in scope and must be preserved. Very long city names that exceed the middle slot's width can still truncate/wrap (pre-existing behavior, not addressed here).
- Cannot be fully verified in vitest/jsdom beyond mocked `Share` calls; the real share sheet is a manual on-device check.
