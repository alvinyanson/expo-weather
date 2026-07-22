# Feature: Tap-to-Pick Location on Map

## Intent

On the existing weather map, long-pressing anywhere drops a temporary "picked" marker at that point, reverse-geocodes it into a city name, shows its current weather in a callout, and lets the user open the full forecast or save the spot to their saved locations.

## Context

- **Problem statement:** The map (`src/app/map.tsx`, shipped per `docs/specs/interactive-weather-map/SPEC.md`) can only show weather for places the app already knows about: the GPS fix and previously saved locations. There is no way to inspect weather for an arbitrary point the user can see on the map. `docs/features.md:128-135` scopes this as the follow-up "Tap-to-Pick Location on Map" feature that "combines map interaction with the existing geocoding and save flow."
- **Current code:**
  - `src/app/map.tsx` renders a `<Map>` from `@maplibre/maplibre-react-native` with a `Camera` and one `WeatherMapMarker` per entry in a derived `markers: MapMarkerData[]` list (GPS + saved). It tracks a single open callout via local `selectedMarkerId` state and navigates to details via `router.push({ pathname: '/details', params: { lat, lon, city } })` (`map.tsx:69-74`). **When there are no markers it renders a full-screen empty state instead of the map** (`map.tsx:101-113`), so today the map surface is not even mounted in that case.
  - The MapLibre `Map` component exposes `onLongPress?: (event: NativeSyntheticEvent<PressEvent>) => void` where `PressEvent.lngLat` is a `[longitude, latitude]` tuple (`node_modules/@maplibre/maplibre-react-native/.../map/Map.d.ts:381`, `.../types/PressEvent.d.ts`, `.../types/LngLat.d.ts`). This is the hook for tap-to-pick and is not currently wired.
  - `src/components/WeatherMapMarker.tsx` renders a pin + a lazily-loaded weather callout (fires `useFetchWeather` only when its marker is selected) and calls `onViewDetails(marker)` when the callout is pressed. It has **no** save affordance.
  - `src/hooks/useFetchWeather.ts:8` accepts an optional `LocationData` (`{ latitude, longitude, city }`) and is keyed by `['weather', lat, lon, temperatureUnit, windSpeedUnit]` — it can fetch for any coordinate as soon as one is supplied, independent of the resolved city name.
  - Reverse geocoding exists but is coupled to GPS: `src/services/weather.service.ts:34-50` (`fetchLocation`) calls `Location.reverseGeocodeAsync({ latitude, longitude })` and derives a city via the fallback chain `address?.city || address?.region || address?.district || t('unknownLocation')`, logging a breadcrumb on failure. There is no standalone "reverse-geocode these coordinates" service function; `src/services/location.service.ts` currently only does forward geocoding (`searchLocations`).
  - Saving is centralized in `src/hooks/useSavedLocations.ts`: `toggleSavedLocation({ lat, lon, city })` optimistically saves or (if a match exists by case-insensitive city name **or** coordinates within `0.01`) deletes, firing success/error haptics and toasts. `src/app/details.tsx:63-87` shows the canonical consumer: it derives `isSaved` from `savedLocations` using the same matching rule and calls `toggleSavedLocation`.
  - `src/hooks/useHaptics.ts` exposes `impact(style?)`, `success()`, `error()`, `selection()`, all gated by the `hapticsEnabled` setting.
  - i18n copy lives in `src/services/i18n.ts` under `en` and `ja`; existing map keys are `mapTitle`, `mapEmptyTitle`, `mapEmptySubtitle` (`:50-52`, `:223-225`) and the reverse-geocode fallback is `unknownLocation` (`:160`, `:332`).
  - Tests render under `jsdom` with `react-native` aliased to `react-native-web`; `src/tests/setup.ts:61-71` mocks `@maplibre/maplibre-react-native` as passthrough stubs (`Map`, `Camera`, `Marker`, `Callout`, `ViewAnnotation`). The current `Map` stub renders children only and **does not forward `onLongPress`**, so it cannot yet drive tap-to-pick in a test.
- **User impact:** Users can explore weather anywhere on the map, not just at pre-known points, and add any of those points to their saved locations in one gesture — turning the map from a read-only overview into an entry point for discovery and saving.
- **Dependencies:** Builds directly on the already-shipped Interactive Weather Map (`docs/specs/interactive-weather-map/SPEC.md`) and the existing `@maplibre/maplibre-react-native`, `expo-location`, `useFetchWeather`, and `useSavedLocations`. No new packages. Requires the custom dev client already needed by the map feature (MapLibre is a native module and does not run in Expo Go); native verification is done on-device by the user.

## Data Model

- **Reuses `MapMarkerData`** (`src/interfaces/location.ts:16-22`) for the picked point, with a fixed sentinel id `'picked-location'` and `isCurrentLocation: false`. Not persisted — held only in `MapScreen` local state until the user picks elsewhere or dismisses it. Saving it converts it into a normal `SavedLocation` through the existing `toggleSavedLocation` path; no new persisted shape.
- **New local state in `MapScreen`:** `pickedCoords: { latitude: number; longitude: number } | null`. The city name is not stored in state; it is derived from `useReverseGeocode(pickedCoords)`.
- No changes to `LocationData`, `SavedLocation`, `WeatherResponse`, or any Zustand store.

## Interfaces / API

### `reverseGeocode` — new service function (`src/services/location.service.ts`)

```ts
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string>;
```

- Calls `Location.reverseGeocodeAsync({ latitude, longitude })` and returns the first sensible label using the existing fallback chain `address?.city || address?.region || address?.district || t('unknownLocation')`.
- On throw, logs a breadcrumb (`logBreadcrumb`) and resolves to `t('unknownLocation')` — never rejects, matching the current degradation behavior in `fetchLocation`.
- Android-only scope: `reverseGeocodeAsync` uses the platform Geocoder and does not require location permission on Android, so tap-to-pick works even when GPS permission was denied.
- `src/services/weather.service.ts` `fetchLocation` is refactored to call this shared function instead of duplicating the inline reverse-geocode block; behavior is unchanged (the `expo-location` mock in `weather.service.test.ts` still applies module-wide).

### `useReverseGeocode` — new hook (`src/hooks/useReverseGeocode.ts`)

```ts
export function useReverseGeocode(coords?: {
  latitude: number;
  longitude: number;
}): UseQueryResult<string, Error>;
```

- Wraps `reverseGeocode` in `useQuery`, keyed by `['reverseGeocode', coords?.latitude, coords?.longitude]`, `enabled: !!coords`, with a long `staleTime` (place names are effectively static — 24h).
- Mirrors the `useSearchLocation` pattern (`src/hooks/useSearchLocation.ts`) of a thin `useQuery` wrapper over a `location.service` function; re-exported from `src/hooks/index.ts`.

### `PickedLocationMarker` — new component (`src/components/PickedLocationMarker.tsx`)

```ts
interface PickedLocationMarkerProps {
  latitude: number;
  longitude: number;
  city: string; // resolved name, or a "resolving…"/unknown placeholder
  isResolvingCity: boolean;
  isSaved: boolean;
  onViewDetails: (marker: MapMarkerData) => void;
  onToggleSave: (target: { lat: number; lon: number; city: string }) => void;
  onDismiss: () => void;
}
export const PickedLocationMarker: (props: PickedLocationMarkerProps) => React.JSX.Element;
```

- Renders a distinctly-tinted pin (`theme.colors.warning`/`accent`, visually distinct from GPS and saved pins) at `[longitude, latitude]` via MapLibre `Marker`.
- Callout is **always open** (unlike `WeatherMapMarker`, which opens only when selected). It fetches weather eagerly via `useFetchWeather({ latitude, longitude, city })` and reuses the same presentation primitives as `WeatherMapMarker` (`weatherCodeToSymbol`, `getIconTintColor`, `weatherCodeToCondition`, `formatRound`, temperature unit from `useSettingsStore`).
- City line shows the resolved name, or a localized "Resolving location…" placeholder while `isResolvingCity` is true.
- Callout actions: a "View details" press target (`testID="picked-marker-details"`) → `onViewDetails({ id: 'picked-location', latitude, longitude, city, isCurrentLocation: false })`; a save/unsave toggle (`testID="picked-marker-save"`) with a filled vs. outline bookmark glyph driven by `isSaved` → `onToggleSave({ lat: latitude, lon: longitude, city })`; and a dismiss/close control (`testID="picked-marker-dismiss"`) → `onDismiss()`.
- Weather-loading state shows an `ActivityIndicator` in place of the temperature/condition row, same as `WeatherMapMarker`.

### `MapScreen` changes (`src/app/map.tsx`)

- Adds `onLongPress={handleLongPress}` to `<Map>`. `handleLongPress(e)` reads `const [longitude, latitude] = e.nativeEvent.lngLat`, sets `pickedCoords`, clears `selectedMarkerId` (so an open saved-marker callout closes), and fires `haptics.impact()` for tactile feedback.
- Consumes `useReverseGeocode(pickedCoords ?? undefined)`; passes `city = placeName ?? t('mapPickResolving')` and `isResolvingCity = isFetching` down to `PickedLocationMarker`.
- Derives `isPickedSaved` from `savedLocations` using the same match rule details/`toggleSavedLocation` use (case-insensitive city OR |Δlat|<0.01 && |Δlon|<0.01), and wires `onToggleSave` to `useSavedLocations().toggleSavedLocation`, `onViewDetails` to the existing `handleViewDetails`, and `onDismiss` to `() => setPickedCoords(null)`.
- **Empty-state behavior changes:** the map surface now renders even when there are zero GPS/saved markers, so the user can always long-press to pick a point. The prior full-screen empty state (`map-empty`) is replaced by a non-blocking hint overlay (`testID="map-pick-hint"`, copy `t('mapPickHint')`) shown over the interactive map while no marker and no picked point exist. Zoom controls therefore also render in that state. The initial camera still falls back to the world default `[0, 20]` at zoom 1 when there is no GPS/saved coordinate to center on.

Navigation contract to `/details` is unchanged (`{ lat, lon, city }`), so `details.tsx` needs no changes.

## Files Created

| File                                                 | Purpose                                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/hooks/useReverseGeocode.ts`                     | TanStack Query wrapper over `reverseGeocode`, keyed by tapped coordinates.                          |
| `src/components/PickedLocationMarker.tsx`            | Picked-point pin + always-open weather callout with view-details, save/unsave, and dismiss actions. |
| `docs/specs/tap-to-pick-location-on-map/SPEC.md`     | This specification.                                                                                 |
| `src/tests/hooks/useReverseGeocode.test.tsx`         | Hook tests: disabled when no coords, calls `reverseGeocode`, returns the resolved name.             |
| `src/tests/components/PickedLocationMarker.test.tsx` | Component tests: resolving placeholder, weather callout, view-details, save toggle, dismiss.        |

## Files Modified

| File                               | Change                                                                                                                                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/location.service.ts` | Add `reverseGeocode(latitude, longitude)` using `Location.reverseGeocodeAsync` with the shared fallback chain + breadcrumb; import `expo-location` and `logBreadcrumb`.                                                                                         |
| `src/services/weather.service.ts`  | Refactor `fetchLocation` to call the new `reverseGeocode` instead of the inline reverse-geocode block (behavior unchanged).                                                                                                                                     |
| `src/hooks/index.ts`               | Re-export `useReverseGeocode`.                                                                                                                                                                                                                                  |
| `src/app/map.tsx`                  | Wire `onLongPress`, add `pickedCoords` state + reverse-geocode + save wiring, render `PickedLocationMarker`, always mount the map, replace full-screen empty state with a hint overlay.                                                                         |
| `src/services/i18n.ts`             | Add `mapPickResolving`, `mapPickHint`, `pickedSaveLabel`, `pickedUnsaveLabel`, `pickedDismissLabel`, `pickedViewDetailsLabel` under both `en` and `ja`.                                                                                                         |
| `src/tests/setup.ts`               | Make the mocked MapLibre `Map` forward `onLongPress` (render a `map-longpress-trigger` element whose press invokes `onLongPress` with a fixed sentinel `lngLat`) so tests can drive tap-to-pick; keep other stubs as-is.                                        |
| `src/tests/app/map.test.tsx`       | Update empty-state expectations (map + hint now render instead of `map-empty`); add tap-to-pick tests (long-press renders picked marker, reverse-geocode + save wiring, dismiss). Extend the `@/hooks` mock with `useReverseGeocode` and `toggleSavedLocation`. |

## Implementation Steps

1. Add `reverseGeocode(latitude, longitude): Promise<string>` to `src/services/location.service.ts` (import `expo-location` and `logBreadcrumb` from `crash.service`), returning the `city||region||district||unknownLocation` fallback and never rejecting.
2. Refactor `fetchLocation` in `src/services/weather.service.ts` to delegate to `reverseGeocode`; confirm `src/tests/services/weather.service.test.ts` still passes unchanged.
3. Add `useReverseGeocode` (`src/hooks/useReverseGeocode.ts`) as a `useQuery` wrapper (`enabled: !!coords`, 24h `staleTime`); re-export it from `src/hooks/index.ts`. Write `src/tests/hooks/useReverseGeocode.test.tsx` (disabled with no coords; resolves the name when coords are supplied).
4. Add i18n keys (`mapPickResolving`, `mapPickHint`, `pickedSaveLabel`, `pickedUnsaveLabel`, `pickedDismissLabel`, `pickedViewDetailsLabel`) to both `en` and `ja` in `src/services/i18n.ts`.
5. Build `PickedLocationMarker` (`src/components/PickedLocationMarker.tsx`): pin, always-open callout reusing `weatherMapper`/`formatters`/settings unit, resolving-city placeholder, and the three callout actions. Write `src/tests/components/PickedLocationMarker.test.tsx` covering resolving placeholder, loaded weather, `onViewDetails`, `onToggleSave` (saved vs. unsaved glyph), and `onDismiss`.
6. Update `src/tests/setup.ts` so the mocked `Map` forwards `onLongPress` via a pressable `map-longpress-trigger` element that calls `onLongPress({ nativeEvent: { lngLat: [<sentinel-lon>, <sentinel-lat>] } })`.
7. Wire `MapScreen` (`src/app/map.tsx`): `pickedCoords` state, `handleLongPress`, `useReverseGeocode`, `isPickedSaved` derivation, render `PickedLocationMarker`, always mount `<Map>`, and swap the full-screen empty state for the `map-pick-hint` overlay.
8. Update `src/tests/app/map.test.tsx`: adjust the two empty-state tests for the new always-mounted map + hint, extend the `@/hooks` mock with `useReverseGeocode` and a `toggleSavedLocation` spy, and add tests for long-press → picked marker, reverse-geocode label, save toggle, and dismiss.
9. Verify: run `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test`. Interactive long-press, reverse geocoding, and saving on the real map are verified manually by the user on an Android dev client (`npx expo run:android`); this agent does not run native builds or the emulator.

## Style & Conventions

- Per `AGENTS.md`, confirm any unfamiliar MapLibre/`expo-location` API against the SDK 56 docs (https://docs.expo.dev/versions/v56.0.0/) and the installed typings before use.
- Reuses `useFetchWeather`, `useSavedLocations.toggleSavedLocation`, `useHaptics`, `weatherMapper`, and `formatters` unchanged rather than adding new abstractions; `PickedLocationMarker` mirrors `WeatherMapMarker`'s structure and the details-screen save/`isSaved` pattern (`details.tsx:68-87`).
- All copy goes through `t(...)` in both `en` and `ja`; styling uses `theme` tokens and `SymbolView` glyphs, consistent with the existing map components. Comments stay brief per project preference. Rely on the React Compiler for memoization (no hand-rolled `useMemo`/`useCallback`).
- Consolidating reverse geocoding into `location.service.ts` (and having `fetchLocation` reuse it) follows the "one file per domain" service convention and removes duplication rather than adding a parallel implementation.

## Acceptance Criteria

- [ ] Long-pressing the map drops a picked marker at the pressed point and opens a callout showing that point's current temperature and condition icon.
- [ ] The picked marker's city name is populated by reverse-geocoding the tapped coordinates, showing a localized "resolving" placeholder until it resolves and falling back to "Unknown Location" when geocoding fails, without crashing.
- [ ] Pressing "View details" on the picked callout navigates to `/details` with the tapped `lat`/`lon` and resolved `city`.
- [ ] The save toggle adds the picked point to saved locations (and reflects saved/unsaved state via the bookmark glyph, matching the details screen); toggling again removes it. Saving works even when GPS permission was denied.
- [ ] The picked marker can be dismissed, and picking a new point replaces the previous one (only one picked point at a time).
- [ ] Tap-to-pick works even when there is no GPS fix and no saved locations (the map is interactive with a hint overlay instead of a blank empty state).
- [ ] `npx tsc --noEmit` completes with no TypeScript errors.
- [ ] `pnpm run lint` passes with no warnings or errors.
- [ ] `pnpm test` passes, including the new `useReverseGeocode` and `PickedLocationMarker` suites and the updated `map.test.tsx`, and the existing `weather.service.test.ts` still passes after the `fetchLocation` refactor.

## Constraints

- **Android only**, per project scope. Relies on Android's permission-free reverse geocoding; iOS behavior is out of scope.
- **Scope boundaries / non-goals:** no drag-to-move of the picked marker, no multi-pin picking (one picked point at a time), no long-press to save without opening the callout, no editing of the reverse-geocoded name before saving, and no persistence of the picked point across app restarts.
- **Compatibility:** the `/details` navigation contract and the `toggleSavedLocation` API are reused unchanged, so no other screens are affected. The empty-state UI change is intentional and updates the two empty-state tests introduced by the interactive-weather-map spec.
- **Reverse-geocode reliability:** Android's Geocoder can be rate-limited, offline-empty, or return no locality for remote/ocean points; the feature must degrade to "Unknown Location" (still savable by coordinates) rather than block or error.
- **Native verification only on-device:** long-press, real reverse geocoding, and map rendering cannot be exercised under `jsdom`/`react-native-web`; they require the user's Android dev client. Automated tests cover wiring and state transitions through mocks only.
