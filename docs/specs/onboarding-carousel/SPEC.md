# Feature: Onboarding Carousel

## Intent

First-time users see a 3-slide swipeable carousel explaining search, saving locations, and weather alerts before reaching the login screen, with animated page-indicator dots and a "Get Started" action; the carousel is never shown again after being completed, on this or any subsequent launch.

## Context

- **Problem statement:**
  - The app currently drops every user straight onto `login.tsx` with no explanation of what the app does. There is no first-run experience anywhere in the routing tree (`src/app/_layout.tsx:75-102`), and no persisted "have I seen this" flag exists in any store.
- **Current code:**
  - `src/app/_layout.tsx`: `RootApp` blocks on `initializing` (from `useAuth()`) with a full-screen `ActivityIndicator`, then renders a headerless `Stack` with two `Stack.Protected` groups: `guard={isAuthenticated}` (`index`, `details`, `settings`, `saved`, `map`) and `guard={!isAuthenticated}` (`login`). Splash screen is hidden and `markInteractive()` fires once `!initializing` (`:58-63`).
  - `src/app/login.tsx`: the pattern to follow for a screen with no navigation prop wiring — on success, a global store flip (`useAuthStore`) causes `Stack.Protected` to swap routes automatically; no `router.push`/`router.replace` call is needed.
  - Persisted client-state flags already follow one shape across the codebase: a Zustand store created with `persist(...)` + `createJSONStorage(() => AsyncStorage)`, one file per store in `src/store/`, re-exported nowhere (stores are imported directly, there is no `src/store/index.ts` barrel). See `src/store/useSettingsStore.ts` and `src/store/useSearchStore.ts`.
  - No store in the repo currently gates a route on AsyncStorage rehydration completing; `RootApp` only waits on Firebase's `initializing` flag. Gating the initial route on a _second_ async flag (onboarding rehydration) requires extending that same loading guard, or first-run users could flash the onboarding slide open-and-shut on returning launches while AsyncStorage resolves.
  - `src/services/i18n.ts` holds all UI strings as flat keys per locale (`en`, `ja`) in a single `translations` object; `t(key, options)` is the shorthand accessor. There is no separate locale JSON file.
  - `src/theme/index.ts` centralizes colors/spacing/radii/typography; `theme.colors.background` (`#5494D6`) is the standard screen background used by `login.tsx`.
  - Icons use `expo-symbols`' `SymbolView` with `{ ios, android }` name pairs; `SymbolName` type is exported from `src/utils/weatherMapper.ts:6`. Existing icon choices to reuse: search (`SearchHeader.tsx:54` — `{ ios: 'magnifyingglass', android: 'search' }`), save (`DetailsHeader.tsx:96` — `{ ios: 'bookmark.fill'/'bookmark', android: 'bookmark_border' }`).
  - `react-native-reanimated` (v4.3.1) and `react-native-gesture-handler` are already dependencies and are mocked in `src/tests/setup.ts:105-150` (`useSharedValue`, `useAnimatedStyle`, `interpolate`, `Extrapolation`, etc.) — no `useAnimatedScrollHandler` or `Animated.FlatList`/`createAnimatedComponent` mock exists.
  - No paging/carousel library (`react-native-reanimated-carousel`, `react-native-pager-view`) is in `package.json`. A plain `FlatList` with `pagingEnabled` (as already used non-paged in `DailyForecastList.tsx:70-77`) is the smaller, dependency-free option and is chosen over adding a new native package.
- **User impact:** First-time users get a short, skippable-by-design (no skip link; see Constraints) explanation of the app's three core capabilities before signing in. Returning users never see it again.
- **Dependencies:** None beyond what's already installed (`react-native-reanimated`, `react-native-gesture-handler`, `@react-native-async-storage/async-storage`, `zustand`, `expo-symbols`). No new native module, no config plugin, no `app.json` change.

## Data Model

### `useOnboardingStore` (new) — `src/store/useOnboardingStore.ts`

```ts
interface OnboardingStore {
  hasCompletedOnboarding: boolean; // persisted; default false
  hasHydrated: boolean; // NOT persisted meaningfully; true once AsyncStorage rehydration has run
  completeOnboarding: () => void; // sets hasCompletedOnboarding = true
  setHasHydrated: (hydrated: boolean) => void;
}
```

- Persisted via `zustand/middleware` `persist` + `createJSONStorage(() => AsyncStorage)`, `name: 'onboarding-storage'` — same shape as `useSettingsStore`/`useSearchStore`.
- `hasHydrated` starts `false` on every process start (the in-memory initializer), and is flipped to `true` by an `onRehydrateStorage` callback once AsyncStorage read completes (mirrors the async nature of `useAuthStore.initializing`, but driven by the persist middleware's own lifecycle instead of Firebase).
- No relational/DB changes. No changes to existing stores' shape.

## Interfaces / API

### `useOnboardingStore` — `src/store/useOnboardingStore.ts`

- `useOnboardingStore.getState().hasCompletedOnboarding: boolean`
- `useOnboardingStore.getState().completeOnboarding(): void` — one-way flip, no "reset" action (not needed by any current screen).

### `OnboardingSlide` (presentational) — `src/components/OnboardingSlide.tsx`

```ts
interface OnboardingSlideProps {
  icon: SymbolName; // from '@/utils/weatherMapper'
  title: string;
  description: string;
  width: number; // slide width = window width, passed down so each page fills the FlatList viewport
  testID?: string;
}

export function OnboardingSlide(props: OnboardingSlideProps): JSX.Element;
```

- Renders a centered `SymbolView` (size 96, `theme.colors.accent` tint), a title `Text`, and a description `Text`, inside a `View` of `{ width }`.

### `OnboardingPagination` (presentational) — `src/components/OnboardingPagination.tsx`

```ts
interface OnboardingPaginationProps {
  scrollX: SharedValue<number>; // reanimated shared value tracking FlatList horizontal offset
  count: number;
  slideWidth: number;
  testID?: string;
}

export function OnboardingPagination(props: OnboardingPaginationProps): JSX.Element;
```

- Renders `count` dot `Animated.View`s. Each dot's `width`/`opacity`/`backgroundColor` is computed with `useAnimatedStyle` + `interpolate(scrollX.value, [(i-1)*slideWidth, i*slideWidth, (i+1)*slideWidth], ...)` per-index, giving the "grows and brightens as its slide centers" animated effect without `useAnimatedScrollHandler`.
- `scrollX` is updated from a plain (non-worklet) `FlatList` `onScroll` handler (`scrollEventThrottle={16}`) in the parent screen — assigning to `.value` from JS is supported by reanimated and requires no new test mock.

### `src/app/onboarding.tsx` (screen, default export, no props — route screen)

- Local `ONBOARDING_SLIDES` array of 3 entries `{ id, icon, titleKey, descriptionKey }` resolved through `t()` at render time (so language switches — unlikely mid-onboarding, but the existing i18n subscription model makes it free).
- Horizontal `FlatList` (`pagingEnabled`, `horizontal`, `showsHorizontalScrollIndicator={false}`, `bounces={false}`, `keyExtractor` by `id`) rendering `OnboardingSlide` per item, sized to `useWindowDimensions().width`.
- Local `activeIndex` React state, updated in `onMomentumScrollEnd` via `Math.round(offsetX / width)`.
- Bottom action row:
  - `activeIndex < 2`: a "Next" button (`t('onboardingNext')`) that calls `flatListRef.current?.scrollToIndex({ index: activeIndex + 1 })`.
  - `activeIndex === 2`: a full-width "Get Started" button (`t('onboardingGetStarted')`, `testID="onboarding-get-started"`) that calls `useOnboardingStore.getState().completeOnboarding()`. No `router` call — per the `login.tsx` pattern, flipping the store causes `Stack.Protected` in `_layout.tsx` to swap the visible route.
- `OnboardingPagination` rendered between the pager and the action row.

## Files Created

| File                                                 | Purpose                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/store/useOnboardingStore.ts`                    | Persisted `hasCompletedOnboarding` flag + `hasHydrated` rehydration flag.       |
| `src/app/onboarding.tsx`                             | The 3-slide paged carousel screen shown before login on first launch.           |
| `src/components/OnboardingSlide.tsx`                 | Single slide: icon, title, description.                                         |
| `src/components/OnboardingPagination.tsx`            | Animated page-indicator dots driven by horizontal scroll offset.                |
| `src/tests/store/useOnboardingStore.test.ts`         | Unit tests for default state, `completeOnboarding`, and hydration flag flip.    |
| `src/tests/app/onboarding.test.tsx`                  | Unit tests for slide rendering, swipe/Next paging, and the Get Started action.  |
| `src/tests/components/OnboardingSlide.test.tsx`      | Unit tests for `OnboardingSlide` rendering icon/title/description and `testID`. |
| `src/tests/components/OnboardingPagination.test.tsx` | Unit tests for dot count and `testID`s per index.                               |

## Files Modified

| File                      | Change                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/_layout.tsx`     | Read `hasCompletedOnboarding`/`hasHydrated` from `useOnboardingStore`; extend the loading gate to `initializing \|\| !hasHydrated`; add a `Stack.Protected guard={!hasCompletedOnboarding}` group with `<Stack.Screen name="onboarding" />` ahead of the existing groups, and AND `hasCompletedOnboarding` into the existing two guards; extend the splash-hide effect's condition/deps to include `hasHydrated`. |
| `src/components/index.ts` | Re-export `OnboardingSlide` and `OnboardingPagination`.                                                                                                                                                                                                                                                                                                                                                           |
| `src/services/i18n.ts`    | Add `onboardingSearchTitle`, `onboardingSearchDescription`, `onboardingSaveTitle`, `onboardingSaveDescription`, `onboardingAlertsTitle`, `onboardingAlertsDescription`, `onboardingNext`, `onboardingGetStarted` keys for both `en` and `ja`.                                                                                                                                                                     |

## Implementation Steps

1. Create `src/store/useOnboardingStore.ts` following the `useSettingsStore.ts` shape: `persist` + `createJSONStorage(() => AsyncStorage)`, `name: 'onboarding-storage'`, plus an `onRehydrateStorage` callback that calls `setHasHydrated(true)` once loading finishes.
2. Add the new translation keys (English then Japanese) to `src/services/i18n.ts`, grouped under a `// onboarding` comment near the `// login` section.
3. Create `src/components/OnboardingSlide.tsx`: presentational component per the Interfaces section, styled with `theme` tokens, background-agnostic (parent screen owns the background color).
4. Create `src/components/OnboardingPagination.tsx`: dots driven by `interpolate` on the passed-in `scrollX` shared value, per-dot `useAnimatedStyle`.
5. Create `src/app/onboarding.tsx`: wire the `FlatList`, `activeIndex` state, `scrollX` shared value (`useSharedValue(0)`), `onScroll` handler assigning `scrollX.value = e.nativeEvent.contentOffset.x`, `onMomentumScrollEnd` updating `activeIndex`, the Next/Get Started action row, and `OnboardingPagination`. Match `login.tsx`'s `StatusBar`/`SafeAreaView`-less `ScrollView`/`View` container convention and `theme.colors.background`.
6. Re-export `OnboardingSlide` and `OnboardingPagination` from `src/components/index.ts`.
7. Update `src/app/_layout.tsx`:
   - Import `useOnboardingStore`.
   - Read `hasCompletedOnboarding` and `hasHydrated`.
   - Change the loading-guard condition (currently `if (initializing)`) to `if (initializing || !hasHydrated)`.
   - Update the splash-hide `useEffect` condition to `if (!initializing && hasHydrated)` and add `hasHydrated` to its dependency array.
   - Add `<Stack.Protected guard={!hasCompletedOnboarding}><Stack.Screen name="onboarding" /></Stack.Protected>` before the existing two groups, and change their guards to `hasCompletedOnboarding && isAuthenticated` / `hasCompletedOnboarding && !isAuthenticated`.
8. Write `src/tests/store/useOnboardingStore.test.ts`: default `hasCompletedOnboarding: false`, `completeOnboarding()` flips it to `true`, hydration flag behavior, following the mocking pattern in `src/tests/store/useSettingsStore.test.ts` (mock `@react-native-async-storage/async-storage`).
9. Write `src/tests/components/OnboardingSlide.test.tsx` and `OnboardingPagination.test.tsx` following the existing component test conventions (`@testing-library/react`, `vi.mock('expo-symbols', ...)`).
10. Write `src/tests/app/onboarding.test.tsx`: mock `@/store/useOnboardingStore`, assert slide 1 content renders first, that pressing "Next" twice reaches the "Get Started" button (via simulated `onMomentumScrollEnd` events, or by asserting the button swaps once `activeIndex` state changes through the exposed handlers), and that pressing "Get Started" calls `completeOnboarding`.
11. Update or add a `_layout.tsx`-adjacent test if one exists (none currently does — root layout is not under `src/tests/app/` today) — skip if no test file covers `_layout.tsx`; otherwise add one covering the new guard/gating logic.
12. Run repository verification commands:
    - `npx tsc --noEmit`
    - `pnpm run lint`
    - `pnpm test`

## Style & Conventions

- Follows `CLAUDE.md`: functional components, one component per file re-exported from `src/components/index.ts`, `@/` path aliases, `StyleSheet.create`, design tokens from `@/theme` (no hardcoded colors/spacing).
- Store follows the exact `persist` + `createJSONStorage(() => AsyncStorage)` shape already used by `useSettingsStore`/`useSearchStore` — no new persistence pattern introduced.
- Route gating follows the existing `Stack.Protected` + store-flip-swaps-route pattern from `login.tsx`/`_layout.tsx` — no manual `router.push`/`router.replace` calls added.
- i18n additions follow the existing flat-key, `en`/`ja` parallel-structure convention in `src/services/i18n.ts`.
- Icons reuse `SymbolName` from `@/utils/weatherMapper` and existing icon choices (search, bookmark) where the concept overlaps with an existing screen, per repository convention of icon consistency.
- React Compiler (`reactCompiler` experiment, `app.json`) is enabled — no hand-written `useMemo`/`useCallback`/`React.memo`.

## Acceptance Criteria

- [ ] On first launch (no persisted `onboarding-storage` value), the app shows the onboarding carousel before `login.tsx`, regardless of auth state.
- [ ] The carousel has exactly 3 slides covering search, saving locations, and alerts, each swipeable via a paged horizontal `FlatList`.
- [ ] Page-indicator dots animate (size/opacity/color) as the user swipes between slides.
- [ ] A "Get Started" button is shown on the final slide; pressing it persists `hasCompletedOnboarding: true` and the app immediately routes to `login` (or the authenticated app, if already signed in).
- [ ] On every subsequent launch, the onboarding carousel is skipped entirely — the app goes straight to `login`/authenticated routes with no visible flash of the onboarding screen.
- [ ] `useOnboardingStore` unit tests pass: default state, `completeOnboarding`, hydration flag.
- [ ] `OnboardingSlide`, `OnboardingPagination`, and `onboarding.tsx` unit tests pass.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` all pass with zero errors.

## Constraints

- **Scope boundaries:** Onboarding is shown once, gated purely by the persisted `hasCompletedOnboarding` flag. No account-linked/cloud-synced onboarding state (a fresh app install always sees it again, even for a previously-onboarded account) — matches the local-first nature of every other AsyncStorage-backed flag in this app.
- **No skip link:** the feature request specifies a "Get Started" button only; there is deliberately no "Skip" affordance, keeping the 3-slide flow short by design rather than adding an early-exit control.
- **No new dependency:** a plain `pagingEnabled` `FlatList` is used instead of `react-native-reanimated-carousel` or `react-native-pager-view`, since reanimated + gesture-handler already cover the animation needs and no native/config-plugin change is justified for 3 static slides.
- **Non-goals:** no server-side/account-level onboarding tracking, no per-slide deep-linking, no A/B-testable slide content, no analytics events (Crashlytics breadcrumbs) for onboarding progress — none of this was requested and the existing observability hooks are not wired to onboarding.
- **Rehydration race:** the loading gate now waits on two async signals (`initializing` from Firebase, `hasHydrated` from the onboarding store) before hiding the splash screen; this is a deliberate, small addition to an existing gate rather than a new loading UI.
