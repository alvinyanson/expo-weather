# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm start          # expo start (Metro dev server; pick platform interactively)
npm run android    # expo run:android (native build + launch)
npm run ios        # expo run:ios
npm run web        # expo run:web
npm run lint       # expo lint
npm run lint:fix   # expo lint --fix
npm run format     # prettier --write .
```

No test runner is configured. A pre-commit hook (husky + lint-staged) runs `expo lint --fix` and `prettier --write` on staged files, so commits auto-format/lint.

## Architecture

Expo SDK 56 app (React 19, React Native 0.85) using **expo-router** file-based routing. Per `AGENTS.md`, consult the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing code — APIs in this SDK differ from older Expo.

- **Source lives in `src/`, not the default `app/`.** Routes are in `src/app/`; expo-router auto-detects `src/app` since there is no root-level `app/`. Path alias `@/*` → `./src/*` (and `@/assets/*` → `./assets/*`) is set in `tsconfig.json`.
- **`example/` is the original create-expo-app template** kept for reference only (tabs, themed components, color-scheme hooks). It is NOT part of the running app — don't edit it expecting changes to appear.
- **Routing**: `src/app/_layout.tsx` defines a headerless `Stack` (fade animation) wrapped in `SafeAreaProvider`/`SafeAreaView`. Screens: `index.tsx` (home) → `details.tsx`, navigated via `useRouter().push('/details')` and `router.back()`. `typedRoutes` and `reactCompiler` experiments are enabled in `app.json`.
- **Data Layer**: Live weather data from Open-Meteo API.
  - **API Client**: `src/services/api.client.ts` (Axios with error interceptors).
  - **Services**: `src/services/weather.service.ts` handles `expo-location` and API calls.
  - **Hooks**: `src/hooks/useWeather.ts` provides TanStack Query (v5) hooks `useFetchLocation` and `useFetchWeather` (dependent).
  - **State Management**: TanStack Query handles caching and loading/error states globally.
- **Icons use `expo-symbols` (`SymbolView`)** with cross-platform names of the shape `{ ios: 'sf.symbol.name', android: 'material_name' }`. The `SymbolName` type is exported from `src/services/weather.service.ts`. Both screens are styled inline with `StyleSheet.create` against a fixed `#1A237E` background.
