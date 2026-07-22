# Feature: Interactive Weather Map

## Intent

A new "Map" screen renders an interactive map with a marker at the user's current GPS location and a marker at each saved location, each showing a small weather summary (temperature, condition icon) in a tappable callout that navigates to the existing details screen for that spot.

## Context

- **Problem statement:** The app has no spatial view of weather. Saved locations (`src/app/saved.tsx`) and the current GPS position (`useFetchLocation`) are only ever shown as a list or a single home-screen card; there is no way to see them together on a map. `docs/features.md:119-126` calls this "the single biggest missing capability in a weather app."
- **Current code:**
  - `src/hooks/useFetchLocation.ts:5` wraps `fetchLocation` in a TanStack `useQuery`, returning `LocationData { latitude, longitude, city }`.
  - `src/hooks/useSavedLocations.ts:10` returns `savedLocations: SavedLocation[]` (`{ id, city, lat, lon, createdAt, userId }`, `src/interfaces/savedLocation.ts`), backed by Firestore via `src/services/firestore.service.ts`.
  - `src/hooks/useFetchWeather.ts:8` takes an optional `LocationData`-shaped object and returns `WeatherResponse` (`current.temperature_2m`, `current.weather_code`, etc.), keyed by `[lat, lon, temperatureUnit, windSpeedUnit]`, and is already battery-aware (`staleTime` widens under battery saver, see `docs/specs/battery-aware-refresh/SPEC.md`). Calling it with `undefined` disables the query (`enabled: !!location`).
  - `src/utils/weatherMapper.ts` maps a WMO `weather_code` to a `SymbolName` (`weatherCodeToSymbol`), a tint color (`getIconTintColor`), and localized condition text (`weatherCodeToCondition`).
  - Navigation to weather details always goes through `router.push({ pathname: '/details', params: { lat, lon, city } })` — see `src/app/index.tsx:60-67`, `src/app/saved.tsx:39-44`, and `src/components/SearchHeader.tsx:35-38`.
  - `src/components/SearchHeader.tsx:72-101` renders the two icon buttons (`saved-locations-button`, `settings-button`) that sit beside the search bar on the home screen; this is the natural place for a third "Map" entry point.
  - `src/app/_layout.tsx:87-92` lists every authenticated route explicitly under `<Stack.Protected guard={isAuthenticated}>` (`index`, `details`, `settings`, `saved`); a new screen must be added there or it will not render.
  - `app.json` currently has no maps configuration and no Google Maps API key. Android permissions already include `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` (`app.json:24`).
  - Test setup (`src/tests/setup.ts`) mocks every native Expo module the app touches (`expo-battery`, `expo-sensors`, `expo-haptics`, etc.) so screens/hooks/components can render under `jsdom` via the `react-native` → `react-native-web` alias in `vitest.config.ts:8`. `react-native-web` has no equivalent for a native map view, so the map library itself must be mocked the same way.
- **User impact:** Users get a single spatial view of GPS + saved-location weather instead of switching between the home screen and the saved-locations list, and can jump straight into a location's forecast from the map.
- **Dependencies / library decision:** Uses `@maplibre/maplibre-react-native` (MapLibre GL Native for React Native/Expo) with **OpenFreeMap** vector tiles, instead of the `react-native-maps` / `expo-maps` options listed in `docs/features.md:126`. This was chosen deliberately over Google Maps-backed options:
  - **`react-native-maps`** and **`expo-maps`** both render Google Maps on Android and require a Google Cloud project with a billing-enabled, restricted API key (`android.config.googleMaps.apiKey` in `app.json`) even though typical usage stays inside the free tier. `expo-maps` is also still alpha with expected breaking changes.
  - **`@maplibre/maplibre-react-native`** is fully open-source and needs no account, API key, or billing setup. Paired with OpenFreeMap's free, keyless vector tiles (`https://tiles.openfreemap.org/styles/liberty`), the map works with zero external signup — the tradeoff is a smaller ecosystem/community than `react-native-maps` and a custom-styled (non-Google) basemap.
  - Like `react-native-maps`, this is a native module: it requires its Expo config plugin plus a rebuilt custom dev client (`npx expo run:android` or a new EAS dev build) and **will not run inside Expo Go**. Per project convention, native builds are run by the user, not by an agent.

## Data Model

- **New interface** `MapMarkerData` (`src/interfaces/location.ts`):
  ```ts
  export interface MapMarkerData {
    id: string; // 'current-location' for GPS, or the SavedLocation.id
    latitude: number;
    longitude: number;
    city: string;
    isCurrentLocation: boolean;
  }
  ```
  Derived at render time in `MapScreen` from `useFetchLocation()` (GPS) and `useSavedLocations()` (saved) — not persisted, no new store.
- No changes to `SavedLocation`, `LocationData`, or `WeatherResponse`.
- No changes to any Zustand store; the map screen is stateless aside from local `selectedMarkerId` UI state.

## Interfaces / API

### `src/app/map.tsx` — `MapScreen` (new route, default export)

- Reads `gpsLocation` via `useFetchLocation()` and `savedLocations` via `useSavedLocations()`.
- Builds `markers: MapMarkerData[]`:
  - `{ id: 'current-location', latitude: gpsLocation.latitude, longitude: gpsLocation.longitude, city: gpsLocation.city, isCurrentLocation: true }` when `gpsLocation` is defined.
  - One entry per `savedLocations` item, `isCurrentLocation: false`.
- Initial camera target (`centerCoordinate`, `[longitude, latitude]`, MapLibre's GeoJSON-order convention):
  1. `gpsLocation` if present (`zoomLevel: 10`).
  2. Else the first saved location (`zoomLevel: 10`).
  3. Else a fixed world default `[0, 20]` (`zoomLevel: 1`) with no markers rendered.
- Renders a header identical in structure to `src/app/saved.tsx:112-131` (back button, `t('mapTitle')`, spacer) and a `MapView` filling the remaining space.
- Renders one `WeatherMapMarker` per entry in `markers`, tracking which marker's callout is open via local `selectedMarkerId: string | null` state (only one open at a time — selecting a marker closes any previously open one).
- `handleViewDetails(marker: MapMarkerData)` → `router.push({ pathname: '/details', params: { lat: marker.latitude, lon: marker.longitude, city: marker.city } })`, matching the existing navigation contract used by `index.tsx`, `saved.tsx`, and `SearchHeader.tsx`.
- Empty state (no GPS location AND no saved locations): centered `SymbolView` + `t('mapEmptyTitle')` / `t('mapEmptySubtitle')`, mirroring `saved.tsx:72-85`.
- Does not block rendering on a GPS error — if `useFetchLocation()` errors or is denied, the map still renders with saved-location markers only (no current-location marker), consistent with `fetchCoordinates` in `location.service.ts` already throwing a localized error that other screens surface individually.

### `src/components/WeatherMapMarker.tsx` — `WeatherMapMarker` (new component)

```ts
interface WeatherMapMarkerProps {
  marker: MapMarkerData;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (marker: MapMarkerData) => void;
}
export const WeatherMapMarker: (props: WeatherMapMarkerProps) => React.JSX.Element;
```

- Renders a `PointAnnotation`-equivalent pin at `[marker.longitude, marker.latitude]`, tinted `theme.colors.accent` when `isCurrentLocation`, `theme.colors.secondary` otherwise; `onSelected`/`onPress` calls `onToggleSelect(marker.id)`.
- Weather is fetched lazily, only once selected: `useFetchWeather(isSelected ? { latitude: marker.latitude, longitude: marker.longitude, city: marker.city } : undefined)`. This reuses `useFetchWeather`'s existing `enabled: !!location` guard (`src/hooks/useFetchWeather.ts:20`) without modifying it, so unselected markers on a map with many saved locations never trigger a weather fetch.
- When `isSelected` and weather has loaded, renders a callout (city name, `weatherCodeToSymbol`/`getIconTintColor` icon, rounded temperature via `formatRound` + the settings-store temperature unit, and `weatherCodeToCondition` text — same primitives `CurrentWeather.tsx` already uses). The callout is itself pressable (`testID="map-marker-callout"`) and calls `onViewDetails(marker)`.
- While `isSelected` and weather is still loading, the callout shows a small `ActivityIndicator` in place of the temperature/condition row.
- The exact prop names/shape of `@maplibre/maplibre-react-native`'s annotation and callout primitives (`PointAnnotation`, `MarkerView`, `Callout`, or similar) must be confirmed against the installed version's typings during implementation — the contract above (one marker, one optional callout, two callbacks) is what must hold regardless of which primitive is used to build it.

## Files Created

| File                                             | Purpose                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `src/app/map.tsx`                                | New "Weather Map" screen: builds markers from GPS + saved locations, renders `MapView`, navigates to details. |
| `src/components/WeatherMapMarker.tsx`            | Single map marker + lazy-loaded weather callout, shared by the current-location and saved-location markers.   |
| `docs/specs/interactive-weather-map/SPEC.md`     | This specification.                                                                                           |
| `src/tests/app/map.test.tsx`                     | Screen tests: marker composition, empty state, navigation to details.                                         |
| `src/tests/components/WeatherMapMarker.test.tsx` | Component tests: selection toggling, lazy weather fetch, callout press → `onViewDetails`.                     |

## Files Modified

| File                                         | Change                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                               | Add `@maplibre/maplibre-react-native` dependency.                                                                                                                                                                   |
| `app.json`                                   | Add the `@maplibre/maplibre-react-native` config plugin to `expo.plugins`.                                                                                                                                          |
| `.env.sample`                                | Add `EXPO_PUBLIC_MAP_STYLE_URL` (default noted as OpenFreeMap's `https://tiles.openfreemap.org/styles/liberty`).                                                                                                    |
| `src/interfaces/location.ts`                 | Add the `MapMarkerData` interface.                                                                                                                                                                                  |
| `src/app/_layout.tsx`                        | Add `<Stack.Screen name="map" />` inside the authenticated `<Stack.Protected>` block (`:87-92`).                                                                                                                    |
| `src/components/SearchHeader.tsx`            | Add a third icon button (`testID="map-button"`, map glyph) that does `router.push('/map')`, alongside the existing saved-locations/settings buttons.                                                                |
| `src/services/i18n.ts`                       | Add `mapButtonLabel`, `mapTitle`, `mapEmptyTitle`, `mapEmptySubtitle`, `mapViewDetailsLabel` under `en` and `ja`.                                                                                                   |
| `src/tests/setup.ts`                         | Add a global mock for `@maplibre/maplibre-react-native` (`MapView`, `Camera`, and the annotation/callout primitives as plain passthrough `View`s), the same pattern already used for `expo-battery`/`expo-sensors`. |
| `src/tests/components/SearchHeader.test.tsx` | Assert the new map button renders and navigates to `/map`.                                                                                                                                                          |

## Implementation Steps

1. Install the library: `npx expo install @maplibre/maplibre-react-native` (verify it resolves a version compatible with Expo SDK 56 / RN 0.85; pin explicitly in `package.json` if `expo install` does not recognize the package).
2. Add the config plugin to `app.json` `expo.plugins`, and add `EXPO_PUBLIC_MAP_STYLE_URL` to `.env.sample` with the OpenFreeMap default documented as a comment, following the existing `EXPO_PUBLIC_GEOCODING_API_URL` pattern (`src/services/location.service.ts:4-5`).
3. Add the `MapMarkerData` interface to `src/interfaces/location.ts` (exported via the existing `src/interfaces/index.ts` barrel — no change needed there since it already does `export *`).
4. Add the global test mock for `@maplibre/maplibre-react-native` to `src/tests/setup.ts`, mirroring the existing `expo-battery`/`expo-sensors` mocks.
5. Build `WeatherMapMarker` (`src/components/WeatherMapMarker.tsx`): pin rendering, selection toggle, lazy `useFetchWeather` call, and callout UI reusing `weatherMapper.ts` + `formatRound`. Write `src/tests/components/WeatherMapMarker.test.tsx` covering unselected (no fetch), selected+loading, selected+loaded, and callout press.
6. Build `MapScreen` (`src/app/map.tsx`): header, marker composition from `useFetchLocation`/`useSavedLocations`, initial camera logic, empty state, and `handleViewDetails`. Write `src/tests/app/map.test.tsx` covering marker composition (GPS-only, saved-only, both, neither), and navigation on `onViewDetails`.
7. Add i18n keys (`mapButtonLabel`, `mapTitle`, `mapEmptyTitle`, `mapEmptySubtitle`, `mapViewDetailsLabel`) to `src/services/i18n.ts` under both `en` and `ja`.
8. Register the route: add `<Stack.Screen name="map" />` in `src/app/_layout.tsx` inside the authenticated `<Stack.Protected>` block.
9. Add the entry point: add the map icon button to `src/components/SearchHeader.tsx`, update `src/tests/components/SearchHeader.test.tsx`.
10. Verification: run `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test`. Native map rendering itself must be verified manually by the user on-device/emulator after running `npx expo run:android` to rebuild the dev client with the new native module — this agent does not run native builds.

## Style & Conventions

- Follows the existing screen shape: header pattern copied from `saved.tsx`, loading/empty states styled with `theme` tokens, `SymbolView` for icons, `t(...)` for all copy.
- Reuses `useFetchLocation`, `useSavedLocations`, and `useFetchWeather` unchanged rather than introducing a new data-fetching abstraction; `WeatherMapMarker` composes them the same way `index.tsx`/`details.tsx` already do.
- Navigation to details uses the exact `router.push({ pathname: '/details', params: { lat, lon, city } })` shape already used in three other places, so `details.tsx` needs no changes.
- New native dependency is isolated behind `WeatherMapMarker`/`map.tsx` and a single global test mock, matching how `expo-battery` and `expo-sensors` were introduced.

## Acceptance Criteria

- [ ] `@maplibre/maplibre-react-native` is installed and configured with no Google Maps API key or billing account required anywhere in the app.
- [ ] Navigating to the map screen (via the new `SearchHeader` button) shows a marker for the current GPS location (when permission is granted and a fix is available) and one marker per saved location.
- [ ] Tapping a marker opens a callout showing that location's city, current temperature, and condition icon; tapping the callout navigates to `/details` with the correct `lat`/`lon`/`city` params.
- [ ] When GPS is unavailable/denied, the map still renders saved-location markers without crashing or showing a blocking error.
- [ ] When there is no GPS location and no saved locations, the map screen shows the empty state instead of a blank/broken map.
- [ ] `npx tsc --noEmit` completes with no TypeScript errors.
- [ ] `pnpm run lint` passes with no warnings or errors.
- [ ] `pnpm test` passes, including the new `map.test.tsx` and `WeatherMapMarker.test.tsx` suites and the updated `SearchHeader.test.tsx`.

## Constraints

- **Android only**, per project scope — no iOS-specific configuration is included even though the library supports it.
- **Scope boundary:** this spec covers only viewing GPS + saved locations on a map with weather callouts. Long-pressing the map to pick an arbitrary point and fetch/save weather for it is `docs/features.md`'s separate "Tap-to-Pick Location on Map" feature and is explicitly out of scope here.
- **Non-goals:** no marker clustering, no camera bounds-fitting across all markers, no live-tracking "my location" puck (the current-location marker is a single GPS snapshot from `useFetchLocation`, not continuously updated), and no offline tile caching.
- **Custom dev client required:** this feature cannot be exercised in Expo Go or the currently-built dev client. A native rebuild (`npx expo run:android` or a new EAS dev build) is required before the map screen can be run, and that rebuild must be performed by the user, not this agent.
- **External dependency risk:** OpenFreeMap is a free, keyless third-party tile host; if its availability or terms change, the `EXPO_PUBLIC_MAP_STYLE_URL` env var makes swapping to another MapLibre-compatible style (e.g. a self-hosted style, or a free-tier key-based provider like MapTiler) a config change, not a code change.
