# Feature: Rich Notification Actions

## Intent

Add interactive action buttons ("View Details" and "Save Location") to weather notifications on Android, allowing users to deep link directly into the details screen or save a location directly from notification interactions.

## Context

- **Problem statement:** The app currently logs notification titles to the console upon receipt and response (`src/hooks/useNotificationListeners.ts:14-15`), but does not register interactive notification categories or action buttons (`setNotificationCategoryAsync`). Tapping a notification or its actions does not route to screens or execute background actions like saving a location.
- **Current code:**
  - `src/hooks/useNotifications.ts`: Configures the default Android notification channel (`default`) and handles push token registration and permissions.
  - `src/hooks/useNotificationListeners.ts`: Subscribes to notification receipt (`addNotificationReceivedListener`) and response (`addNotificationResponseReceivedListener`), but only logs output to `console.log`.
  - `src/app/_layout.tsx`: Root layout mounts `useNotificationListeners()` at app launch inside `RootApp` (`:53`).
  - Navigation: `expo-router` provides routing via `router.push({ pathname: '/details', params: { lat, lon, city } })`.
  - Saved locations: `useSavedLocations` (`src/hooks/useSavedLocations.ts`) handles location persistence (`toggleSavedLocation`).
  - Translations: `src/services/i18n.ts` houses localized strings (`en` and `ja`).
- **User impact:** Users receiving weather alert notifications can interact directly via notification action buttons:
  - **View Details**: Opens/foregrounds the app and navigates directly to the weather details screen for the target coordinates and city.
  - **Save Location**: Adds the notification's location to saved locations and notifies the user with a confirmation toast.
- **Dependencies:** `expo-notifications` (Expo SDK 56) and `expo-router`. Android notification channels and category registration APIs.

## Data Model

- **Notification Category & Action Identifiers (`src/services/notificationCategory.service.ts`)**:
  - `WEATHER_ALERT_CATEGORY = 'WEATHER_ALERT'`
  - `ACTION_VIEW_DETAILS = 'VIEW_DETAILS'`
  - `ACTION_SAVE_LOCATION = 'SAVE_LOCATION'`
- **Rich Notification Payload (`RichNotificationData`)**:
  ```ts
  export interface RichNotificationData {
    latitude: number;
    longitude: number;
    city: string;
    country?: string;
    categoryIdentifier?: string;
  }
  ```
- No database or persistent store schema changes required.

## Interfaces / API

### `src/services/notificationCategory.service.ts`

```ts
export const WEATHER_ALERT_CATEGORY = 'WEATHER_ALERT';
export const ACTION_VIEW_DETAILS = 'VIEW_DETAILS';
export const ACTION_SAVE_LOCATION = 'SAVE_LOCATION';

export interface RichNotificationData {
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
  categoryIdentifier?: string;
}

export async function registerNotificationCategoriesAsync(): Promise<void>;
```

- **Category Configuration**:
  - `registerNotificationCategoriesAsync` calls `Notifications.setNotificationCategoryAsync(WEATHER_ALERT_CATEGORY, actions, options)`:
    - Action 1: `{ identifier: ACTION_VIEW_DETAILS, buttonTitle: t('notificationActionViewDetails'), options: { opensAppToForeground: true } }`
    - Action 2: `{ identifier: ACTION_SAVE_LOCATION, buttonTitle: t('notificationActionSaveLocation'), options: { opensAppToForeground: true } }`

### `src/hooks/useNotificationListeners.ts`

- Extended response handler:

  ```ts
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as Partial<RichNotificationData>;

      if (
        actionId === ACTION_VIEW_DETAILS ||
        actionId === Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        if (data.latitude != null && data.longitude != null) {
          router.push({
            pathname: '/details',
            params: {
              lat: String(data.latitude),
              lon: String(data.longitude),
              city: data.city ?? '',
            },
          });
        }
      } else if (actionId === ACTION_SAVE_LOCATION) {
        if (data.latitude != null && data.longitude != null && data.city) {
          await toggleSavedLocation({
            id: data.city,
            name: data.city,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            country: data.country ?? '',
          });
          Toast.show({
            type: 'success',
            text1: t('notificationLocationSavedToast'),
          });
        }
      }
    },
  );
  ```

## Files Created

| File                                                      | Purpose                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `docs/specs/rich-notification-actions/SPEC.md`            | Feature specification for Rich Notification Actions.                                                   |
| `src/services/notificationCategory.service.ts`            | Category registration logic, constants, and notification payload interface.                            |
| `src/tests/services/notificationCategory.service.test.ts` | Unit tests for registering notification categories with `expo-notifications`.                          |
| `src/tests/hooks/useNotificationListeners.test.ts`        | Unit tests verifying notification response handling, action handling, navigation, and location saving. |

## Files Modified

| File                                    | Change                                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/index.ts`                 | Re-exports constants and functions from `notificationCategory.service.ts`.                                                       |
| `src/hooks/useNotifications.ts`         | Invokes `registerNotificationCategoriesAsync()` during notification initialization.                                              |
| `src/hooks/useNotificationListeners.ts` | Listens to responses and handles `VIEW_DETAILS`, `SAVE_LOCATION`, and default tap actions.                                       |
| `src/services/i18n.ts`                  | Adds localized strings for action titles (`notificationActionViewDetails`, `notificationActionSaveLocation`) and toast feedback. |

## Implementation Steps

1. Create `src/services/notificationCategory.service.ts`:
   - Export constants `WEATHER_ALERT_CATEGORY`, `ACTION_VIEW_DETAILS`, `ACTION_SAVE_LOCATION`.
   - Export `RichNotificationData` interface.
   - Implement `registerNotificationCategoriesAsync()` calling `Notifications.setNotificationCategoryAsync`.
2. Re-export `notificationCategory.service` from `src/services/index.ts`.
3. Add i18n keys in `src/services/i18n.ts`:
   - `notificationActionViewDetails`: "View Details" / "詳細を見る"
   - `notificationActionSaveLocation`: "Save Location" / "場所を保存"
   - `notificationLocationSavedToast`: "Location saved from notification" / "通知から場所を保存しました"
4. Update `src/hooks/useNotifications.ts`:
   - Import and call `registerNotificationCategoriesAsync()` inside `registerForPushNotificationsAsync()` when on Android/iOS.
5. Update `src/hooks/useNotificationListeners.ts`:
   - Inject `router` from `expo-router` and `toggleSavedLocation` from `useSavedLocations`.
   - Parse notification response payload `data`.
   - Handle `ACTION_VIEW_DETAILS` and `Notifications.DEFAULT_ACTION_IDENTIFIER` by triggering `router.push('/details', { lat, lon, city })`.
   - Handle `ACTION_SAVE_LOCATION` by invoking `toggleSavedLocation` and showing toast notification.
6. Write unit tests:
   - `src/tests/services/notificationCategory.service.test.ts`: Verify category and action button registration.
   - `src/tests/hooks/useNotificationListeners.test.ts`: Mock `expo-notifications` and `expo-router`, test responses for default tap, view details action, and save location action.
7. Verification: Run repository validation command `pnpm run verify` (`npx tsc --noEmit && pnpm run lint && pnpm run test`).

## Style & Conventions

- Follows Expo SDK 56 `expo-notifications` versioned API standards.
- Follows codebase structure: services in `src/services/`, hooks in `src/hooks/`, tests in `src/tests/`.
- Localized UI text via `src/services/i18n.ts` (`en` and `ja`).
- TypeScript strict mode compliance with explicitly typed interfaces (`RichNotificationData`).

## Acceptance Criteria

- [ ] Category `WEATHER_ALERT` is registered with actions `VIEW_DETAILS` and `SAVE_LOCATION`.
- [ ] Tapping a notification body or "View Details" action navigates to the details screen with location parameters.
- [ ] Tapping "Save Location" action triggers saving the location and displays a confirmation toast.
- [ ] All user-visible action text is localized in `en` and `ja`.
- [ ] Unit tests pass for `notificationCategory.service` and `useNotificationListeners`.
- [ ] Verification command `pnpm run verify` (`npx tsc --noEmit && pnpm run lint && pnpm run test`) passes with 0 errors.

## Constraints

- **Android-focused scope:** Category and action button behavior tested against Android push / local notification payload rules.
- **Payload format requirement:** Notification payload `data` must contain `latitude`, `longitude`, and `city` fields for actions to function.
- Non-goal: Custom notification UI layouts beyond native category action buttons.
