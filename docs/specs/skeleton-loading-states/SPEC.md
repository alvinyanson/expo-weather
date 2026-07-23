# Feature: Skeleton Loading States

## Intent

Replace full-screen `ActivityIndicator` loading spinners across the app (Home, Details, and Saved Locations screens) with layout-matched animated skeleton placeholders powered by `react-native-reanimated` pulse animations, reducing perceived load times and eliminating layout pop-in.

## Context

- **Problem statement:**
  - Currently, when `index.tsx`, `details.tsx`, or `saved.tsx` are in loading states (`isLoadingLocation`, `isLoadingWeather`, or `isLoadingSavedLocations`), the app renders a generic centered `ActivityIndicator` with a static text message (`fetchingWeather`, `loadingDetails`, `loadingSaved`).
  - This generic spinner causes visual jarring and layout pop-in when weather data finishes loading, failing modern native app design expectations.
- **Current code:**
  - `src/app/index.tsx`: Renders `ActivityIndicator` when `isLoading = isLoadingLocation || isLoadingWeather` (`:181-185`).
  - `src/app/details.tsx`: Renders `ActivityIndicator` when `isLoading = isGettingLocation || (!weather && isFetchingWeather)` (`:124-133`).
  - `src/app/saved.tsx`: Renders `ActivityIndicator` inside `renderBody()` when `isLoading` is true (`:47-54`).
  - Screen components compose presentational UI cards: `CurrentWeather` (`src/components/CurrentWeather.tsx`), `HourlyForecast` (`src/components/HourlyForecast.tsx`), `WeatherSummaryCard` (`src/components/WeatherSummaryCard.tsx`), `PressureCard` (`src/components/PressureCard.tsx`), `DailyForecastList` (`src/components/DailyForecastList.tsx`), and `SavedLocationItem` (`src/components/SavedLocationItem.tsx`).
  - `react-native-reanimated` (v4.3.1) is installed and used across components (`src/components/OfflineIndicator.tsx`, `BatterySaverIndicator.tsx`).
  - Central design tokens in `src/theme/index.ts` provide colors (`theme.colors.surface`, `theme.colors.surfaceLight`, `theme.colors.background`), spacing, and border radii.
- **User impact:**
  - Users experience layout-matched, animated placeholders immediately upon navigating or fetching data, providing immediate context for the incoming screen layout.
- **Dependencies:**
  - Uses `react-native-reanimated` (already in `package.json`). No additional packages or native plugins are required.

## Data Model

N/A — Skeleton loading states are purely presentational UI components. No changes to database models, persistence layers, Zustand stores, or API interfaces.

## Interfaces / API

### `SkeletonBox` (primitive component) — `src/components/SkeletonBox.tsx`

```ts
interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonBox(props: SkeletonBoxProps): JSX.Element;
```

- Renders a `react-native-reanimated` `Animated.View` with an infinitely repeating pulse loop (`withRepeat(withSequence(withTiming(0.35, { duration: 800 }), withTiming(0.75, { duration: 800 })), -1, true)`).
- Defaults: `width = '100%'`, `height = 20`, `borderRadius = theme.borderRadius.md`, `backgroundColor = theme.colors.surface`.

### `HomeScreenSkeleton` — `src/components/skeletons/HomeScreenSkeleton.tsx`

```ts
interface HomeScreenSkeletonProps {
  testID?: string;
}

export function HomeScreenSkeleton(props?: HomeScreenSkeletonProps): JSX.Element;
```

- Renders placeholders mirroring `index.tsx`: header/search placeholder, a card matching `CurrentWeather` height and layout (city line, hero temp block, condition text), a row matching `HourlyForecast` capsules, and a save button outline.
- Adapts to tablet window width (`width >= 768`) matching `index.tsx` multi-column structure. Default `testID="home-skeleton"`.

### `DetailsScreenSkeleton` — `src/components/skeletons/DetailsScreenSkeleton.tsx`

```ts
interface DetailsScreenSkeletonProps {
  testID?: string;
}

export function DetailsScreenSkeleton(props?: DetailsScreenSkeletonProps): JSX.Element;
```

- Renders placeholders mirroring `details.tsx`: header placeholder, `WeatherSummaryCard` placeholder card, `PressureCard` skeleton, and 7 rows matching `DailyForecastList` items.
- Supports tablet 2-column layout when `width >= 768`. Default `testID="details-skeleton"`.

### `SavedLocationsSkeleton` — `src/components/skeletons/SavedLocationsSkeleton.tsx`

```ts
interface SavedLocationsSkeletonProps {
  testID?: string;
}

export function SavedLocationsSkeleton(props?: SavedLocationsSkeletonProps): JSX.Element;
```

- Renders 4 card placeholders matching `SavedLocationItem` list/grid items.
- Supports tablet 2-column grid layout when `width >= 768`. Default `testID="saved-skeleton"`.

## Files Created

| File                                                   | Purpose                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/components/SkeletonBox.tsx`                       | Base Reanimated pulsing placeholder block with customizable dimensions.               |
| `src/components/skeletons/HomeScreenSkeleton.tsx`      | Layout-matched skeleton placeholder component for the Home screen (`index.tsx`).      |
| `src/components/skeletons/DetailsScreenSkeleton.tsx`   | Layout-matched skeleton placeholder component for the Details screen (`details.tsx`). |
| `src/components/skeletons/SavedLocationsSkeleton.tsx`  | Layout-matched skeleton placeholder component for Saved Locations (`saved.tsx`).      |
| `src/tests/components/SkeletonBox.test.tsx`            | Unit tests verifying `SkeletonBox` renders with custom dimensions and testID.         |
| `src/tests/components/HomeScreenSkeleton.test.tsx`     | Unit tests verifying `HomeScreenSkeleton` structure and responsiveness.               |
| `src/tests/components/DetailsScreenSkeleton.test.tsx`  | Unit tests verifying `DetailsScreenSkeleton` structure and responsiveness.            |
| `src/tests/components/SavedLocationsSkeleton.test.tsx` | Unit tests verifying `SavedLocationsSkeleton` structure and responsiveness.           |

## Files Modified

| File                             | Change                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/components/index.ts`        | Re-export `SkeletonBox`, `HomeScreenSkeleton`, `DetailsScreenSkeleton`, and `SavedLocationsSkeleton`. |
| `src/app/index.tsx`              | Replace `ActivityIndicator` loading view with `<HomeScreenSkeleton />`.                               |
| `src/app/details.tsx`            | Replace `ActivityIndicator` loading view with `<DetailsScreenSkeleton />`.                            |
| `src/app/saved.tsx`              | Replace `ActivityIndicator` in `renderBody()` with `<SavedLocationsSkeleton />`.                      |
| `src/tests/app/index.test.tsx`   | Update loading test cases to check for `home-skeleton` instead of `ActivityIndicator`.                |
| `src/tests/app/details.test.tsx` | Update loading test cases to check for `details-skeleton` instead of `ActivityIndicator`.             |
| `src/tests/app/saved.test.tsx`   | Update loading test cases to check for `saved-skeleton` instead of `ActivityIndicator`.               |

## Implementation Steps

1. Create `src/components/SkeletonBox.tsx`:
   - Implement `SkeletonBox` using `react-native-reanimated` shared values (`useSharedValue`) and animated styles (`useAnimatedStyle`).
   - Use `withRepeat`, `withSequence`, and `withTiming` to animate opacity continuously between `0.35` and `0.75`.
   - Apply design tokens (`theme.colors.surface`, `theme.borderRadius.md`).

2. Create composite screen skeleton components in `src/components/skeletons/`:
   - `HomeScreenSkeleton.tsx`: Compose `SkeletonBox` primitives matching `SearchHeader`, `CurrentWeather`, `HourlyForecast`, and save button. Handle tablet breakpoint (`useWindowDimensions().width >= 768`).
   - `DetailsScreenSkeleton.tsx`: Compose `SkeletonBox` primitives matching `DetailsHeader`, `WeatherSummaryCard`, `PressureCard`, and `DailyForecastList`. Handle tablet breakpoint.
   - `SavedLocationsSkeleton.tsx`: Compose `SkeletonBox` primitives matching `SavedLocationItem` card items in a list/grid container. Handle tablet breakpoint.

3. Re-export all new skeleton components from `src/components/index.ts`.

4. Wire skeleton components into application screens:
   - In `src/app/index.tsx`: Replace `ActivityIndicator` container with `<HomeScreenSkeleton />`.
   - In `src/app/details.tsx`: Replace `ActivityIndicator` container with `<DetailsScreenSkeleton />`.
   - In `src/app/saved.tsx`: Replace `ActivityIndicator` container in `renderBody()` with `<SavedLocationsSkeleton />`.

5. Write unit tests for new skeleton components under `src/tests/components/`:
   - `SkeletonBox.test.tsx`
   - `HomeScreenSkeleton.test.tsx`
   - `DetailsScreenSkeleton.test.tsx`
   - `SavedLocationsSkeleton.test.tsx`

6. Update existing screen test suites under `src/tests/app/`:
   - In `src/tests/app/index.test.tsx`: Update loading assertion to expect `getByTestId('home-skeleton')`.
   - In `src/tests/app/details.test.tsx`: Update loading assertion to expect `getByTestId('details-skeleton')`.
   - In `src/tests/app/saved.test.tsx`: Update loading assertion to expect `getByTestId('saved-skeleton')`.

7. Run repository verification commands:
   - `npx tsc --noEmit`
   - `pnpm run lint`
   - `pnpm test`

## Style & Conventions

- Follows repository guidelines in `CLAUDE.md`: functional components, strict TypeScript, design tokens from `@/theme`, `@/` path aliases, and one component per file re-exported from `src/components/index.ts`.
- Uses `react-native-reanimated` worklets for UI thread animations.
- Test files mirror component structure under `src/tests/components/`.

## Acceptance Criteria

- [ ] `SkeletonBox` renders an animated pulsing block using `react-native-reanimated` and supports `width`, `height`, `borderRadius`, `style`, and `testID`.
- [ ] `HomeScreenSkeleton` renders a layout-matched placeholder structure with `testID="home-skeleton"`.
- [ ] `DetailsScreenSkeleton` renders a layout-matched placeholder structure with `testID="details-skeleton"`.
- [ ] `SavedLocationsSkeleton` renders layout-matched location card placeholders with `testID="saved-skeleton"`.
- [ ] `src/app/index.tsx`, `src/app/details.tsx`, and `src/app/saved.tsx` display their respective skeleton placeholders during loading states instead of full-screen `ActivityIndicator` spinners.
- [ ] Automated unit tests for `SkeletonBox`, `HomeScreenSkeleton`, `DetailsScreenSkeleton`, and `SavedLocationsSkeleton` pass.
- [ ] Existing screen tests (`index.test.tsx`, `details.test.tsx`, `saved.test.tsx`) pass with updated loading assertions.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass with zero type errors or lint warnings.

## Constraints

- **Scope boundaries:**
  - Replaces loading spinners on Home, Details, and Saved Locations screens.
  - Pull-to-refresh spinners on lists and smaller inline action indicators (e.g. search input indicators) remain unchanged.
- **Android-first focus:**
  - Uses `react-native-reanimated` so pulse animations run on the UI thread on Android.
- **Non-goals:**
  - Third-party SVG shimmer masking libraries (`react-content-loader`) or complex Canvas/Skia shaders. Pure Reanimated opacity pulsing is performant and dependency-free.
  - Skeletons for Auth (`login.tsx`) or Settings (`settings.tsx`) screens.
