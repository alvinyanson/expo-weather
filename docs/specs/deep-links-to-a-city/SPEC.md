# Feature: Deep Links to a City

## Intent

Support opening the app directly to a specific city's weather details via custom scheme URLs (e.g., `expoweather://weather?lat=..&lon=..&city=..` or `expoweather://details?lat=..&lon=..&city=..`), enabling seamless deep-link navigation from external shared links, push notifications, and intent triggers on Android.

## Context

- **Problem statement:** The app declares `"scheme": "expoweather"` in `app.json:8` and includes `expo-linking` (`~56.0.14`) in `package.json:30`. However, incoming custom scheme URLs with the `/weather` path (e.g. `expoweather://weather?lat=14.5995&lon=120.9842&city=Manila`) are not mapped to any route handler in `src/app/`, resulting in an unhandled route error. Furthermore, shared weather snapshots (`src/utils/shareWeather.ts`) compose plain text without including an actionable deep link URL.
- **Current code:**
  - `app.json:8`: Configures `"scheme": "expoweather"`, enabling deep link resolution for `expoweather://`.
  - `src/app/_layout.tsx:94-101`: Defines protected routes inside `<Stack.Protected guard={hasCompletedOnboarding && isAuthenticated}>`. Currently registered screens are `index`, `details`, `settings`, `saved`, `map`, and `history`.
  - `src/app/details.tsx:36`: Uses `useLocalSearchParams<{ lat?: string; lon?: string; city?: string }>()` to parse coordinates and city name to fetch weather data.
  - `src/utils/shareWeather.ts`: Composes the localized weather text string shared via `useShareWeather` (`src/hooks/useShareWeather.ts`), but omits deep link URL parameters.
  - `src/services/i18n.ts`: Houses localized strings for `en` and `ja`.
- **User impact:** Users receiving a shared weather message or tapping a deep link in another app or browser can launch Expo Weather and navigate directly to the specified city's weather details screen. Invalid links gracefully fallback to the home screen (`/`) with an error toast.
- **Dependencies:** `expo-linking` (`~56.0.14`) and `expo-router` (`~56.2.11`) in `package.json`. Android intent launch capabilities.

## Data Model

### `DeepLinkCityParams` interface (`src/utils/deepLink.ts`)

```ts
export interface DeepLinkCityParams {
  latitude: number;
  longitude: number;
  city: string;
}
```

### `RawDeepLinkQueryParams` interface (`src/utils/deepLink.ts`)

```ts
export interface RawDeepLinkQueryParams {
  lat?: string | number;
  lon?: string | number;
  city?: string;
}
```

### Validation Rules

- `latitude`: Numeric value in range `[-90, 90]` inclusive.
- `longitude`: Numeric value in range `[-180, 180]` inclusive.
- `city`: Non-empty trimmed string.
- No database or persistent storage schema changes required.

## Interfaces / API

### Deep Link Utility — `src/utils/deepLink.ts`

```ts
export const createCityDeepLink: (lat: number, lon: number, city: string) => string;
export const parseCityDeepLink: (url: string) => DeepLinkCityParams | null;
export const validateDeepLinkParams: (params: RawDeepLinkQueryParams) => DeepLinkCityParams | null;
```

- `createCityDeepLink`: Uses `Linking.createURL('weather', { queryParams: { lat: String(lat), lon: String(lon), city } })` to format `expoweather://weather?lat=<lat>&lon=<lon>&city=<city>`.
- `parseCityDeepLink`: Uses `Linking.parse(url)` to extract query parameters and returns validated `DeepLinkCityParams` or `null` if parsing/validation fails.
- `validateDeepLinkParams`: Validates that `lat` and `lon` can be coerced to valid finite numbers within bounds and `city` is non-empty.

### Route Handler — `src/app/weather.tsx`

- Route component for `expoweather://weather`.
- Parses local search parameters via `useLocalSearchParams<RawDeepLinkQueryParams>()`.
- Calls `validateDeepLinkParams(params)`.
- If valid: renders `<Redirect href={{ pathname: '/details', params: { lat: String(validated.latitude), lon: String(validated.longitude), city: validated.city } }} />`.
- If invalid: triggers `Toast.show({ type: 'error', text1: t('invalidDeepLinkTitle'), text2: t('invalidDeepLinkBody') })` and renders `<Redirect href="/" />`.

### Updated Shared Weather Formatter — `src/utils/shareWeather.ts`

```ts
export interface BuildWeatherShareMessageArgs {
  city: string;
  weather: WeatherResponse;
  tempUnit: string;
  lat?: number;
  lon?: number;
}

export const buildWeatherShareMessage: (args: BuildWeatherShareMessageArgs) => string;
```

- When `lat` and `lon` are provided, appends `\n\n${createCityDeepLink(lat, lon, city)}` to the shared message.

### Android ADB Intent Interface

Command to test opening a deep link via Android ADB tooling:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "expoweather://weather?lat=14.5995&lon=120.9842&city=Manila" com.anonymous.expoweather
```

## Files Created

| File                                      | Purpose                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `docs/specs/deep-links-to-a-city/SPEC.md` | Implementation-ready specification document for the feature.                                     |
| `src/utils/deepLink.ts`                   | Pure utility functions to create, parse, and validate city deep link URLs.                       |
| `src/app/weather.tsx`                     | Route handler for `expoweather://weather` that validates parameters and redirects to `/details`. |
| `src/tests/utils/deepLink.test.ts`        | Unit tests covering `createCityDeepLink`, `parseCityDeepLink`, and `validateDeepLinkParams`.     |
| `src/tests/app/weather.test.tsx`          | Unit tests covering valid parameter redirection and invalid parameter fallback in `/weather`.    |

## Files Modified

| File                                   | Change                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/app/_layout.tsx`                  | Register `<Stack.Screen name="weather" />` inside `<Stack.Protected>` authenticated route stack.    |
| `src/utils/shareWeather.ts`            | Update `buildWeatherShareMessage` to append `createCityDeepLink` when `lat` and `lon` are provided. |
| `src/hooks/useShareWeather.ts`         | Pass `latitude` and `longitude` to `buildWeatherShareMessage`.                                      |
| `src/app/details.tsx`                  | Pass `targetLocation.latitude` and `targetLocation.longitude` when triggering `share(...)`.         |
| `src/services/i18n.ts`                 | Add `invalidDeepLinkTitle` and `invalidDeepLinkBody` under `en` and `ja`.                           |
| `src/tests/utils/shareWeather.test.ts` | Update share message tests to verify deep link URL output when coordinates are present.             |
| `src/tests/app/details.test.tsx`       | Update details screen mock assertions for `useShareWeather` parameter signatures.                   |

## Implementation Steps

1. Create `src/utils/deepLink.ts` with `createCityDeepLink`, `parseCityDeepLink`, and `validateDeepLinkParams`.
2. Write unit tests in `src/tests/utils/deepLink.test.ts` covering valid coordinate/city inputs, out-of-bound coordinates, missing parameters, and URL encoding.
3. Add localized copy to `src/services/i18n.ts` (`en` and `ja`) under a `// Deep linking` comment: `invalidDeepLinkTitle` (e.g., "Invalid Link") and `invalidDeepLinkBody` (e.g., "The weather link is invalid or incomplete.").
4. Create `src/app/weather.tsx`: read search params, validate with `validateDeepLinkParams`, redirect to `/details` if valid or trigger error toast and redirect to `/` if invalid.
5. Write route unit tests in `src/tests/app/weather.test.tsx` verifying redirection for valid query parameters and fallback for malformed parameters.
6. Register `<Stack.Screen name="weather" />` in `src/app/_layout.tsx` under the authenticated `Stack.Protected` block.
7. Update `src/utils/shareWeather.ts`, `src/hooks/useShareWeather.ts`, and `src/app/details.tsx` to include deep links in shared weather messages.
8. Update existing tests in `src/tests/utils/shareWeather.test.ts` and `src/tests/app/details.test.tsx` to cover the updated share signature and message output.
9. Execute validation commands: `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test`.
10. Verify deep link launch using Android ADB intent commands: `adb shell am start -W -a android.intent.action.VIEW -d "expoweather://weather?lat=14.5995&lon=120.9842&city=Manila" com.anonymous.expoweather`.

## Style & Conventions

- Follows `CLAUDE.md` and repository guidelines: pure functions in `src/utils/`, functional components in `src/app/`, Vitest tests mirroring `src/` under `src/tests/`, oxlint compatibility, and `@/` path aliases.
- Uses `expo-linking` for standard Expo scheme formatting and parsing.
- Gated behind authentication and onboarding via `<Stack.Protected>` in `src/app/_layout.tsx`.
- All user-facing text localized via `i18n.ts` (`en` and `ja`).

## Acceptance Criteria

- [ ] Opening `expoweather://weather?lat=14.5995&lon=120.9842&city=Manila` launches/foregrounds the app and opens the details screen for Manila with `lat=14.5995` and `lon=120.9842`.
- [ ] Opening `expoweather://details?lat=35.6762&lon=139.6503&city=Tokyo` opens the details screen directly for Tokyo.
- [ ] Opening an invalid or incomplete deep link (e.g., `expoweather://weather?lat=999`) shows an error toast and navigates to the home screen (`/`).
- [ ] Unauthenticated or un-onboarded deep link attempts are intercepted by `Stack.Protected` until authentication/onboarding completes.
- [ ] Shared weather messages include a valid `expoweather://weather` deep link URL when shared from the details screen.
- [ ] Unit tests for `deepLink.ts`, `weather.tsx`, and `shareWeather.ts` pass cleanly in Vitest.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass with zero errors.

## Constraints

- **Scope bounded to custom URL scheme (`expoweather://`).** Universal links / Web domain links (`https://...`) are out of scope.
- **Android testing focus:** verified via `adb shell am start` intent commands.
- Parameter validation must reject out-of-bound latitude (`<-90` or `>90`), longitude (`<-180` or `>180`), non-numeric strings, and empty city names.
- Deep link navigation must never crash the app when handling malformed query strings.
