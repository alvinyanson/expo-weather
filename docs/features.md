# Feature Roadmap for expo-weather

A curated backlog of features to implement as part of a React Native learning journey, mapped to the topics in the [React Native roadmap](https://roadmap.sh/react-native). Every idea is scoped for **Android only** and prefers **Expo libraries**. Features that duplicate what the app already ships are intentionally excluded; each idea below builds on the existing architecture instead.

## Table of Contents

- [How to Read This Document](#how-to-read-this-document)
- [What the App Already Has](#what-the-app-already-has)
- [Feature Catalog](#feature-catalog)
  - [1. Native Device APIs](#1-native-device-apis)
  - [2. Maps and Location](#2-maps-and-location)
  - [3. Animations and Gestures](#3-animations-and-gestures)
  - [4. Data Visualization and UI](#4-data-visualization-and-ui)
  - [5. Storage and Offline](#5-storage-and-offline)
  - [6. Notifications and Background Tasks](#6-notifications-and-background-tasks)
  - [7. Navigation and Deep Linking](#7-navigation-and-deep-linking)
  - [8. State Management and Architecture](#8-state-management-and-architecture)
  - [9. Networking](#9-networking)
  - [10. Performance](#10-performance)
  - [11. Permissions and Security](#11-permissions-and-security)
  - [12. Accessibility and Internationalization](#12-accessibility-and-internationalization)
  - [13. Testing and Debugging](#13-testing-and-debugging)
- [Prioritized Lists](#prioritized-lists)
  - [Beginner Features](#beginner-features)
  - [Intermediate Features](#intermediate-features)
  - [Advanced Features](#advanced-features)
- [Top 10 Recommendations](#top-10-recommendations)

---

## How to Read This Document

Each feature entry contains:

- **Description**: what the feature does
- **Why it is useful**: the value it adds to the app
- **Concepts learned**: the roadmap topics it exercises
- **Difficulty**: Beginner, Intermediate, or Advanced
- **Estimated time**: rough solo implementation time
- **Fit**: how naturally it slots into the current app
- **Libraries**: recommended packages, Expo-first

Difficulty assumes familiarity with the patterns already present in this codebase (TanStack Query, Zustand, expo-router, the service to hook to screen data flow).

---

## What the App Already Has

To avoid duplicate suggestions, these are considered done and are treated as foundations to build on:

- **Navigation**: expo-router file-based routing, protected routes gated by auth, headerless stack with fade transitions
- **Auth**: Firebase Auth with Google Sign-In, anonymous sign-in, and sign-out
- **Server state**: TanStack Query v5 with AsyncStorage persistence and a 24h cache
- **Client state**: Zustand stores for auth, settings, search, and connectivity, with persistence
- **Cloud data**: Firestore-backed saved locations with optimistic updates
- **Offline**: NetInfo bridged into TanStack Query onlineManager plus an offline banner
- **Notifications**: Expo push token registration, listeners, and a settings toggle
- **Observability**: Crashlytics with test crash and non-fatal hooks, plus expo-observe metrics
- **i18n**: i18n-js with expo-localization, English and Japanese
- **Gestures and animation**: react-native-reanimated and gesture-handler powering swipe-to-delete and the offline banner
- **Location**: expo-location GPS with reverse geocoding
- **Settings**: temperature unit, wind speed unit, language, alert toggle
- **Search**: debounced geocoding search with recent searches
- **Quality**: Vitest unit tests, Maestro E2E flows, oxlint, Prettier, EAS Updates

---

## Feature Catalog

### 1. Native Device APIs

- **Haptic Feedback on Key Actions**
  - **Description**: Trigger light and medium haptic taps when saving or removing a location, toggling settings, and completing a pull-to-refresh. Wrap the calls in a small `useHaptics` hook so the whole app fires feedback consistently.
  - **Why it is useful**: Haptics make an app feel native and responsive, and this is one of the fastest ways to noticeably raise perceived polish.
  - **Concepts learned**: Expo native device APIs, custom hooks, side-effect encapsulation, Android vibration permission behavior.
  - **Difficulty**: Beginner
  - **Estimated time**: 2 to 3 hours
  - **Fit**: Excellent. Drops into the existing save button, toast flows, and settings toggles.
  - **Libraries**: `expo-haptics`

- **Share Weather Snapshot**
  - **Description**: Add a share button on the details screen that composes a short text summary (city, condition, current and high or low temperature) and opens the Android share sheet. Extend it later to capture the current weather card as an image and share the file.
  - **Why it is useful**: Sharing is a common real-world feature and teaches how React Native hands data off to other Android apps.
  - **Concepts learned**: Share API, view capture, file URIs, Android intents.
  - **Difficulty**: Beginner to Intermediate
  - **Estimated time**: 3 to 5 hours (text only), plus 3 hours for image capture
  - **Fit**: Very good. The details header already has an action row.
  - **Libraries**: React Native `Share`, `react-native-view-shot`, `expo-sharing`

- **Copy Coordinates to Clipboard**
  - **Description**: Long-press the city name to copy the current latitude and longitude to the clipboard and show a confirmation toast. A tiny feature, but a clean introduction to the clipboard API and long-press handling.
  - **Why it is useful**: Small quality-of-life win that teaches a native API with almost no surface area.
  - **Concepts learned**: Clipboard API, `onLongPress`, toast feedback.
  - **Difficulty**: Beginner
  - **Estimated time**: 1 hour
  - **Fit**: Good. Reuses the existing toast component.
  - **Libraries**: `expo-clipboard`

- **Barometric Pressure from Device Sensor**
  - **Description**: Read the device barometer and show live atmospheric pressure alongside the API forecast, with a note comparing the sensor reading to the forecast value. Not all Android devices have a barometer, so handle the unavailable case gracefully.
  - **Why it is useful**: Teaches sensor subscriptions and hardware capability detection, both common in real native apps.
  - **Concepts learned**: expo-sensors, subscription lifecycle and cleanup, feature detection, graceful degradation.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Good. Adds a card to the details screen.
  - **Libraries**: `expo-sensors`

- **Battery-Aware Refresh**
  - **Description**: When the device enters battery saver mode or drops below a threshold, reduce background and automatic refresh frequency and surface a subtle hint. Uses the battery state to adapt app behavior.
  - **Why it is useful**: Introduces adaptive behavior based on device state, a topic many tutorials skip.
  - **Concepts learned**: expo-battery, event subscriptions, conditional query configuration.
  - **Difficulty**: Intermediate
  - **Estimated time**: 3 to 4 hours
  - **Fit**: Moderate. Interacts with the TanStack Query refetch config.
  - **Libraries**: `expo-battery`

### 2. Maps and Location

- **Interactive Weather Map**
  - **Description**: Add a map screen that drops a marker at the current location and at each saved location, showing a small weather summary in a callout. Tapping a marker navigates to the details screen for that spot. This is the single biggest missing capability in a weather app.
  - **Why it is useful**: Maps are a cornerstone native feature and this ties directly into the existing saved locations data.
  - **Concepts learned**: Native map views, markers and callouts, map region state, Android Google Maps API key setup, coordinate handling.
  - **Difficulty**: Intermediate to Advanced
  - **Estimated time**: 8 to 12 hours
  - **Fit**: Excellent. Saved locations and GPS already provide the coordinates.
  - **Libraries**: `react-native-maps` (Expo config plugin) or `expo-maps`

- **Tap-to-Pick Location on Map**
  - **Description**: Let the user long-press anywhere on the map to fetch weather for that point, then optionally save it. Reverse geocode the tapped coordinates into a city name using the existing location service.
  - **Why it is useful**: Combines map interaction with the existing geocoding and save flow, reinforcing how features compose.
  - **Concepts learned**: Map press events, reverse geocoding, feature composition, optimistic mutations.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours (after the map screen exists)
  - **Fit**: Very good. Extends the map feature and reuses `useSavedLocations`.
  - **Libraries**: `react-native-maps`, `expo-location`

### 3. Animations and Gestures

- **Animated Weather Backgrounds**
  - **Description**: Replace the static navy background with a gradient and subtle particle or icon animation that reflects the current condition, for example drifting clouds for overcast or gentle rain streaks for showers. Drive the animation from the WMO weather code already mapped in `weatherMapper.ts`.
  - **Why it is useful**: A visually striking upgrade that teaches performant, declarative animation on the UI thread.
  - **Concepts learned**: Reanimated worklets, shared values, `withRepeat` and `withTiming`, driving animation from data, gradients.
  - **Difficulty**: Intermediate to Advanced
  - **Estimated time**: 8 to 12 hours
  - **Fit**: Excellent. The weather code and condition mapping already exist.
  - **Libraries**: `react-native-reanimated`, `expo-linear-gradient`, optionally `@shopify/react-native-skia`

- **Shared Element Transition to Details**
  - **Description**: Animate the current weather card so it expands smoothly into the details screen instead of a plain fade. The temperature and icon appear to move and grow into their new positions.
  - **Why it is useful**: Shared transitions are a hallmark of polished navigation and teach coordinated cross-screen animation.
  - **Concepts learned**: Reanimated shared element transitions, expo-router transition config, layout measurement.
  - **Difficulty**: Advanced
  - **Estimated time**: 6 to 10 hours
  - **Fit**: Good. The home to details navigation already exists.
  - **Libraries**: `react-native-reanimated`, `expo-router`

- **Swipe-Down-to-Dismiss Details**
  - **Description**: Add a pan gesture that lets the user drag the details screen down to dismiss it, with the background dimming as it moves and snapping back if the drag is too small. Mirrors the swipe-to-delete pattern already used on saved locations.
  - **Why it is useful**: Reinforces gesture-driven animation and interpolation, extending a pattern already in the codebase.
  - **Concepts learned**: Pan gesture handler, gesture-to-animation binding, interpolation, spring physics.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 7 hours
  - **Fit**: Very good. Builds directly on existing gesture-handler usage.
  - **Libraries**: `react-native-gesture-handler`, `react-native-reanimated`

- **Skeleton Loading States**
  - **Description**: Replace the full-screen spinner with animated skeleton placeholders that match the shape of the weather card and forecast list, using a shimmer effect. Show them while queries are loading.
  - **Why it is useful**: Skeletons reduce perceived load time and teach layout-matched loading UI.
  - **Concepts learned**: Reanimated shimmer loops, conditional rendering on query status, layout composition.
  - **Difficulty**: Beginner to Intermediate
  - **Estimated time**: 3 to 5 hours
  - **Fit**: Very good. Slots into the existing `isLoading` branches.
  - **Libraries**: `react-native-reanimated`, or `react-content-loader`

### 4. Data Visualization and UI

- **Hourly Temperature Chart**
  - **Description**: Render the next 24 hours of temperature as a smooth line or area chart on the details screen, with a precipitation-probability bar underneath. The hourly data is already fetched but currently underused.
  - **Why it is useful**: Charts are a common requirement and this surfaces data the API already returns.
  - **Concepts learned**: Charting libraries, mapping API arrays to chart series, responsive chart sizing, custom drawing.
  - **Difficulty**: Intermediate to Advanced
  - **Estimated time**: 6 to 10 hours
  - **Fit**: Excellent. Hourly data is already in the weather response.
  - **Libraries**: `victory-native` (Skia based) or `@shopify/react-native-skia` for a hand-drawn chart

- **Sunrise and Sunset Arc**
  - **Description**: Add the daily sunrise and sunset times from Open-Meteo and draw a sun-path arc showing the current position of the sun through the day. Include a day-length label.
  - **Why it is useful**: A satisfying custom-drawn UI element that teaches trigonometry-driven layout and expanding the API request.
  - **Concepts learned**: Extending the API query, SVG or Skia drawing, time and angle math, theming.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 8 hours
  - **Fit**: Very good. Add two fields to the existing forecast request.
  - **Libraries**: `react-native-svg` or `@shopify/react-native-skia`

- **Dynamic Theming and Dark Mode**
  - **Description**: Turn the fixed navy theme into a theme context that switches palettes based on time of day, current condition, or a user setting, and respects the Android system dark mode. Migrate the static `theme` object into a provider that components subscribe to.
  - **Why it is useful**: Theming is a core roadmap topic and this refactor teaches context-driven styling across the whole app.
  - **Concepts learned**: React Context, `useColorScheme`, dynamic StyleSheet patterns, design tokens, settings-driven UI.
  - **Difficulty**: Intermediate
  - **Estimated time**: 6 to 9 hours
  - **Fit**: Good. Requires touching many components but the token system already centralizes colors.
  - **Libraries**: none required, optionally `expo-system-ui` for the navigation bar

- **Onboarding Carousel**
  - **Description**: Show a short 3-slide swipeable intro on first launch that explains search, saving locations, and alerts, with animated page indicators and a Get Started button. Persist a flag so it only shows once.
  - **Why it is useful**: A classic first-run experience that teaches paged scrolling and one-time persisted state.
  - **Concepts learned**: Paged FlatList or a carousel library, animated pagination dots, AsyncStorage flags, conditional routing.
  - **Difficulty**: Beginner to Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Good. Fits before the login screen in the routing tree.
  - **Libraries**: `react-native-reanimated-carousel`, or a plain paged `FlatList`

### 5. Storage and Offline

- **Migrate Storage to MMKV**
  - **Description**: Replace AsyncStorage with MMKV for the Zustand persist layer and the TanStack Query persister, benchmarking read and write latency before and after. MMKV is synchronous and far faster.
  - **Why it is useful**: Teaches storage engine tradeoffs and how to swap a storage backend behind an interface.
  - **Concepts learned**: Synchronous vs async storage, MMKV, custom storage adapters for Zustand and TanStack Query, benchmarking.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Good. The persist adapters are already isolated.
  - **Libraries**: `react-native-mmkv`

- **Weather History Log with SQLite**
  - **Description**: Every time weather is fetched, store a snapshot in a local SQLite database, then add a history screen that lets the user see how conditions for a location changed over recent days. Query and aggregate the stored rows.
  - **Why it is useful**: Introduces a real relational store, the most powerful on-device storage option, with structured queries.
  - **Concepts learned**: expo-sqlite, schema and migrations, SQL queries, offline-first data, list rendering from a DB.
  - **Difficulty**: Advanced
  - **Estimated time**: 10 to 14 hours
  - **Fit**: Good. Hooks into the existing fetch flow as a side effect.
  - **Libraries**: `expo-sqlite`

- **Cache Weather Icons and Assets**
  - **Description**: Precache the weather icon set and any remote imagery so the app renders instantly offline, and add a settings row showing cache size with a clear-cache action. Uses the file system to manage a small asset cache.
  - **Why it is useful**: Teaches explicit cache management and file system access, complementing the query cache already present.
  - **Concepts learned**: expo-file-system, cache directories, expo-image caching, disk usage reporting.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Moderate. expo-image is already a dependency.
  - **Libraries**: `expo-file-system`, `expo-image`

### 6. Notifications and Background Tasks

- **Scheduled Daily Forecast Notification**
  - **Description**: Let the user pick a time in settings to receive a local notification each morning summarizing today's forecast for their current location. Schedule a repeating local notification and cancel or reschedule it when the time changes.
  - **Why it is useful**: Local scheduled notifications are distinct from the push notifications already implemented and are a very common app feature.
  - **Concepts learned**: Local notification scheduling, triggers, the time picker already installed, cancel and reschedule logic.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 7 hours
  - **Fit**: Excellent. `@react-native-community/datetimepicker` is already a dependency and the settings screen has an alert toggle.
  - **Libraries**: `expo-notifications`

- **Background Weather Refresh**
  - **Description**: Register a background task that periodically refreshes weather for the current location and fires a local notification only when conditions change significantly, for example rain starting within the hour. Runs even when the app is closed, within Android limits.
  - **Why it is useful**: Background execution is an advanced native topic and makes weather alerts genuinely useful.
  - **Concepts learned**: expo-background-task, expo-task-manager, background fetch constraints on Android, headless data fetching, deduping notifications.
  - **Difficulty**: Advanced
  - **Estimated time**: 10 to 14 hours
  - **Fit**: Good. Reuses the weather service and notification setup.
  - **Libraries**: `expo-background-task`, `expo-task-manager`, `expo-notifications`

- **Rich Notification Actions**
  - **Description**: Add action buttons to weather notifications, for example Save Location or View Details, and handle the response to deep link into the right screen. Category-based notifications with interactive buttons.
  - **Why it is useful**: Teaches the full notification response lifecycle and links notifications to navigation.
  - **Concepts learned**: Notification categories and actions, response listeners, routing from a notification, Android channels.
  - **Difficulty**: Intermediate to Advanced
  - **Estimated time**: 5 to 8 hours
  - **Fit**: Very good. Notification listeners already exist in `useNotificationListeners`.
  - **Libraries**: `expo-notifications`, `expo-router`

### 7. Navigation and Deep Linking

- **Deep Links to a City**
  - **Description**: Support opening the app to a specific city via a URL such as `expoweather://weather?lat=..&lon=..&city=..`, wiring it through to the details screen. Test with the Android intent tooling and from a shared link.
  - **Why it is useful**: Deep linking is essential for sharing and notifications and the app already has a URL scheme configured.
  - **Concepts learned**: expo-router linking config, URL parsing, initial URL handling, testing deep links on Android.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Excellent. The `expoweather` scheme is already declared in `app.json`.
  - **Libraries**: `expo-router`, `expo-linking`

- **Bottom Tab Navigation**
  - **Description**: Introduce a tab layout separating Home, Map, Saved, and Settings instead of pushing everything on a single stack. Refactor the current routes into a tabs group while keeping protected-route gating.
  - **Why it is useful**: Tabs are the most common navigation pattern and this teaches nested navigators and route groups.
  - **Concepts learned**: expo-router tabs and route groups, nested layouts, per-tab stacks, preserving auth guards.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 8 hours
  - **Fit**: Good. A structural change but the screens already exist.
  - **Libraries**: `expo-router`

### 8. State Management and Architecture

- **Multi-Location Home with Paged Cards**
  - **Description**: Turn the home screen into a horizontally paged view where each saved location is a full-screen card the user swipes between, with page dots and the GPS location as the first page. Each page runs its own weather query keyed by coordinates.
  - **Why it is useful**: A meaningful architecture upgrade that teaches parallel keyed queries and paged state, and it makes saved locations feel first-class.
  - **Concepts learned**: TanStack Query with multiple keyed queries, `useQueries`, paged FlatList, derived state, prefetching.
  - **Difficulty**: Advanced
  - **Estimated time**: 10 to 14 hours
  - **Fit**: Excellent. Saved locations and the weather hook already exist.
  - **Libraries**: `@tanstack/react-query`, `react-native-reanimated`

- **Reorder Saved Locations with Drag and Drop**
  - **Description**: Let the user long-press and drag saved locations into a preferred order, persisting the order to Firestore. The saved list already supports swipe-to-delete, so this rounds out list management.
  - **Why it is useful**: Drag-and-drop lists are a rich gesture and state exercise, and ordering is a real user need.
  - **Concepts learned**: Draggable lists, gesture-driven reordering, persisting order fields, optimistic updates to Firestore.
  - **Difficulty**: Advanced
  - **Estimated time**: 8 to 12 hours
  - **Fit**: Very good. Extends the existing saved locations feature.
  - **Libraries**: `react-native-draggable-flatlist`, `react-native-reanimated`

### 9. Networking

- **Air Quality and Pollen Panel**
  - **Description**: Add a dependent query against the Open-Meteo Air Quality API for PM2.5, ozone, and pollen, shown as a color-coded panel on the details screen. It runs after coordinates resolve, mirroring the existing dependent query pattern.
  - **Why it is useful**: Teaches integrating a second endpoint through the existing API client and dependent queries, with almost no backend cost.
  - **Concepts learned**: Dependent queries, the shared Axios client with an absolute URL, response typing, query key design.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Excellent. The API client is designed to accept absolute URLs for exactly this.
  - **Libraries**: `@tanstack/react-query`, `axios`

- **Retry with Exponential Backoff and Timeout UX**
  - **Description**: Add configurable retry with exponential backoff to weather requests, a request timeout, and a clear inline error state offering retry, distinguishing a timeout from a no-network state. Surface the difference to the user.
  - **Why it is useful**: Robust networking is a real-world skill and the current error handling is minimal.
  - **Concepts learned**: TanStack Query retry config, Axios timeouts and cancellation, error taxonomy, resilient UX.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Very good. Refines the existing query and interceptor setup.
  - **Libraries**: `@tanstack/react-query`, `axios`

### 10. Performance

- **Swap FlatList for FlashList**
  - **Description**: Replace the forecast and saved-location FlatLists with FlashList and measure the difference in scroll smoothness and memory, especially once the multi-location and history screens add longer lists. Document the before and after.
  - **Why it is useful**: Teaches list virtualization tradeoffs and profiling, a frequently tested performance topic.
  - **Concepts learned**: FlashList, estimated item size, recycling, measuring frame rate with expo-observe.
  - **Difficulty**: Beginner to Intermediate
  - **Estimated time**: 2 to 4 hours
  - **Fit**: Good. Direct swap of existing lists.
  - **Libraries**: `@shopify/flash-list`

- **Startup and Render Profiling Pass**
  - **Description**: Use expo-observe and the React DevTools profiler to measure cold start, time to interactive, and re-render counts, then fix the worst offenders, for example unnecessary re-renders or heavy work on the render path. Record findings in a short report.
  - **Why it is useful**: Profiling and optimization is a distinct roadmap skill and the app already ships expo-observe.
  - **Concepts learned**: expo-observe metrics, the profiler, React Compiler behavior, memoization tradeoffs, startup cost analysis.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 8 hours
  - **Fit**: Excellent. expo-observe is already a dependency.
  - **Libraries**: `expo-observe`

### 11. Permissions and Security

- **Biometric App Lock**
  - **Description**: Add an optional setting to require fingerprint or device credential unlock when the app opens or returns from the background, gating access to saved locations and account. Fall back to the device PIN when biometrics are unavailable.
  - **Why it is useful**: Teaches the local authentication flow and app-lifecycle-driven security, a common feature in real apps.
  - **Concepts learned**: expo-local-authentication, AppState transitions, secure gating, graceful fallback.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 7 hours
  - **Fit**: Good. Adds a settings toggle and a lifecycle listener.
  - **Libraries**: `expo-local-authentication`, `expo-secure-store`

- **Permission Rationale and Settings Redirect**
  - **Description**: Build a friendly permission flow for location that explains why access is needed before the system prompt, and when permission is permanently denied, deep link the user to the Android app settings page. Handle the denied and blocked states explicitly.
  - **Why it is useful**: Proper permission UX is a real requirement on Android and the current flow only throws on denial.
  - **Concepts learned**: Permission states (granted, denied, blocked), pre-permission rationale UI, `Linking.openSettings`, Android runtime permissions.
  - **Difficulty**: Beginner to Intermediate
  - **Estimated time**: 3 to 5 hours
  - **Fit**: Very good. Improves the existing `fetchCoordinates` flow.
  - **Libraries**: `expo-location`, React Native `Linking`

### 12. Accessibility and Internationalization

- **Full Accessibility Pass**
  - **Description**: Add accessibility labels, roles, and hints across the weather cards, buttons, and forecast rows, ensure focus order is logical, and verify the app with Android TalkBack. Announce dynamic updates such as a completed refresh.
  - **Why it is useful**: Accessibility is a professional baseline and a roadmap topic, and the app currently only marks a few icons.
  - **Concepts learned**: accessibilityLabel, role and state, live regions, TalkBack testing, dynamic font scaling.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 8 hours
  - **Fit**: Very good. Touches existing components without new screens.
  - **Libraries**: none, React Native accessibility props

- **Localized Units, Dates, and a Third Language**
  - **Description**: Extend i18n so numbers, dates, and relative times localize correctly per locale, add a third language, and pseudo-localize to catch hardcoded strings and layout overflow. Audit the app for any remaining untranslated text.
  - **Why it is useful**: Deepens the existing i18n work into proper formatting and testing, which most tutorials skip.
  - **Concepts learned**: Intl formatting, pluralization, date and number localization, pseudo-localization, RTL awareness.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours
  - **Fit**: Excellent. i18n-js and expo-localization are already wired up.
  - **Libraries**: `i18n-js`, `expo-localization`, `Intl`

### 13. Testing and Debugging

- **Component and Hook Test Coverage Expansion**
  - **Description**: Add Vitest tests for currently untested hooks and screens, particularly the weather and location query hooks and the settings screen, mocking the query client and services. Aim for meaningful coverage of the data flow, not just snapshots.
  - **Why it is useful**: Reinforces testing discipline against real async logic and mirrors the existing test structure.
  - **Concepts learned**: Testing TanStack Query hooks, mocking services, testing-library queries, async assertions.
  - **Difficulty**: Intermediate
  - **Estimated time**: 5 to 8 hours
  - **Fit**: Excellent. A test harness and conventions already exist in `src/tests`.
  - **Libraries**: `vitest`, `@testing-library/react`

- **Expand Maestro E2E Coverage**
  - **Description**: Add Maestro flows for the map, scheduled notification setup, deep link entry, and offline behavior, covering the new features as they land. Wire them into the existing EAS workflow.
  - **Why it is useful**: Keeps end-to-end coverage growing with the app and teaches flow-based testing.
  - **Concepts learned**: Maestro flow authoring, testID strategy, EAS test workflows, deep link and offline testing.
  - **Difficulty**: Intermediate
  - **Estimated time**: 4 to 6 hours per feature area
  - **Fit**: Excellent. Maestro and an EAS workflow are already set up.
  - **Libraries**: Maestro

---

## Prioritized Lists

### Beginner Features

Quick wins that can be completed in a single sitting or two.

| Feature                                    | Category           | Est. time |
| ------------------------------------------ | ------------------ | --------- |
| Haptic Feedback on Key Actions             | Native Device APIs | 2 to 3 h  |
| Copy Coordinates to Clipboard              | Native Device APIs | 1 h       |
| Share Weather Snapshot (text only)         | Native Device APIs | 3 to 5 h  |
| Skeleton Loading States                    | Animations         | 3 to 5 h  |
| Permission Rationale and Settings Redirect | Permissions        | 3 to 5 h  |
| Swap FlatList for FlashList                | Performance        | 2 to 4 h  |
| Onboarding Carousel                        | UI                 | 4 to 6 h  |

### Intermediate Features

Features that teach an important, distinct React Native concept.

| Feature                                | Category           | Est. time |
| -------------------------------------- | ------------------ | --------- |
| Scheduled Daily Forecast Notification  | Notifications      | 5 to 7 h  |
| Deep Links to a City                   | Navigation         | 4 to 6 h  |
| Air Quality and Pollen Panel           | Networking         | 4 to 6 h  |
| Hourly Temperature Chart               | Data Viz           | 6 to 10 h |
| Dynamic Theming and Dark Mode          | UI                 | 6 to 9 h  |
| Migrate Storage to MMKV                | Storage            | 4 to 6 h  |
| Interactive Weather Map                | Maps               | 8 to 12 h |
| Biometric App Lock                     | Security           | 5 to 7 h  |
| Full Accessibility Pass                | Accessibility      | 5 to 8 h  |
| Retry with Backoff and Timeout UX      | Networking         | 4 to 6 h  |
| Swipe-Down-to-Dismiss Details          | Gestures           | 5 to 7 h  |
| Barometric Pressure from Sensor        | Native Device APIs | 4 to 6 h  |
| Localized Units, Dates, Third Language | i18n               | 4 to 6 h  |
| Startup and Render Profiling Pass      | Performance        | 5 to 8 h  |
| Bottom Tab Navigation                  | Navigation         | 5 to 8 h  |
| Sunrise and Sunset Arc                 | Data Viz           | 5 to 8 h  |
| Rich Notification Actions              | Notifications      | 5 to 8 h  |
| Test Coverage Expansion                | Testing            | 5 to 8 h  |

### Advanced Features

Larger features that combine multiple concepts.

| Feature                                 | Category         | Est. time            |
| --------------------------------------- | ---------------- | -------------------- |
| Multi-Location Home with Paged Cards    | Architecture     | 10 to 14 h           |
| Animated Weather Backgrounds            | Animations       | 8 to 12 h            |
| Background Weather Refresh              | Background Tasks | 10 to 14 h           |
| Weather History Log with SQLite         | Storage          | 10 to 14 h           |
| Reorder Saved Locations (Drag and Drop) | Architecture     | 8 to 12 h            |
| Shared Element Transition to Details    | Animations       | 6 to 10 h            |
| Tap-to-Pick Location on Map             | Maps             | 4 to 6 h (after map) |

---

## Top 10 Recommendations

Ranked by learning value weighted against how naturally the feature fits the current app.

1. **Interactive Weather Map**
   The single biggest capability gap in a weather app. It introduces native map views, markers, an Android Maps API key, and coordinate handling, and it plugs straight into the saved locations and GPS data the app already has. High learning value with an obvious product payoff.

2. **Multi-Location Home with Paged Cards**
   Transforms the app from single-location to multi-location and forces a real state-management step up: parallel keyed queries with `useQueries`, prefetching, and paged UI. It elevates saved locations from a list into the core experience.

3. **Hourly Temperature Chart**
   Data visualization is a common requirement the app currently lacks, and the hourly data is already fetched but unused. Teaches charting, Skia-based rendering, and mapping API arrays to series, all with immediate visual reward.

4. **Scheduled Daily Forecast Notification**
   Distinct from the push notifications already built, this teaches local scheduled notifications and reschedule logic, and the datetime picker is already a dependency. It makes the existing alert toggle genuinely functional.

5. **Animated Weather Backgrounds**
   The highest-impact polish feature and a deep dive into Reanimated worklets and shared values, driven by the WMO codes already mapped. It teaches performant, data-driven animation, one of the harder roadmap topics.

6. **Deep Links to a City**
   Small in scope but foundational: the URL scheme already exists, and deep linking unlocks sharing, notification routing, and richer navigation. A high-leverage intermediate feature that many later features depend on.

7. **Background Weather Refresh**
   The most advanced native topic in the list. Background tasks, task manager, and Android execution limits are rarely covered well in tutorials, and this makes weather alerts actually useful. Best attempted after notifications and deep linking are solid.

8. **Dynamic Theming and Dark Mode**
   A cross-cutting refactor that teaches Context-driven styling and system dark mode while touching most of the app. The centralized theme tokens make it tractable, and it pays dividends for every screen built afterward.

9. **Biometric App Lock**
   Teaches local authentication and app-lifecycle-driven security, a professional feature with a clean settings integration. Compact scope, high real-world relevance, and it complements the existing auth work.

10. **Full Accessibility Pass**
    A professional baseline and a roadmap topic the app has barely touched. It improves every existing screen, teaches the accessibility API and TalkBack testing, and requires no new dependencies, making it an efficient, high-value investment.
