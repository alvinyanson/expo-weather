# Feature: Swipe-Down-to-Dismiss Details

## Intent

The user can drag the Details screen downward with a pan gesture to dismiss it (navigating back), with a dark backdrop dimming behind the moving content and a spring snap-back when the drag is too small to commit, mirroring the gesture-driven animation pattern already used by swipe-to-delete on saved locations.

## Context

- **Problem statement:** The Details screen (`src/app/details.tsx`) can only be dismissed by tapping the back arrow in `DetailsHeader` (`onBack={() => router.back()}`, `src/app/details.tsx:133`). There is no gesture-driven dismissal, which is the expected interaction for a pushed detail view on Android and a natural extension of the codebase's existing gesture work.
- **Current code:**
  - `src/app/details.tsx` renders a plain full-screen `View` (`styles.container`, `flex: 1`, `backgroundColor: theme.colors.background`) that composes `DetailsHeader`, `WeatherSummaryCard`, `PressureCard`, and `DailyForecastList`. Navigation uses `useRouter()` with `router.back()`.
  - The lower region on mobile is `DailyForecastList` (`src/components/DailyForecastList.tsx`), a scrollable `FlatList` with a `RefreshControl` (pull-to-refresh via `onRefresh`). A dismiss pan must not hijack this vertical scroll or the pull-to-refresh.
  - The existing gesture/animation pattern lives in `src/components/SavedLocationItem.tsx`: `ReanimatedSwipeable` + `react-native-reanimated` (`useAnimatedStyle`, `SharedValue`, `transform: translateX`). The root is already wrapped in `GestureHandlerRootView` (`src/app/_layout.tsx:106`), so `GestureDetector` works app-wide.
  - `useHaptics` (`src/hooks`, mocked in tests) is already consumed by `details.tsx` (`haptics.impact()` on refresh), available to add tactile feedback on dismiss.
  - Dependencies present: `react-native-gesture-handler` `~2.31.1` and `react-native-reanimated` `4.3.1` (`package.json`).
- **User impact:** Users get a faster, more native way to leave Details (drag down anywhere the pan is free to activate) while keeping the existing back button. No change to what data is shown.
- **Dependencies:** None new. Uses the already-installed `react-native-gesture-handler` (`Gesture.Pan`, `GestureDetector`) and `react-native-reanimated` (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `interpolate`, `runOnJS`).

## Data Model

N/A — This is a presentational gesture/animation feature. No new or changed types, persistence, stores, or query keys.

## Interfaces / API

### `SwipeToDismiss` (new presentational component) — `src/components/SwipeToDismiss.tsx`

```ts
interface SwipeToDismissProps {
  /** Called after the dismiss animation completes (e.g. router.back). */
  onDismiss: () => void;
  children: React.ReactNode;
  /** Fraction of screen height a downward drag must exceed to commit. Default 0.25. */
  dismissDistanceRatio?: number;
  /** Downward fling velocity (px/s) that commits regardless of distance. Default 800. */
  velocityThreshold?: number;
  testID?: string;
}

export function SwipeToDismiss(props: SwipeToDismissProps): JSX.Element;
```

Behavior contract:

- Wraps `children` in a `GestureDetector` driven by a `Gesture.Pan()` configured with `.activeOffsetY(15)` (activate only after a clear downward drag) and `.failOffsetY(-15)` (fail on upward motion so it never captures upward scrolls).
- Tracks a `translateY` shared value clamped to `>= 0` (downward only). `onUpdate` sets `translateY = Math.max(0, event.translationY)`.
- `onEnd`: commit when `shouldDismiss(translationY, velocityY, screenHeight * dismissDistanceRatio, velocityThreshold)` is true — animate `translateY` to `screenHeight` with `withTiming` and call `onDismiss` via `runOnJS` on completion; otherwise `withSpring` back to `0`.
- Renders an absolutely-positioned dark backdrop behind the animated content whose opacity is `interpolate`d from `translateY` so it visibly dims/reveals as the content moves.
- Pure and hook-light: it takes `onDismiss` and does not import `@/hooks` or navigation, so haptics/back are wired by the caller.

### `shouldDismiss` (new pure helper) — `src/utils/dismissGesture.ts`

```ts
export function shouldDismiss(
  translationY: number,
  velocityY: number,
  dismissDistance: number,
  velocityThreshold: number,
): boolean;
```

- Returns `true` when `translationY >= dismissDistance` OR `velocityY >= velocityThreshold`; otherwise `false`. Extracted so the commit decision is unit-testable without driving the gesture. A `'worklet'` directive is added so it can be called from the gesture callback on the UI thread.

## Files Created

| File                                           | Purpose                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/SwipeToDismiss.tsx`            | Reusable pan-to-dismiss wrapper: pan gesture, translateY animation, dimming backdrop, snap-back. |
| `src/utils/dismissGesture.ts`                  | Pure `shouldDismiss` commit-decision helper (worklet-safe).                                      |
| `src/tests/utils/dismissGesture.test.ts`       | Unit tests for `shouldDismiss` across distance/velocity/edge thresholds.                         |
| `src/tests/components/SwipeToDismiss.test.tsx` | Render test: children and `testID` render; `onDismiss` is not called on mount.                   |

## Files Modified

| File                             | Change                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/index.ts`        | Re-export `SwipeToDismiss`.                                                                                                                                                                                                                                           |
| `src/app/details.tsx`            | Wrap the loaded-content return (`src/app/details.tsx:125-156`) in `<SwipeToDismiss onDismiss={handleDismiss}>`, where `handleDismiss` fires `haptics.impact()` then `router.back()`. Error/loading branches remain unchanged.                                         |
| `src/tests/setup.ts`             | Extend the `react-native-reanimated` mock with `withSpring`, `interpolate`, `runOnJS`, and `Extrapolation`; add a global passthrough mock for `react-native-gesture-handler` (`GestureDetector` renders children; `Gesture.Pan()` returns a chainable no-op builder). |
| `src/tests/app/details.test.tsx` | No behavioral assertion change expected; add the gesture mocks only if not covered globally by `setup.ts`, and confirm the loaded-state tests still find `daily-forecast`/header content through the wrapper.                                                         |

## Implementation Steps

1. Create `src/utils/dismissGesture.ts` with the worklet-safe `shouldDismiss` helper.
2. Add `src/tests/utils/dismissGesture.test.ts` covering: below both thresholds → false; distance met → true; velocity met → true; exact-boundary values; negative/zero inputs.
3. Create `src/components/SwipeToDismiss.tsx`:
   - `useSharedValue(0)` for `translateY`; `useWindowDimensions()` for `screenHeight`.
   - `Gesture.Pan()` with `.activeOffsetY(15)`, `.failOffsetY(-15)`, `onUpdate` (clamp downward), and `onEnd` (call `shouldDismiss`; commit with `withTiming` + `runOnJS(onDismiss)` or spring back).
   - `useAnimatedStyle` for content `translateY`; `interpolate` a backdrop opacity from `translateY`.
   - Render `GestureDetector` → animated backdrop + `Animated.View` content; forward `testID`. Use `theme` tokens for layout; use an explicit `rgba(0,0,0,0.4)` scrim (see Style & Conventions).
4. Re-export `SwipeToDismiss` from `src/components/index.ts`.
5. Wire into `src/app/details.tsx`: add `const handleDismiss = () => { haptics.impact(); router.back(); }` and wrap the success return in `<SwipeToDismiss onDismiss={handleDismiss}>`. Keep `DetailsHeader`'s back button.
6. Extend `src/tests/setup.ts`: add `withSpring`/`interpolate`/`runOnJS`/`Extrapolation` to the reanimated mock and a global `react-native-gesture-handler` passthrough mock.
7. Add `src/tests/components/SwipeToDismiss.test.tsx`: renders children + `testID`, and asserts `onDismiss` is not called on mount.
8. Confirm `src/tests/app/details.test.tsx` still passes through the new wrapper (adjust only mocks, not expectations).
9. Run repository verification:
   - `npx tsc --noEmit`
   - `pnpm run lint`
   - `pnpm test`

## Style & Conventions

- Follows `CLAUDE.md`: functional component with a named export, one component per file re-exported from `src/components/index.ts`; strict TypeScript; `@/` path aliases; `StyleSheet.create` with `@/theme` tokens; pure helpers in `src/utils/` with tests mirrored under `src/tests/`.
- Mirrors the established gesture/animation approach in `src/components/SavedLocationItem.tsx` (reanimated shared values + animated transforms), extended from `translateX`/`ReanimatedSwipeable` to a `translateY` `Gesture.Pan`.
- Per `CLAUDE.md`, the React Compiler is enabled, so no manual `useMemo`/`useCallback`/`React.memo`.
- Deliberate deviation: the dimming scrim uses a literal `rgba(0,0,0,0.4)` rather than a theme token, because `src/theme/index.ts` has no dark/black overlay token (`overlay` is navy `rgba(42,67,101,0.95)`); a true dim needs black. Introduce the literal locally rather than repurposing a mismatched token.

## Acceptance Criteria

- [ ] `SwipeToDismiss` renders its children and forwards `testID`, wrapping them in a `GestureDetector` with a downward-only `Gesture.Pan` (`activeOffsetY`/`failOffsetY`).
- [ ] Dragging the Details screen down past `dismissDistanceRatio` of the screen height, or flinging faster than `velocityThreshold`, calls `onDismiss` (which triggers `haptics.impact()` then `router.back()`); a smaller drag springs back to rest without dismissing.
- [ ] A dark backdrop behind the content dims/reveals as `translateY` changes.
- [ ] `DailyForecastList` vertical scrolling and pull-to-refresh continue to work (the pan does not capture upward or in-list scroll gestures).
- [ ] `DetailsHeader`'s back button still dismisses the screen.
- [ ] `shouldDismiss` unit tests cover distance-met, velocity-met, below-both, and boundary cases.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass with zero type errors or lint warnings.

## Constraints

- **Scope boundaries:** Adds dismissal only on the Details screen. It does not add a shared-element or expand-from-card transition (that is a separate roadmap feature), and does not change the stack's global `animation: 'fade'` config in `src/app/_layout.tsx`.
- **Gesture coexistence:** Downward-only, activation-gated (`activeOffsetY(15)`, `failOffsetY(-15)`) to avoid fighting the `DailyForecastList` `FlatList` scroll and pull-to-refresh. Because the top region (header + summary + pressure card) is non-scrollable, that area drags freely; commit behavior while the list is mid-scroll is intentionally conservative (list scroll wins) and is an accepted limitation.
- **Android-first:** Animations run on the UI thread via reanimated worklets; verified against Android behavior. Per project memory, native builds are run by the user, so verification here is limited to `tsc`, lint, and Vitest — the gesture feel is confirmed manually on device.
- **Non-goals:** No horizontal swipe, no dismiss on the loading/error branches, no configurable dismiss direction, and no persisted state.

```

```
