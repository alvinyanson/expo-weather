# Feature: Haptic Feedback on Key Actions

## Intent

Key user actions (saving or removing a location, toggling a setting, and completing a pull-to-refresh) trigger consistent, subtle haptic feedback through a single reusable `useHaptics` hook, with a settings toggle to disable it.

## Context

- **Problem statement:** The app fires no haptic feedback anywhere. `expo-haptics` is not a dependency (see `package.json`), and no hook or utility wraps vibration. Actions like saving a location (`useSavedLocations.toggleSavedLocation`, `src/hooks/useSavedLocations.ts:85`) only show a toast, and settings toggles (`src/app/settings.tsx`) and pull-to-refresh (`src/app/details.tsx:80` `onRefresh`) give no tactile response.
- **Current code:**
  - `src/hooks/useSavedLocations.ts` owns save/remove: `toggleSavedLocation` (`:85`) and `confirmDeleteLocation` (`:118`) each `await` a mutation then `Toast.show` on success or in `catch`.
  - `src/app/settings.tsx` renders unit/language buttons calling `setTemperatureUnit`/`setWindSpeedUnit`/`setLanguage` (`:79`, `:98`, `:162`) and a `Switch` (`:204`) calling `handleToggleNotifications`.
  - `src/app/details.tsx` defines `onRefresh` (`:80`) that sets `refreshing`, awaits `refetch()`, and clears it; it is passed to `DailyForecastList` which wires a `RefreshControl` (`src/components/DailyForecastList.tsx:81`).
  - Client settings live in `src/store/useSettingsStore.ts` (Zustand + `persist` over AsyncStorage). Copy lives in `src/services/i18n.ts` under `en` and `ja`, accessed via `t(...)`.
  - Hooks follow one-file-per-hook, re-exported from `src/hooks/index.ts`. Tests mirror `src/` under `src/tests/` (no `hooks/` subfolder exists yet).
- **User impact:** Actions feel more native and responsive. Users can disable haptics from Settings. No behavior changes if the device lacks a vibrator or haptics fails (fire-and-forget, errors swallowed).
- **Dependencies:** New package `expo-haptics` (Expo SDK 56). On Android the `VIBRATE` permission is added automatically by the library; no config plugin is required (confirmed against the v56 docs). No changes to `app.json` plugins are needed.

## Data Model

- **`useSettingsStore` (`src/store/useSettingsStore.ts`)** gains one persisted boolean:
  - `hapticsEnabled: boolean` — default `true`.
  - `setHapticsEnabled: (enabled: boolean) => void`.
  - Added to the `SettingsStore` interface and the `create(persist(...))` initializer. The `persist` `name` (`'settings-storage'`) is unchanged; a missing key hydrates as `undefined`, so all reads must treat non-`false` as enabled (default-on).
- No database or network changes. `expo-haptics` enums (`ImpactFeedbackStyle`, `NotificationFeedbackType`) are consumed directly from the package; no new interfaces in `src/interfaces/`.

## Interfaces / API

New hook `useHaptics` in `src/hooks/useHaptics.ts`:

```ts
export const useHaptics: () => {
  // Selection tick — unit/language/toggle changes.
  selection: () => void;
  // Positive outcome — location saved/removed successfully.
  success: () => void;
  // Failure outcome — save/remove failed.
  error: () => void;
  // Light physical tap — pull-to-refresh completion.
  impact: (style?: Haptics.ImpactFeedbackStyle) => void;
};
```

- Behavior/contract:
  - The hook reads `hapticsEnabled` from `useSettingsStore` (selector). Every returned function is a no-op when `hapticsEnabled === false`.
  - Each function is **fire-and-forget**: it calls the async `expo-haptics` API without `await` and swallows rejections (`.catch(() => {})`) so a device without a vibrator or a failed call never throws or surfaces UI. Returns `void`, not a Promise.
  - Mapping to `expo-haptics`:
    - `selection()` → `Haptics.selectionAsync()`
    - `success()` → `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
    - `error()` → `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`
    - `impact(style)` → `Haptics.impactAsync(style ?? Haptics.ImpactFeedbackStyle.Light)`
  - Default `impact` style is `Light`; callers may pass `Medium`.
- Consumers:
  - `useSavedLocations`: `success()` after a successful save/remove in `toggleSavedLocation` and `confirmDeleteLocation`; `error()` in their `catch` blocks (alongside the existing toasts).
  - `settings.tsx`: `selection()` on each unit/language button press and on the notifications `Switch` toggle.
  - `details.tsx`: `impact()` (Light) after `refetch()` resolves in `onRefresh`.

## Files Created

| File                                 | Purpose                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `src/hooks/useHaptics.ts`            | Reusable hook wrapping `expo-haptics`, gated by `hapticsEnabled`, fire-and-forget helpers. |
| `src/tests/hooks/useHaptics.test.ts` | Unit tests for the hook: correct `expo-haptics` calls, and no calls when disabled.         |

## Files Modified

| File                                       | Change                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `package.json` / `pnpm-lock.yaml`          | Add `expo-haptics` (via `npx expo install expo-haptics`, which pins the SDK 56 version).                           |
| `src/hooks/index.ts`                       | Re-export `useHaptics` from the barrel.                                                                            |
| `src/hooks/useSavedLocations.ts`           | Call `useHaptics()` at top; fire `success()` on successful save/remove and `error()` in the `catch` of both flows. |
| `src/app/settings.tsx`                     | Call `useHaptics()`; fire `selection()` on unit/language button presses and on the notifications switch toggle.    |
| `src/app/details.tsx`                      | Call `useHaptics()`; fire `impact()` after `refetch()` resolves in `onRefresh`.                                    |
| `src/store/useSettingsStore.ts`            | Add `hapticsEnabled` (default `true`) and `setHapticsEnabled` to the interface and initializer.                    |
| `src/services/i18n.ts`                     | Add `hapticsLabel` and `hapticsDesc` strings under both `en` and `ja`.                                             |
| `src/tests/store/useSettingsStore.test.ts` | Reset and assert the new `hapticsEnabled` default and setter.                                                      |
| `src/tests/app/settings.test.tsx`          | Assert the new Haptics settings row renders and its toggle updates the store (mock `expo-haptics`).                |

## Implementation Steps

1. Install the dependency: `npx expo install expo-haptics` (do not hand-edit versions; let Expo pin the SDK 56 build).
2. Extend `useSettingsStore`: add `hapticsEnabled: boolean` (default `true`) and `setHapticsEnabled` to the `SettingsStore` interface and the `persist` initializer. Keep the store `name` unchanged.
3. Create `src/hooks/useHaptics.ts` implementing the interface above: read `hapticsEnabled` via a `useSettingsStore` selector, guard each helper on it, call the mapped `expo-haptics` async API fire-and-forget with a `.catch(() => {})`. Do not `await`.
4. Re-export `useHaptics` from `src/hooks/index.ts`.
5. Wire `useSavedLocations.ts`: call `useHaptics()` at the top of the hook; fire `success()` after the successful save and delete branches and `error()` in the `catch` of both `toggleSavedLocation` and `confirmDeleteLocation`, leaving existing toasts intact.
6. Wire `settings.tsx`: add `hapticsLabel`/`hapticsDesc` strings to `i18n.ts` (en + ja), add a Settings row with a `Switch` bound to `hapticsEnabled`/`setHapticsEnabled` (mirroring the alerts row markup/`testID` convention), and fire `selection()` on the existing unit/language button presses and on both the new haptics switch and the notifications switch.
7. Wire `details.tsx`: call `useHaptics()`; after `await refetch()` in `onRefresh`, call `impact()` (default Light) before clearing `refreshing`.
8. Add tests: create `src/tests/hooks/useHaptics.test.ts` (mock `expo-haptics`; use `renderHook` from `@testing-library/react`; assert each helper calls the right API when enabled and is a no-op when `hapticsEnabled` is `false`). Update `src/tests/store/useSettingsStore.test.ts` for the new field, and `src/tests/app/settings.test.tsx` for the new row (add a top-level `vi.mock('expo-haptics', ...)`).
9. Verify: `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test`. Confirm haptics fire on a physical Android device manually (the emulator/simulator does not reliably vibrate); the user runs native builds per project convention.

## Style & Conventions

- Follows the react-native skill and `CLAUDE.md`: one hook per file re-exported from the `index.ts` barrel, `@/` imports, TypeScript strict, functional style, no manual native linking (the library adds `VIBRATE` automatically; no config plugin).
- Side-effect encapsulation lives in the hook, matching the existing `useToggleNotifications` / `useSyncPushToken` pattern of a hook owning a cross-cutting effect.
- React Compiler is enabled, so the returned helper functions are not hand-wrapped in `useCallback` unless profiling shows a need.
- All user-facing copy goes through `t(...)` in `src/services/i18n.ts` for both `en` and `ja`, per the i18n convention.
- Persisted client state uses the existing `useSettingsStore` `persist` middleware; no new storage adapter.

## Acceptance Criteria

- [ ] `expo-haptics` appears in `package.json` at the SDK 56 version and the app type-checks (`npx tsc --noEmit` passes).
- [ ] `useHaptics` exposes `selection`, `success`, `error`, and `impact`, each a `void` fire-and-forget call, and is exported from `src/hooks/index.ts`.
- [ ] Saving and removing a location fire a success haptic; a failed save/remove fires an error haptic; existing toasts still show.
- [ ] Changing temperature unit, wind unit, or language, and toggling the notifications or haptics switch, each fire a selection haptic.
- [ ] Completing a pull-to-refresh on the details screen fires a light impact haptic.
- [ ] When `hapticsEnabled` is `false`, none of the helpers call `expo-haptics` (verified by test).
- [ ] Settings shows a Haptics row (localized in `en` and `ja`) whose toggle persists `hapticsEnabled`.
- [ ] `pnpm run lint` and `pnpm test` pass, including new tests for `useHaptics`, the store field, and the settings row.

## Constraints

- **Android-only focus.** iOS/web are not targeted; `expo-haptics` is a no-op or best-effort there, and the swallowed-error design keeps those platforms safe without special-casing.
- **Non-goals:** No haptics on every button press or navigation, no long-press/coordinate-copy haptics, no custom vibration patterns or `performAndroidHapticsAsync`, no per-action intensity settings beyond the single `hapticsEnabled` toggle.
- **No `app.json` plugin change** unless a future Expo version stops auto-adding `VIBRATE`; verify the permission is present after `expo prebuild` during implementation.
- Haptic failures must never surface to the user or block the underlying action (save, refresh, setting change proceed regardless).
- Cannot be verified in the vitest/jsdom environment beyond mocked calls; real vibration is a manual on-device check.
