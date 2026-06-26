# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

This project uses **pnpm** (there is a `pnpm-lock.yaml`); do not use npm or yarn.

```bash
pnpm start          # expo start (Metro dev server; pick platform interactively)
pnpm run android    # expo run:android (native build + launch)
pnpm run ios        # expo run:ios
pnpm test           # vitest run (single pass)
pnpm run test:watch # vitest (watch mode)
pnpm run lint       # oxlint
pnpm run lint:fix   # oxlint --fix
pnpm run format     # prettier --write .
```

Tests use **Vitest** (config in `vitest.config.ts`) with a `jsdom` environment. React Native primitives are aliased to `react-native-web` so components render to the DOM; `@` resolves to `./src`. Test files live in `src/tests/`, mirroring the `src/` structure (`tests/app`, `tests/components`, `tests/services`, `tests/store`).

Linting uses **oxlint** (config in `.oxlintrc.json`), not ESLint. oxlint has no Expo preset, so React/React-Native rules are compensated explicitly via the `react`, `jsx-a11y`, `import`, `typescript`, `unicorn`, and `oxc` plugins (notably `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`). Formatting is a separate Prettier step (`pnpm format`). A pre-commit hook (husky + lint-staged) runs `oxlint --fix` and `prettier --write` on staged files, so commits auto-format/lint.

To verify a change there is no single command: run `npx tsc --noEmit` for type checking (no `typecheck` script exists), `pnpm run lint`, and `pnpm test`. There is no E2E or native test harness, so behavior on a real device/emulator is verified manually.

## Architecture

Expo SDK 56 app (React 19, React Native 0.85) using **expo-router** file-based routing. Per `AGENTS.md`, consult the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing code, since APIs in this SDK differ from older Expo.

- **Source lives in `src/`, not the default `app/`.** Routes are in `src/app/`; expo-router auto-detects `src/app` since there is no root-level `app/`. Path alias `@/*` → `./src/*` (and `@/assets/*` → `./assets/*`) is set in `tsconfig.json`.
- **`example/` is the original create-expo-app template** kept for reference only (tabs, themed components, color-scheme hooks). It is NOT part of the running app, is excluded from linting, and must not be edited expecting changes to appear.
- **Routing & app root** (`src/app/_layout.tsx`): `RootLayout` wraps everything in a `PersistQueryClientProvider` (TanStack Query cache persisted to `AsyncStorage`, 24h `gcTime`) and `SafeAreaProvider`. The inner `RootApp` mounts global listeners (`useNetworkMonitor`, `useAuthListener`), renders the `<OfflineIndicator />`, and gates routes with `<Stack.Protected guard={...}>` based on auth state: authenticated users see `index`/`details`/`settings`, otherwise only `login`. The `Stack` is headerless with a `fade` animation. A module-level `ErrorBoundary` export renders a fallback screen on render errors. `typedRoutes` and `reactCompiler` experiments are enabled in `app.json`. Because the React Compiler is on, it auto-memoizes components and values, so avoid hand-rolling `useMemo`/`useCallback`/`React.memo` unless profiling shows a real need.
  - Screens: `index.tsx` (home) → `details.tsx` (via `router.push({ pathname: '/details', params })`), plus `login.tsx` and `settings.tsx`.
- **Auth** (Firebase Auth + Google Sign-In): `src/services/auth.service.ts` wraps `@react-native-firebase/auth` and `@react-native-google-signin/google-signin` (Google, anonymous, and sign-out flows). `src/hooks/useAuthListener.ts` subscribes to `onAuthStateChanged` and syncs the global store; `src/hooks/useAuth.ts` is the consumer-facing hook. Web client id comes from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; `google-services.json` is required.
- **State management**:
  - **TanStack Query (v5)** for server state (anything fetched from an API), with caching/loading/error handled globally and persisted to AsyncStorage.
  - **Zustand stores** in `src/store/` for client state (auth, user settings, recent searches, connectivity, etc.), one `useXxxStore` per file. State that should survive restarts uses the `zustand/middleware` `persist` middleware over AsyncStorage. Reach for a store for cross-screen client state; use TanStack Query for anything that comes from the network.
- **Data layer** (live weather from the Open-Meteo API): the flow is **API client, then service, then hook, then screen/component**.
  - **API client**: `src/services/api.client.ts` (Axios with error interceptors). Open-Meteo is the base URL; pass an absolute URL to hit other endpoints while reusing the interceptor.
  - **Services** live in `src/services/` (one file per domain, re-exported from `index.ts`). They hold the raw async functions that talk to APIs/device APIs (e.g. `expo-location`) and return typed data, with no React. The weather forecast call takes unit params so results vary by settings.
  - **Hooks** live in `src/hooks/` (one file per hook, re-exported from `index.ts`) and wrap services in TanStack Query (`useQuery`/dependent queries). Convention: data-fetching hooks are named `useFetch*`, one concern per file; the weather query is re-keyed by the unit settings so it refetches when units change.
  - See the `index.ts` barrels in each folder for the current full list rather than maintaining one here.
- **Notifications**: `src/hooks/useNotifications.ts` registers an Expo push token (requires the EAS `projectId` from `app.json`) and can send a test push via `EXPO_PUBLIC_EXPO_PUSH_ENDPOINT`. `expo-notifications` is configured as a plugin.
- **Offline support**: `useNetworkMonitor` bridges `@react-native-community/netinfo` into both `useNetworkStore` and TanStack Query's `onlineManager`; `OfflineIndicator` renders a banner when disconnected.
- **UI & styling**: Reusable presentational components live in `src/components/` (one component per file, named export); screens in `src/app/` compose them. Style with `StyleSheet.create`, pulling from the central design tokens in `src/theme/index.ts` (`theme.colors`, `theme.spacing`, `theme.borderRadius`, `theme.typography`). The navy `#1A237E` base is `theme.colors.primary`/`background`. Prefer these tokens over hardcoded values. New shared UI should go in `src/components/` and reuse the theme rather than inlining literals.
- **Icons** use `expo-symbols` (`SymbolView`) with cross-platform names of the shape `{ ios: 'sf.symbol.name', android: 'material_name' }`. The `SymbolName` type and the WMO-weather-code-to-symbol mapping live in `src/utils/weatherMapper.ts` (alongside `weatherCodeToCondition`). Other shared helpers (date/time formatting, etc.) are in `src/utils/formatters.ts`.
- **Types**: shared interfaces are in `src/interfaces/` (`auth.ts`, `location.ts`, `weather.ts`), re-exported from `index.ts`.

## Environment

Config is supplied via environment variables loaded by Expo. All client-readable vars must be prefixed `EXPO_PUBLIC_` (anything without the prefix is not bundled into the app). Copy `.env.sample` to `.env` and fill in the values; `.env.sample` is the source of truth for the full list.

| Variable                           | Purpose                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_OPEN_METEO_API_URL`   | Base URL for the Open-Meteo forecast API (Axios `baseURL` in `api.client.ts`).                                                         |
| `EXPO_PUBLIC_GEOCODING_API_URL`    | Open-Meteo geocoding endpoint for location search (falls back to a hardcoded default if unset).                                        |
| `EXPO_PUBLIC_EXPO_PUSH_ENDPOINT`   | Expo push service URL used to send test notifications.                                                                                 |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web OAuth client id for Google Sign-In (the `client_type: 3` entry in `google-services.json`). When unset, Google Sign-In is disabled. |

These are public, non-secret config values (the `EXPO_PUBLIC_` prefix ships them in the client bundle), so do not put real secrets here. `google-services.json` (Firebase) is also required at the repo root for auth. When adding a new variable, add it to `.env.sample` so the list stays discoverable.
