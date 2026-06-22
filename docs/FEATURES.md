# Overview

A progress tracker for the Expo Weather app, mapped to the [roadmap.sh/react-native](https://roadmap.sh/react-native) topics.

> **How to use:** Check off each feature as it's implemented, `[ ]` becomes `[x]`. Tackle them in the order under **Implementation Order** at the bottom.

## Progress

`3 / 10 implemented`

---

## What the app does today

- **Home** (`src/app/index.tsx`): auto-detects location → shows current temp/condition, plus a search bar whose `searchQuery` state is wired to a `TextInput` but **does nothing** (no submit handler, no geocoding).
- **Details** (`src/app/details.tsx`): current humidity/wind/UV + 8-day forecast list.
- **Stack**: TanStack Query (caching), Axios client, `expo-location`, Open-Meteo. Tests via Vitest. Reanimated + Gesture Handler are installed but essentially unused. No persistence, no settings, no offline story.

---

## Features I Plan to Build

### 1. Make the search bar work: city search & geocoding

- [x] **Implemented**
- **Why:** It's the most glaring gap, a visible input that does nothing. Lets users check weather anywhere, not just GPS. High impact, the data layer already supports arbitrary lat/lon.
- **Roadmap:** Forms & user input · Networking (Open-Meteo Geocoding API) · State management (debounced query)
- **Complexity:** Easy–Medium

### 2. Saved locations / favorites with local persistence

- [x] **Implemented**
- **Why:** The natural follow-up to search, pin multiple cities and switch between them. This is _the_ defining feature of every production weather app.
- **Roadmap:** **Local storage** (AsyncStorage or MMKV), currently the app has zero persistence, a notable roadmap gap · Lists
- **Complexity:** Medium

### 3. Settings: units (°C/°F, km/h vs mph) + persisted preference

- [x] **Implemented**
- **Why:** Temperature is hardcoded `°C` and wind `km/h`. Unit toggle is expected baseline functionality and forces a clean separation of formatting from data.
- **Roadmap:** Local storage · State management (global/context) · Forms
- **Complexity:** Easy

### 4. Pull-to-refresh + last-updated timestamp

- [ ] **Implemented**
- **Why:** Weather data is time-sensitive. The `refetch()` from TanStack Query is already available, so wiring `RefreshControl` is a small change with obvious UX value.
- **Roadmap:** Lists / ScrollView · Networking (cache invalidation)
- **Complexity:** Easy

### 5. Hourly forecast (horizontal scroll)

- [ ] **Implemented**
- **Why:** Open-Meteo exposes `hourly` data you're not requesting yet. A horizontal `FlatList` of the next 24h complements the existing daily view and exercises list-rendering skills.
- **Roadmap:** Lists (horizontal FlatList / FlashList) · Networking
- **Complexity:** Medium

### 6. Offline support: persisted query cache

- [ ] **Implemented**
- **Why:** Mobile apps must degrade gracefully without a network. TanStack Query has a persister; combined with #2's storage, you can show last-known data offline.
- **Roadmap:** **Offline handling** + `@react-native-community/netinfo` to detect connectivity · Storage
- **Complexity:** Medium

### 7. Animated weather transitions / hero icon

- [ ] **Implemented**
- **Why:** Reanimated 4 and Gesture Handler are already in `package.json` but unused. Animate the temperature count-up or icon entrance; add a swipe gesture to move between saved cities.
- **Roadmap:** **Animations (Reanimated)** · Gestures (Gesture Handler), directly reinforces installed-but-unpracticed skills
- **Complexity:** Medium

### 8. Dynamic theming by condition / time of day

- [ ] **Implemented**
- **Why:** The background is a hardcoded `#1A237E` in three places. Drive it from `weather_code` + day/night so a sunny midday differs from a stormy night. Visually impressive, low risk.
- **Roadmap:** Styling · Theming (could fold in `useColorScheme` for light/dark)
- **Complexity:** Easy–Medium

### 9. Weather alerts via push / local notifications

- [ ] **Implemented**
- **Why:** "Rain expected at 3pm" or daily morning summary. The repo already depends on `expo-device`; add `expo-notifications`.
- **Roadmap:** **Push notifications** · Device permissions · Background tasks (`expo-task-manager` / `expo-background-fetch`)
- **Complexity:** Hard

### 10. Error boundary + graceful permission-denied flow

- [ ] **Implemented**
- **Why:** Currently a denied location permission throws a raw `Error.message`. A React error boundary plus a dedicated "enable location / search manually" empty-state is production hygiene.
- **Roadmap:** Error handling · Debugging · Permissions
- **Complexity:** Easy

---

## Implementation Order

|  Order  | Feature                                   | Complexity  | Done |
| :-----: | ----------------------------------------- | ----------- | :--: |
|    1    | #1 Search bar: city search & geocoding    | Easy–Medium | [x]  |
|    2    | #3 Settings: units + persisted preference | Easy        | [x]  |
|    3    | #4 Pull-to-refresh + last-updated         | Easy        | [ ]  |
|    4    | #2 Saved locations / favorites            | Medium      | [x]  |
|    5    | #5 Hourly forecast                        | Medium      | [ ]  |
|    6    | #8 Dynamic theming                        | Easy–Medium | [ ]  |
|    7    | #6 Offline support                        | Medium      | [ ]  |
|    8    | #7 Animated transitions                   | Medium      | [ ]  |
|    9    | #9 Weather alerts / push                  | Hard        | [ ]  |
| Anytime | #10 Error boundary (slot in as needed)    | Easy        | [ ]  |

---

## Expo Application Services (EAS)

Beyond app features, I'm also tracking the EAS workflow so the app can be built, shipped, and updated like a real production app. This maps to the **Deployment & Build** topics on the roadmap.

- [ ] **EAS Build**: cloud builds for iOS and Android via `eas build` (no local Xcode/Android Studio toolchain needed)
- [ ] **EAS Submit**: automated submission to the App Store and Google Play with `eas submit`
- [ ] **EAS Update**: over-the-air (OTA) JS updates without a full store release
- [ ] **EAS Workflows / CI**: automate build, test, and deploy pipelines (`.eas/workflows/`)
- [ ] **EAS Hosting**: host the web export and any Expo Router API routes
- [ ] **Build profiles & secrets**: configure `eas.json` profiles (development, preview, production) and store secrets / env vars in EAS
