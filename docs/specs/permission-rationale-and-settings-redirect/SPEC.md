# Feature: Permission Rationale and Settings Redirect

## Intent

Provide a simple, user-friendly location permission flow that presents a clear rationale UI before requesting location access when permission can still be prompted (`canAskAgain: true`), and deep links the user to device settings via `Linking.openSettings()` when location permission is permanently denied (`canAskAgain: false`).

## Context

- **Problem statement:** In `src/services/weather.service.ts:7-11`, `fetchCoordinates` directly calls `Location.requestForegroundPermissionsAsync()` without inspecting existing permission status or `canAskAgain`. If permission is denied, it throws a generic string error `Error(t('errLocationDenied'))`. In `src/app/index.tsx:82-100`, `HomeScreen` renders a basic error card with a retry button. When an Android user selects "Don't ask again" (permanently denied / blocked), clicking "Retry" repeatedly invokes `requestForegroundPermissionsAsync()`, which immediately fails without showing any system dialog or guidance on how to re-enable location access in Android Settings.
- **Current code:**
  - `src/services/weather.service.ts`: `fetchCoordinates()` requests foreground permission directly.
  - `src/hooks/useFetchLocation.ts`: `useFetchLocation()` executes `fetchLocation()` (which calls `fetchCoordinates()`) and exposes the `locationError`.
  - `src/app/index.tsx`: `HomeScreen` renders a generic error fallback when `locationError` or `weatherError` occurs.
  - `src/services/i18n.ts`: Contains basic `errLocationDenied` string, but lacks dedicated strings for permission rationale, settings redirect, and action buttons.
- **User impact:** Users will clearly understand _why_ location permission is required for local weather forecasts. If permission is blocked, users are given a direct one-tap shortcut ("Open Settings") to open Android App Settings and grant access rather than hitting a dead end.
- **Dependencies:** Built-in Expo library `expo-location` and React Native core API `Linking`. No additional packages required.

## Data Model

- **`LocationPermissionError` (`src/services/weather.service.ts`)**:
  Custom error class inheriting from `Error` to pass permission state from the service layer to the UI layer:

  ```ts
  export class LocationPermissionError extends Error {
    canAskAgain: boolean;
    status: Location.PermissionStatus;

    constructor(message: string, canAskAgain: boolean, status: Location.PermissionStatus) {
      super(message);
      this.name = 'LocationPermissionError';
      this.canAskAgain = canAskAgain;
      this.status = status;
    }
  }
  ```

- No database, storage, or backend changes required.

## Interfaces / API

- **Service function `fetchCoordinates` (`src/services/weather.service.ts`)**:
  - Checks permission status using `Location.getForegroundPermissionsAsync()`.
  - If status is not `'granted'`, calls `Location.requestForegroundPermissionsAsync()`.
  - If requested status is still not `'granted'`, throws `LocationPermissionError(t('locationPermissionDenied'), response.canAskAgain, response.status)`.
- **Component `LocationPermissionCard` (`src/components/LocationPermissionCard.tsx`)**:
  ```ts
  interface LocationPermissionCardProps {
    canAskAgain: boolean;
    onRetry: () => void;
  }
  ```
  - Renders a stylized card explaining the permission state.
  - If `canAskAgain === true`: displays rationale text explaining why location is needed with a "Grant Permission" button calling `onRetry()`.
  - If `canAskAgain === false`: displays blocked status text with an "Open Settings" button calling `Linking.openSettings()`.

## Files Created

| File                                                   | Purpose                                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `src/components/LocationPermissionCard.tsx`            | Presentational component rendering permission rationale or settings redirect depending on `canAskAgain`.               |
| `src/tests/components/LocationPermissionCard.test.tsx` | Unit tests for `LocationPermissionCard` verifying rationale rendering, settings redirect button, and action callbacks. |

## Files Modified

| File                                         | Change                                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/weather.service.ts`            | Export `LocationPermissionError` and update `fetchCoordinates` to inspect `getForegroundPermissionsAsync()` and throw typed permission errors.     |
| `src/services/i18n.ts`                       | Add localized strings for English (`en`) and Japanese (`ja`) for rationale title, rationale body, blocked body, settings button, and grant button. |
| `src/app/index.tsx`                          | Update home screen error rendering to display `LocationPermissionCard` when `locationError` is an instance of `LocationPermissionError`.           |
| `src/tests/services/weather.service.test.ts` | Update and expand `fetchCoordinates` tests to verify `LocationPermissionError` threw with `canAskAgain: true` and `canAskAgain: false`.            |
| `src/tests/app/index.test.tsx`               | Add test coverage verifying that `HomeScreen` renders `LocationPermissionCard` and calls `Linking.openSettings` on blocked state.                  |

## Implementation Steps

1. **Add localized strings to `src/services/i18n.ts`**:
   Add the following translation keys to both `en` and `ja`:
   - `locationPermissionTitle`: Title for location permission request.
   - `locationPermissionRationale`: Rationale text explaining why location is needed for weather forecasts.
   - `locationPermissionBlocked`: Explanation text when permission is permanently blocked in Android Settings.
   - `grantPermissionBtn`: Button label to request location permission ("Grant Access").
   - `openSettingsBtn`: Button label to open Android settings ("Open Settings").

2. **Update `src/services/weather.service.ts`**:
   - Define and export `LocationPermissionError`.
   - Update `fetchCoordinates()`:
     - First, call `await Location.getForegroundPermissionsAsync()`.
     - If `status !== 'granted'`, call `await Location.requestForegroundPermissionsAsync()`.
     - If permission is still not granted, throw `new LocationPermissionError(t('errLocationDenied'), response.canAskAgain, response.status)`.

3. **Create `src/components/LocationPermissionCard.tsx`**:
   - Import `SymbolView` from `expo-symbols`, `Linking` from `react-native`, `t` from `@/services/i18n`, and design tokens from `@/theme`.
   - Implement `LocationPermissionCard`:
     - Render warning icon (`warning` / `exclamationmark.triangle.fill`).
     - Render `t('locationPermissionTitle')`.
     - If `canAskAgain` is `true`, render `t('locationPermissionRationale')` and a primary button labeled `t('grantPermissionBtn')` that invokes `onRetry`.
     - If `canAskAgain` is `false`, render `t('locationPermissionBlocked')` and a primary button labeled `t('openSettingsBtn')` that invokes `Linking.openSettings()`.

4. **Integrate into `src/app/index.tsx`**:
   - Import `LocationPermissionCard` and `LocationPermissionError`.
   - In `HomeScreen`, when `locationError` is present and `locationError instanceof LocationPermissionError`:
     - Render `<LocationPermissionCard canAskAgain={locationError.canAskAgain} onRetry={refetchLocation} />`.
     - Fall back to standard generic error view for other non-permission errors (e.g. network/API errors).

5. **Write Unit Tests**:
   - `src/tests/components/LocationPermissionCard.test.tsx`:
     - Test that when `canAskAgain` is `true`, rationale text and "Grant Access" button render, and pressing button triggers `onRetry`.
     - Test that when `canAskAgain` is `false`, blocked text and "Open Settings" button render, and pressing button calls `Linking.openSettings`.
   - `src/tests/services/weather.service.test.ts`:
     - Test `fetchCoordinates()` throwing `LocationPermissionError` with `canAskAgain: true` when denied once.
     - Test `fetchCoordinates()` throwing `LocationPermissionError` with `canAskAgain: false` when permanently blocked.
   - `src/tests/app/index.test.tsx`:
     - Update index screen test to mock location error as `LocationPermissionError` and verify `LocationPermissionCard` rendering.

6. **Validation**:
   - Run `npx tsc --noEmit` to verify type safety.
   - Run `pnpm run lint` to verify code style and oxlint rules.
   - Run `pnpm test` to verify unit test suite.

## Style & Conventions

- Follows Expo SDK 56 and project conventions defined in `@AGENTS.md` and `CLAUDE.md`.
- Styled using `StyleSheet.create` with design tokens from `src/theme/index.ts`.
- Uses `t(...)` in `src/services/i18n.ts` for all user-facing strings (English and Japanese).
- Uses React Native core `Linking.openSettings()` for navigating to app settings on native Android devices.
- Kept lightweight and simple: avoids adding heavy permission management libraries, custom state machines, or complex abstractions.

## Acceptance Criteria

- [ ] `fetchCoordinates` checks permission status and throws `LocationPermissionError` preserving `canAskAgain`.
- [ ] When permission is denied but can be asked again (`canAskAgain: true`), `HomeScreen` displays a rationale view with a button to request access.
- [ ] When permission is permanently blocked (`canAskAgain: false`), `HomeScreen` displays a blocked view with an "Open Settings" button.
- [ ] Tapping "Open Settings" triggers `Linking.openSettings()`.
- [ ] All new text is translated into English (`en`) and Japanese (`ja`).
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `pnpm run lint` passes with 0 errors.
- [ ] `pnpm test` passes with all tests green.

## Constraints

- **Scope boundary:** Applies specifically to foreground location permission for current weather fetching on Android.
- **Non-goals:** Does not cover background location permissions, push notification permissions, or custom settings modal dialogs.
- **Simplicity:** Keep implementation straightforward without introducing complex third-party permission hooks or global permission stores.
