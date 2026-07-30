# Feature: Expand Maestro E2E Coverage

## Intent

All existing Maestro flows accurately reflect the current codebase's `testID` surface, and a new `map_flow.yaml` verifies that the map screen renders the current-location marker and that a long-press resolves a city popup.

---

## Context

- **Problem statement:** The five existing flows (`login_flow.yaml`, `home_flow.yaml`, `details_flow.yaml`, `saved_flow.yaml`, `settings_flow.yaml`) were authored for an earlier version of the app. Several gaps exist:
  - `login_flow.yaml` uses plain-text string assertions (`'Expo Weather'`, `'Sign in to continue'`, `'Continue with Google'`, `'Continue as Guest'`) because `login.tsx` has no `testID` props on its buttons or title elements. This is brittle against i18n locale changes.
  - `home_flow.yaml` does not assert the `map-button` (`testID="map-button"` in `SearchHeader.tsx:73`) which now exists in the header row.
  - `details_flow.yaml` does not assert the `details-share-button`, `details-city`, or the history button that now appear on the details screen.
  - `settings_flow.yaml` only covers the original four settings rows. Three new rows have been added since: `haptics-switch` (`settings.tsx:253`), `battery-saver-switch` (`settings.tsx:274`), and `background-refresh-switch` (`settings.tsx:295`).
  - There is no flow for the map screen (`src/app/map.tsx`), despite it being a routable, fully implemented screen accessible from `SearchHeader`.

- **Current code:**
  - `src/app/login.tsx` — `LoginScreen`. Buttons rendered via `<Pressable>` with no `testID`. Title text is `t('appName')`, subtitle is `t('loginSubtitle')`.
  - `src/app/index.tsx` — `HomeScreen`. Mounts `<SearchHeader />` which contains `testID="map-button"` for the map navigation button.
  - `src/app/details.tsx` — `DetailsScreen`. Mounts `<DetailsHeader>` which already carries `testID="details-city"` and `testID="details-share-button"`. The history `<Pressable>` (line ~184) has no `testID`.
  - `src/app/settings.tsx` — `SettingsScreen`. Three switch rows added beyond the original four: haptics (`testID="haptics-switch"`), battery saver (`testID="battery-saver-switch"`), background refresh (`testID="background-refresh-switch"`).
  - `src/app/map.tsx` — `MapScreen`. Has `testID="map-back-button"` and `testID="map-title"` in the header; `testID="map-zoom-in-button"` and `testID="map-zoom-out-button"` on the zoom controls; long-press fires `handleLongPress` which renders `<PickedLocationMarker>` containing `testID="picked-marker-callout"`, `testID="picked-marker-pin"`, and `testID="picked-marker-dismiss"`.
  - `src/components/WeatherMapMarker.tsx` — Current-location marker rendered with `testID={marker-${marker.id}}`, so the GPS marker has `testID="map-marker-current-location"`.
  - `.maestro/config.yaml` — globs `*_flow.yaml`; `excludeTags: [subflow]` keeps `login_flow.yaml` as a reusable sub-flow only.

- **User impact:** With accurate flows, CI catches regressions across every screen. The map flow adds coverage for the most recently added feature area.

- **Dependencies:**
  - `@maplibre/maplibre-react-native` — map rendering used in `map.tsx`. Long-press events are fired via the native `onLongPress` prop on `<Map>`.
  - Maestro CLI >= 1.38 (already installed per EAS workflow).
  - No new npm packages required.

---

## Data Model

N/A — This feature touches only test-infrastructure files and adds `testID` props to two components. No new types, interfaces, or persistence changes.

---

## Interfaces / API

### testID additions required in application code

| Element                      | File                  | Proposed testID          | Reason                                    |
| ---------------------------- | --------------------- | ------------------------ | ----------------------------------------- |
| App name `<Text>`            | `src/app/login.tsx`   | `login-title`            | Replace fragile text assertion; i18n-safe |
| Subtitle `<Text>`            | `src/app/login.tsx`   | `login-subtitle`         | Replace fragile text assertion; i18n-safe |
| Google sign-in `<Pressable>` | `src/app/login.tsx`   | `google-signin-button`   | Replace text assertion; i18n-safe         |
| Guest sign-in `<Pressable>`  | `src/app/login.tsx`   | `guest-signin-button`    | Replace text assertion; i18n-safe         |
| History `<Pressable>`        | `src/app/details.tsx` | `details-history-button` | Assert new history button in details flow |

### Maestro flow contracts

Each `.yaml` file follows the pattern: `appId` header → `runFlow: login_flow.yaml` to reach an authenticated state (except `login_flow.yaml` itself) → `extendedWaitUntil` to guard against load time → targeted assertions and interactions.

**`login_flow.yaml`** (updated contract)

- `launchApp` with `clearState: true`
- Wait for `testID="login-title"` (<=30 s)
- Assert `login-subtitle`, `google-signin-button`, `guest-signin-button`
- Tap `guest-signin-button`
- Assert `search-input` is visible (home screen reached)

**`home_flow.yaml`** (updated contract)

- Run `login_flow.yaml`
- Wait for `details-hint` (<=30 s)
- Assert `search-input`, `map-button`, `saved-locations-button`, `settings-button`
- Assert `current-date`, `current-weather`, `hourly-forecast`
- Assert `save-location-button`; tap it; assert `saved-location-button`

**`details_flow.yaml`** (updated contract)

- Run `login_flow.yaml`
- Wait for `details-hint`; tap `current-weather`
- Wait for `daily-forecast` (<=30 s)
- Assert `back-button`, `details-city`, `details-share-button`, `details-save-button`, `last-updated`
- Assert `weather-summary-card`, `detail-humidity`, `detail-wind`, `detail-uv-index`
- Assert `details-history-button`
- Assert `daily-forecast`
- Tap `back-button`; assert `search-input`

**`saved_flow.yaml`** (unchanged contract — matches codebase)

- All current assertions (`saved-title`, `saved-location-item`, `saved-location-city`, `saved-location-date`, swipe-to-delete modal with `cancel-delete-button` / `confirm-delete-button`, `saved-empty`, `saved-back-button`) are accurate. No changes needed.

**`settings_flow.yaml`** (updated contract)

- Run `login_flow.yaml`; tap `settings-button`
- Wait for `settings-title`
- Assert original rows: `temp-toggle-celsius`, `temp-toggle-fahrenheit`, `wind-toggle-kmh`, `wind-toggle-mph`, `language-toggle-system`, `language-toggle-en`, `language-toggle-ja`, `weather-alerts-switch`
- Scroll until `haptics-switch` is visible; assert it
- Scroll until `battery-saver-switch` is visible; assert it
- Scroll until `background-refresh-switch` is visible; assert it
- Temperature toggle interaction: assert `temp-desc-celsius`, tap `temp-toggle-fahrenheit`, assert `temp-desc-fahrenheit`
- Scroll to `account-value`, then `sign-out-button`
- Tap `settings-back-button`; assert `search-input`

**`map_flow.yaml`** (new)

- Run `login_flow.yaml`
- Wait for `details-hint`; tap `map-button`
- Wait for `map-title` (<=15 s)
- Assert `map-back-button`, `map-zoom-in-button`, `map-zoom-out-button`
- Assert `map-marker-current-location` (GPS marker is visible)
- Long-press the map at a central point to trigger the picked-location flow
- Wait for `picked-marker-callout` (<=15 s)
- Assert `picked-marker-pin`, `picked-marker-dismiss`
- Tap `picked-marker-dismiss`; assert `picked-marker-callout` is not visible
- Tap `map-back-button`; assert `search-input`

> **Map long-press note:** Maestro's `longPressOn` requires a stable tap target. The `<Map>` native view does not accept `testID`, so the long-press targets the map by screen position using `point` coordinates (e.g. `longPressOn: {point: "50%, 60%"}`). The exact percentage must be validated against the target emulator or device during implementation and may need adjustment to land inside the map area and away from markers.

---

## Files Created

| File                     | Purpose                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `.maestro/map_flow.yaml` | New E2E flow verifying map screen render, current-location marker visibility, long-press city popup, dismiss, and back navigation. |

## Files Modified

| File                          | Change                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/login.tsx`           | Add `testID` props to the title `<Text>`, subtitle `<Text>`, Google `<Pressable>`, and guest `<Pressable>`.                                            |
| `src/app/details.tsx`         | Add `testID="details-history-button"` to the history navigation `<Pressable>` (line ~184).                                                             |
| `.maestro/login_flow.yaml`    | Replace all text-based assertions and `tapOn` calls with `testID`-based equivalents.                                                                   |
| `.maestro/home_flow.yaml`     | Add `assertVisible: {id: 'map-button'}` to the search header assertions block.                                                                         |
| `.maestro/details_flow.yaml`  | Add assertions for `details-city`, `details-share-button`, and `details-history-button`.                                                               |
| `.maestro/settings_flow.yaml` | Add scroll-and-assert steps for `haptics-switch`, `battery-saver-switch`, and `background-refresh-switch` after the `weather-alerts-switch` assertion. |

---

## Implementation Steps

1. **Add `testID` props to `src/app/login.tsx`.**
   - `<Text>` rendering `t('appName')` gets `testID="login-title"`.
   - `<Text>` rendering `t('loginSubtitle')` gets `testID="login-subtitle"`.
   - Google `<Pressable>` gets `testID="google-signin-button"`.
   - Guest `<Pressable>` gets `testID="guest-signin-button"`.

2. **Add `testID` prop to `src/app/details.tsx`.**
   - History navigation `<Pressable>` (line ~184) gets `testID="details-history-button"`.

3. **Update `.maestro/login_flow.yaml`.**
   - Replace `extendedWaitUntil: visible: 'Expo Weather'` with `id: 'login-title'`.
   - Replace `assertVisible: 'Sign in to continue'` with `assertVisible: {id: 'login-subtitle'}`.
   - Replace `assertVisible: 'Continue with Google'` with `assertVisible: {id: 'google-signin-button'}`.
   - Replace `assertVisible: 'Continue as Guest'` with `assertVisible: {id: 'guest-signin-button'}`.
   - Replace `tapOn: 'Continue as Guest'` with `tapOn: {id: 'guest-signin-button'}`.

4. **Update `.maestro/home_flow.yaml`.**
   - After the existing `assertVisible: {id: 'search-input'}` step, add `assertVisible: {id: 'map-button'}`.

5. **Update `.maestro/details_flow.yaml`.**
   - After the `back-button` assertion, insert:
     - `assertVisible: {id: 'details-city'}`
     - `assertVisible: {id: 'details-share-button'}`
   - After the `daily-forecast` assertion, insert:
     - `assertVisible: {id: 'details-history-button'}`

6. **Update `.maestro/settings_flow.yaml`.**
   - After the `weather-alerts-switch` assertion block, insert:

   ```yaml
   - scrollUntilVisible:
       element:
         id: 'haptics-switch'
       direction: DOWN
   - assertVisible:
       id: 'haptics-switch'
   - scrollUntilVisible:
       element:
         id: 'battery-saver-switch'
       direction: DOWN
   - assertVisible:
       id: 'battery-saver-switch'
   - scrollUntilVisible:
       element:
         id: 'background-refresh-switch'
       direction: DOWN
   - assertVisible:
       id: 'background-refresh-switch'
   ```

7. **Create `.maestro/map_flow.yaml`.**
   - Write the full flow per the contract in the Interfaces section.
   - Empirically determine the correct `point` percentage for `longPressOn` on the target emulator; a safe starting point is `"50%, 60%"` (center-lower map area, avoiding the zoom controls on the right).
   - Use `extendedWaitUntil` with a 15 s timeout before asserting `picked-marker-callout`, because reverse geocoding requires a network round-trip.

8. **Run each flow individually to confirm it passes:**

   ```bash
   maestro test .maestro/login_flow.yaml
   maestro test .maestro/home_flow.yaml
   maestro test .maestro/details_flow.yaml
   maestro test .maestro/saved_flow.yaml
   maestro test .maestro/settings_flow.yaml
   maestro test .maestro/map_flow.yaml
   ```

9. **Run the full suite via the config:**

   ```bash
   maestro test .maestro/config.yaml
   ```

10. **Verify the app code changes pass lint and type-check:**

    ```bash
    npx tsc --noEmit
    pnpm run lint
    ```

---

## Style & Conventions

- **`testID` naming:** The repository uses `kebab-case` IDs (`search-input`, `save-location-button`, `details-save-button`). All new IDs follow the same pattern.
- **Flow structure:** Every top-level flow begins with `runFlow: login_flow.yaml` to reach an authenticated state, matching the established pattern in the existing flows.
- **`extendedWaitUntil`:** Used before every screen-load assertion to accommodate network-dependent renders. 30 s for weather screens, 15 s for map, settings, and saved screens.
- **Dynamic text not asserted by value.** City names, temperatures, and dates are either skipped or asserted by `testID` on the wrapper element, not by text value. This matches the existing convention in `saved_flow.yaml` ("city/date values are dynamic").
- **Onboarding pre-condition.** The onboarding screen is gated by `hasCompletedOnboarding` in `_layout.tsx`. The flows assume onboarding has already been completed in the test build. Resetting via `clearState: true` clears only app storage; the onboarding store is a Zustand persist layer over MMKV, and `clearState` on Android clears shared preferences / internal storage, which should clear the MMKV key. This assumption is carried forward from the existing flows and should be validated during a test run.

---

## Acceptance Criteria

- [ ] `login_flow.yaml` passes using only `testID`-based assertions; no plain-text string assertions remain.
- [ ] `home_flow.yaml` asserts `map-button` in addition to the existing header IDs.
- [ ] `details_flow.yaml` asserts `details-city`, `details-share-button`, and `details-history-button`.
- [ ] `settings_flow.yaml` asserts `haptics-switch`, `battery-saver-switch`, and `background-refresh-switch` after scrolling.
- [ ] `map_flow.yaml` passes end-to-end: map screen renders with `map-title`, `map-marker-current-location` is visible, a long-press shows `picked-marker-callout` and `picked-marker-pin`, tapping `picked-marker-dismiss` hides the callout, and `map-back-button` returns to `search-input`.
- [ ] Full suite passes: `maestro test .maestro/config.yaml` exits 0.
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `pnpm run lint` exits 0.

---

## Constraints

- **Android only.** Per `features.md`, all work targets Android. No iOS Maestro runner is configured or required.
- **Map long-press is positional.** The `<Map>` native view from `@maplibre/maplibre-react-native` does not support `testID`. The flow must target by screen position (`point` percentage). The exact coordinates must be empirically confirmed on the target emulator or device.
- **Out of scope (future work):**
  - Deep link E2E flow (`expoweather://weather?lat=…`) — requires `adb shell am start` integration or Maestro's `openLink` command; needs the URL scheme to be resolvable end-to-end.
  - Offline behavior flow — requires network toggling which is not natively supported within a Maestro flow without `adb` shell commands.
  - Scheduled notification flow — requires system clock manipulation outside Maestro's scope.
  - Onboarding E2E flow — the mechanism for ensuring `hasCompletedOnboarding` is reset to `false` in a repeatable way for CI is not yet defined.
- **`saved_flow.yaml` is accurate as-is.** The current `testID` surface in `SavedLocationItem.tsx` and `saved.tsx` already matches the flow; no changes are required.
- **Maestro version compatibility.** `scrollUntilVisible` and `longPressOn` with `point` coordinates require Maestro >= 1.38. Confirm the CLI version in the EAS test workflow (`eas.json`) before merging.
