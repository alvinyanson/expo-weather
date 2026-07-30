# Feature: Retry with Exponential Backoff and Timeout UX

## Intent

Weather network requests systematically handle transient network failures and request timeouts using configurable retries with exponential backoff, while providing a clear inline error UI (`ApiErrorState`) that distinguishes timeout, offline network, server error, and client error states with localized messaging, retry indicators, and manual retry controls.

## Context

- **Problem statement:** Current network error handling across the app is minimal. `src/services/api.client.ts` configures a static 10,000ms (10s) request timeout and logs breadcrumbs, but query errors are caught as generic `Error` instances. `src/app/index.tsx` and `src/app/details.tsx` render basic fallback views (`<Text style={styles.errorText}>{error.message}</Text>`) with plain retry or go-back buttons. Users are not informed whether a failure was caused by a timed-out request, complete network disconnection, or server-side error. Furthermore, `useFetchWeather.ts` relies on default TanStack Query behavior without an explicit exponential backoff or retry limit policy tailored to error classification.
- **Current code:**
  - `src/services/api.client.ts`: Axios instance configured with `timeout: 10000` and response error interceptor logging to `logBreadcrumb`.
  - `src/app/_layout.tsx`: Instantiates `QueryClient` with default `gcTime: 24h` but no explicit global `retry` or `retryDelay` policies.
  - `src/hooks/useFetchWeather.ts`: Wraps `fetchWeather` in `useQuery`, providing `queryKey`, `staleTime`, and `refetchOnWindowFocus` (dynamically adjusted for battery-saver state), but omits custom `retry` and `retryDelay` settings.
  - `src/app/index.tsx` & `src/app/details.tsx`: Handle query errors by checking for `LocationPermissionError` or displaying raw error message text with simple retry buttons.
  - `src/services/i18n.ts`: Holds translations (`en` / `ja`), currently including `retryText`, `noWeatherData`, etc., but lacking specific messages for timeout vs offline vs server error states.
- **User impact:** Users receive clear, informative error feedback when weather fetches fail (e.g., distinguishing a request timeout from being completely offline), see live retry status during backoff attempts, and have a consistent inline UI to manually trigger retries.
- **Dependencies:** `@tanstack/react-query` v5 and `axios` (already installed in `package.json`). No new third-party packages or native module changes are required.

## Data Model

- **`src/utils/apiError.ts`** defines error taxonomy types and structured error details:
  - `type ApiErrorType = 'timeout' | 'offline' | 'server' | 'client' | 'unknown';`
  - Interface `ApiErrorDetails`:
    ```ts
    export interface ApiErrorDetails {
      type: ApiErrorType;
      title: string;
      message: string;
      iconName: SymbolName;
      isRetryable: boolean;
    }
    ```
- **Query retry & backoff strategy**:
  - Maximum 3 retries for retryable errors (`timeout`, `offline`, `server`).
  - 0 retries for non-retryable errors (`client` 4xx, location permission errors).
  - Exponential backoff delay calculation: `attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 10000)` (1s, 2s, 4s up to 10s max).
- **Database or persistence changes**: N/A — No database or persistent storage schema changes required.

## Interfaces / API

- **Error classification helpers in `src/utils/apiError.ts`**:

  ```ts
  export const getApiErrorType = (error: unknown): ApiErrorType => {
    // Identifies Axios timeout (ECONNABORTED, ETIMEDOUT, timeout message),
    // network offline (ERR_NETWORK, !error.response, 'Network Error'),
    // 5xx server errors, 4xx client errors, or unknown.
  };

  export const getApiErrorDetails = (error: unknown): ApiErrorDetails => {
    // Maps ApiErrorType to localized title, message, SymbolName icon, and isRetryable flag.
  };

  export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
    // Returns true if failureCount < 3 and error type is retryable (!= 'client').
  };

  export const getExponentialBackoffDelay = (failureCount: number): number => {
    // Calculates exponential backoff: Math.min(1000 * Math.pow(2, failureCount), 10000).
  };
  ```

- **Component interface in `src/components/ApiErrorState.tsx`**:
  ```ts
  export interface ApiErrorStateProps {
    error: Error | unknown;
    onRetry?: () => void;
    isRetrying?: boolean;
    failureCount?: number;
    maxRetries?: number;
    containerStyle?: StyleProp<ViewStyle>;
  }
  ```
  - Behavior/contract:
    - Renders icon, localized title, and localized description based on `getApiErrorDetails(error)`.
    - Renders a manual retry `Pressable` button when `onRetry` is provided and `isRetryable` is `true`.
    - Displays an active `ActivityIndicator` and attempt count (e.g. `t('retryingText', { attempt: failureCount, max: maxRetries })`) when `isRetrying` is `true`.

## Files Created

| File                                          | Purpose                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/apiError.ts`                       | Error classification utilities (`getApiErrorType`, `getApiErrorDetails`, `shouldRetryQuery`, `getExponentialBackoffDelay`).   |
| `src/components/ApiErrorState.tsx`            | Reusable inline error UI component displaying classified error messages, icons, retry status, and manual retry action button. |
| `src/tests/utils/apiError.test.ts`            | Unit tests for error classification logic, timeout detection, network offline detection, and exponential backoff math.        |
| `src/tests/components/ApiErrorState.test.tsx` | Unit tests verifying rendering of timeout, offline, server error, and active retrying state UI.                               |

## Files Modified

| File                                       | Change                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/services/api.client.ts`               | Enhance response interceptor to normalize timeout (`ECONNABORTED`) and network error codes for accurate classification.                          |
| `src/hooks/useFetchWeather.ts`             | Configure `useQuery` options with `retry: shouldRetryQuery` and `retryDelay: getExponentialBackoffDelay`.                                        |
| `src/app/_layout.tsx`                      | Update global `QueryClient` default query options with default retry and exponential backoff policy.                                             |
| `src/components/index.ts`                  | Re-export `ApiErrorState` from components barrel.                                                                                                |
| `src/app/index.tsx`                        | Replace generic error UI on HomeScreen with `<ApiErrorState>` for weather query failures.                                                        |
| `src/app/details.tsx`                      | Replace plain error text on DetailsScreen with `<ApiErrorState>` for weather query failures.                                                     |
| `src/services/i18n.ts`                     | Add localized strings for timeout, offline, server, and general error titles/messages and retrying status in English (`en`) and Japanese (`ja`). |
| `src/tests/hooks/useFetchWeather.test.tsx` | Add unit test assertions for exponential backoff and retry behavior on weather queries.                                                          |

## Implementation Steps

1. **Create error classification utilities (`src/utils/apiError.ts`)**:
   - Implement `getApiErrorType` inspecting Axios error codes (`ECONNABORTED`, `ERR_NETWORK`), HTTP response status (5xx vs 4xx), and error messages.
   - Implement `getApiErrorDetails` pairing error types with icon symbols (`clock.fill` / `timer` for timeout, `wifi.slash` for offline, `exclamationmark.triangle` for server, `exclamationmark.circle` for client/general).
   - Implement `shouldRetryQuery` (max 3 retries for non-4xx errors) and `getExponentialBackoffDelay` (1s, 2s, 4s, capped at 10s).
2. **Add localization strings (`src/services/i18n.ts`)**:
   - Add keys `errorTimeoutTitle`, `errorTimeoutMessage`, `errorOfflineTitle`, `errorOfflineMessage`, `errorServerTitle`, `errorServerMessage`, `errorGeneralTitle`, `errorGeneralMessage`, and `retryingText` under both `en` and `ja` locales.
3. **Enhance Axios API client (`src/services/api.client.ts`)**:
   - Standardize error responses in response interceptor so timeout and network errors retain identifying properties (`code` or `isTimeout` flag).
4. **Create reusable error component (`src/components/ApiErrorState.tsx`)**:
   - Build presentational component accepting `ApiErrorStateProps`.
   - Render appropriate symbol icon from `SymbolView`, localized error title and message, and retry button/status.
   - Re-export `ApiErrorState` from `src/components/index.ts`.
5. **Configure QueryClient and query hooks**:
   - Update `QueryClient` in `src/app/_layout.tsx` with global query defaults for `retry` and `retryDelay`.
   - Update `src/hooks/useFetchWeather.ts` to explicitly set `retry: shouldRetryQuery` and `retryDelay: (failureCount) => getExponentialBackoffDelay(failureCount)`.
6. **Update screen error handling (`src/app/index.tsx`, `src/app/details.tsx`)**:
   - Wire `ApiErrorState` into `HomeScreen` and `DetailsScreen` error branches, passing query failure state and `refetch` handlers.
7. **Add unit tests**:
   - Create `src/tests/utils/apiError.test.ts` testing all branches of `getApiErrorType` and backoff calculations.
   - Create `src/tests/components/ApiErrorState.test.tsx` testing UI output for timeout, offline, server, and retrying states.
   - Update `src/tests/hooks/useFetchWeather.test.tsx` verifying retry configuration options on the weather query.
8. **Verify work**:
   - Run type checking (`npx tsc --noEmit`), linting (`pnpm run lint`), and tests (`pnpm test`).

## Style & Conventions

- Follows the React Native specification guidelines (`CLAUDE.md`, TypeScript strict mode, `@/` path alias).
- UI component follows repository conventions: `StyleSheet.create` with theme tokens from `@/theme` (`theme.colors`, `theme.spacing`, `theme.typography`, `theme.borderRadius`).
- Components placed in `src/components/` and re-exported from `src/components/index.ts`.
- Localized copy accessed via `t(...)` in `src/services/i18n.ts`.
- React Compiler enabled; avoid unnecessary manual `useCallback`/`useMemo` wrappers.

## Acceptance Criteria

- [ ] Error classification utility `getApiErrorType` accurately identifies `'timeout'`, `'offline'`, `'server'`, `'client'`, and `'unknown'` errors.
- [ ] `useFetchWeather` uses exponential backoff (`1s`, `2s`, `4s`, max `10s`) up to 3 retries for network/timeout/server errors, and skips retries (0 retries) for 4xx client errors.
- [ ] `ApiErrorState` renders distinct icons and localized messages (in English and Japanese) for timeout, offline, and server errors.
- [ ] `ApiErrorState` shows an active retry indicator with attempt count (e.g. "Retrying (Attempt 2 of 3)...") when a query retry is in progress.
- [ ] `HomeScreen` (`src/app/index.tsx`) and `DetailsScreen` (`src/app/details.tsx`) display `ApiErrorState` on weather error and allow manual retry.
- [ ] Unit tests in `src/tests/utils/apiError.test.ts`, `src/tests/components/ApiErrorState.test.tsx`, and `src/tests/hooks/useFetchWeather.test.tsx` pass cleanly.
- [ ] Type check (`npx tsc --noEmit`), lint (`pnpm run lint`), and tests (`pnpm test`) pass without errors.

## Constraints

- **Scope boundaries:** Applies to weather and geocoding network requests made via Axios / TanStack Query. Does not apply to native device APIs (e.g., GPS hardware checks) or Firebase Auth operations which manage their own retries/error handling.
- **Non-goals:** No custom network proxy testing UI, no automatic offline mutation queueing, and no user-configurable retry limits in Settings screen.
- **Dependencies:** Uses existing packages (`@tanstack/react-query`, `axios`, `expo-symbols`); no extra dependencies or native code changes.
