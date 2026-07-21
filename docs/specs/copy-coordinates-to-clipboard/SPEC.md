# Feature: Copy Coordinates to Clipboard

## Intent

Long-pressing the city name in the details header copies that location's latitude and longitude to the clipboard and shows a confirmation toast, giving users a quick way to grab the exact coordinates.

## Context

- **Problem statement:** There is no way to get a location's raw coordinates out of the app. The details header (`src/components/DetailsHeader.tsx`) renders the city name as a plain `Text` (`:48`) with no interaction, and nothing in `src/` references `expo-clipboard` (it is not in `package.json`).
- **Current code:**
  - `src/app/details.tsx` resolves `targetLocation` as `{ latitude, longitude, city }` (either from route params or `gpsLocation`, `:42`), guards that it is non-null before rendering (`:127`), and already holds a `useHaptics()` instance (`haptics`, `:62`). It renders `<DetailsHeader city={targetLocation.city} ... onShare={handleShare} onSave={handleSaveLocation} isSaved={isSaved} />` (`:135`).
  - `src/components/DetailsHeader.tsx` displays the city in `styles.headerCity` `Text` inside the centered `headerTitleContainer` (`:47`). It uses `theme.colors`, `SymbolView` icons, `android_ripple`, and `t(...)` labels. React Native `Text` supports `onLongPress` and `accessibilityHint` directly, so no extra wrapper is required.
  - Haptics: `useHaptics()` (`src/hooks/useHaptics.ts`) exposes `selection`/`success`/`error`/`impact`, each gated by the `hapticsEnabled` setting and fire-and-forget (`.catch(() => {})`).
  - Toasts: `Toast.show({ type, text1, text2 })` from `react-native-toast-message`; rendered via `toastConfig` in `src/components/CustomToast.tsx` (`success` | `error` | `info`). Errors are reported with `reportError(e, { where })` (see `src/hooks/useSavedLocations.ts:118`).
  - Formatters live in `src/utils/formatters.ts` (`formatRound`, `formatTime`, etc.), pure and unit-tested under `src/tests/utils/`.
  - Precedent: the sibling `src/hooks/useShareWeather.ts` (see `docs/specs/share-weather-snapshot/SPEC.md`) is the established pattern for a details-screen device action, wrapping a native API with a success haptic and an error toast, re-exported from the `src/hooks/index.ts` barrel.
  - Conventions: one util/hook per concern re-exported from `index.ts` barrels; all user copy through `t(...)` in `src/services/i18n.ts` (`en` + `ja`); tests mirror `src/` under `src/tests/`.
- **User impact:** Users can long-press the city name to copy `lat, lon` to the clipboard (to paste into maps, messages, etc.) and get a toast confirming it. No existing behavior changes; a normal tap on the title still does nothing.
- **Dependencies:** Adds `expo-clipboard` (install with `npx expo install expo-clipboard` to pin the SDK 56-compatible version). No native config plugin is required; it is included in Expo Go and autolinked.

## Data Model

N/A - no persisted state, database, or network changes. The feature reads the already-resolved `targetLocation` coordinates and writes a plain string to the OS clipboard.

## Interfaces / API

### `formatCoordinates` (pure) - `src/utils/formatters.ts`

```ts
export const formatCoordinates: (lat: number, lon: number) => string;
```

- Returns `"<lat>, <lon>"` with each value rounded to 4 decimal places (approx. 11 m precision), e.g. `formatCoordinates(14.5995, 120.9842)` -> `"14.5995, 120.9842"`. Trailing-zero trimming is not required; a fixed 4-decimal format is acceptable and simplest to test.
- Pure and synchronous, no side effects. Added alongside the existing formatters rather than in a new file.

### `useCopyCoordinates` (hook) - `src/hooks/useCopyCoordinates.ts`

```ts
export const useCopyCoordinates: () => {
  copy: (lat: number, lon: number) => Promise<void>;
};
```

- Builds the string with `formatCoordinates(lat, lon)`, then `await Clipboard.setStringAsync(text)` from `expo-clipboard`.
- On success: fires `haptics.success()` and `Toast.show({ type: 'success', text1: t('coordinatesCopiedTitle'), text2: text })` (the toast body shows the copied coordinates).
- On a thrown error: `haptics.error()`, `reportError(e, { where: 'useCopyCoordinates.copy' })`, and `Toast.show({ type: 'error', text1: t('copyFailedTitle'), text2: t('copyFailedBody') })`. Never rethrows; copying must never break the screen.

### `DetailsHeader` prop addition - `src/components/DetailsHeader.tsx`

- New optional prop `onCopyCoordinates?: () => void`. When provided, the city `Text` gains `onLongPress={onCopyCoordinates}` plus `accessibilityHint={t('copyCoordinatesHint')}` (and `accessibilityRole="text"` if not already implied). When absent, the title is unchanged (no long-press handler, no hint). The `testID="details-city"` is added to the city `Text` so the behavior is testable.
- No layout or styling change; the visible title looks identical.

## Files Created

| File                                         | Purpose                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/hooks/useCopyCoordinates.ts`            | Hook wrapping `expo-clipboard` with success haptic + toast and error handling.   |
| `src/tests/hooks/useCopyCoordinates.test.ts` | Tests the hook: success and thrown-error paths (mock Clipboard, haptics, toast). |
| `src/tests/utils/formatCoordinates.test.ts`  | Unit tests for the `formatCoordinates` formatter.                                |

## Files Modified

| File                                          | Change                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/utils/formatters.ts`                     | Add the pure `formatCoordinates(lat, lon)` helper.                                                            |
| `src/hooks/useCopyCoordinates.ts` (barrel)    | Re-export `useCopyCoordinates` from `src/hooks/index.ts`.                                                     |
| `src/components/DetailsHeader.tsx`            | Add optional `onCopyCoordinates`; wire `onLongPress` + `accessibilityHint` + `testID` on the city `Text`.     |
| `src/app/details.tsx`                         | Call `useCopyCoordinates()`; add `handleCopyCoordinates` from `targetLocation`; pass `onCopyCoordinates`.     |
| `src/services/i18n.ts`                        | Add `copyCoordinatesHint`, `coordinatesCopiedTitle`, `copyFailedTitle`, `copyFailedBody` under `en` and `ja`. |
| `package.json`                                | Add `expo-clipboard` (via `npx expo install`).                                                                |
| `src/tests/components/DetailsHeader.test.tsx` | Add cases: long-press fires `onCopyCoordinates` when provided; no handler when omitted.                       |
| `src/tests/app/details.test.tsx`              | Add `useCopyCoordinates` to the `@/hooks` mock; assert long-press triggers `copy` with the coords.            |

## Implementation Steps

1. Install the dependency: `npx expo install expo-clipboard` (pins the SDK 56 version and updates `package.json`).
2. Add localized copy to `src/services/i18n.ts` (`en` + `ja`) under a `// Copy coordinates` comment: `copyCoordinatesHint` (a11y hint, e.g. "Long press to copy coordinates"), `coordinatesCopiedTitle` (e.g. "Coordinates copied"), `copyFailedTitle`, `copyFailedBody`.
3. Add `formatCoordinates(lat, lon)` to `src/utils/formatters.ts` (round each to 4 decimals, join with `", "`).
4. Create `src/hooks/useCopyCoordinates.ts`: call `useHaptics()`; expose `copy(lat, lon)` that builds the string with `formatCoordinates`, `await Clipboard.setStringAsync(text)`, then on success fires `success()` and the success toast (body = the coordinate string), and on catch fires `error()`, `reportError(...)`, and the error toast. Import `* as Clipboard from 'expo-clipboard'`.
5. Re-export `useCopyCoordinates` from `src/hooks/index.ts`.
6. Extend `DetailsHeader.tsx`: add optional `onCopyCoordinates` prop; on the city `Text` add `testID="details-city"`, and when the prop is provided, `onLongPress={onCopyCoordinates}` and `accessibilityHint={t('copyCoordinatesHint')}`.
7. Wire `details.tsx`: get `copy` from `useCopyCoordinates()`; add `handleCopyCoordinates` that calls `copy(targetLocation.latitude, targetLocation.longitude)` (guarded by the existing non-null `targetLocation` at the render site); pass `onCopyCoordinates={handleCopyCoordinates}` to `DetailsHeader`.
8. Add tests: `src/tests/utils/formatCoordinates.test.ts` (assert formatting/rounding); `src/tests/hooks/useCopyCoordinates.test.ts` (mock `expo-clipboard` `setStringAsync` to resolve and to reject; assert haptic + toast on each path via `renderHook`); update `DetailsHeader.test.tsx` (fire `longPress` on `details-city`) and `details.test.tsx` (add `useCopyCoordinates` to the `@/hooks` mock, assert `copy` is called with the target coordinates).
9. Verify: `npx tsc --noEmit`, `pnpm run lint`, `pnpm test`. Confirm on a physical/emulated Android device that a long-press copies and pastes correctly (the user runs native builds).

## Style & Conventions

- Follows `CLAUDE.md` and the react-native skill: one hook per file re-exported from the `index.ts` barrel, `@/` imports, TypeScript strict, functional components, formatters in `src/utils/formatters.ts`.
- Mirrors `useShareWeather` for the device-action shape: side effects encapsulated in a hook, success haptic, error toast + `reportError`, never rethrowing.
- All user-facing copy goes through `t(...)` in both `en` and `ja`. No em-dashes in any added strings or comments; keep comments brief.
- React Compiler is enabled, so handlers are not hand-wrapped in `useCallback` unless profiling shows a need.

## Acceptance Criteria

- [ ] Long-pressing the city name in the details header copies `"<lat>, <lon>"` (each rounded to 4 decimals) to the clipboard.
- [ ] A successful copy fires a success haptic and shows a success toast whose body is the copied coordinate string.
- [ ] A thrown clipboard error fires an error haptic, reports the error, and shows the localized error toast without crashing; a normal tap on the title does nothing.
- [ ] `formatCoordinates` is pure and covered by a unit test.
- [ ] The city `Text` exposes `testID="details-city"` and, when `onCopyCoordinates` is provided, an `accessibilityHint`; the existing `DetailsHeader` render/back/share/save tests still pass.
- [ ] `copyCoordinatesHint`, `coordinatesCopiedTitle`, `copyFailedTitle`, and `copyFailedBody` exist under both `en` and `ja`.
- [ ] `expo-clipboard` is added to `package.json` at an SDK 56-compatible version.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass, including the new util/hook tests and updated header/details tests.

## Constraints

- **Trigger is long-press on the city name only.** No separate copy button, no copy affordance on the home screen or saved-location list, and no copy of anything other than the coordinate pair (in scope: `lat, lon`; out of scope: city name, weather values, a shareable URL).
- **Android-only focus,** per the roadmap. `expo-clipboard`'s `setStringAsync` is cross-platform, so no platform special-casing is added, but only Android is verified.
- Copying must never block or break the screen: errors are swallowed after a toast.
- **Non-goals:** reading from the clipboard, the `ClipboardPasteButton` component, clipboard listeners, coordinate format options (DMS, configurable precision), and analytics on copies.
- Cannot be fully verified in vitest/jsdom beyond mocked `Clipboard` calls; the real clipboard write/paste is a manual on-device check.

```

```
