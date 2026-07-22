import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Camera, Map, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import { t } from '@/services/i18n';
import { useFetchLocation, useHaptics, useReverseGeocode, useSavedLocations } from '@/hooks';
import { WeatherMapMarker } from '@/components/WeatherMapMarker';
import { PickedLocationMarker } from '@/components/PickedLocationMarker';
import type { MapMarkerData } from '@/interfaces';
import { theme } from '@/theme';

const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

export default function MapScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { data: gpsLocation } = useFetchLocation();
  const { savedLocations, toggleSavedLocation } = useSavedLocations();

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  const { data: placeName, isFetching: isResolvingCity } = useReverseGeocode(
    pickedCoords ?? undefined,
  );

  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 18;

  const markers: MapMarkerData[] = [
    ...(gpsLocation
      ? [
          {
            id: 'current-location',
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
            city: gpsLocation.city,
            isCurrentLocation: true,
          },
        ]
      : []),
    ...savedLocations.map((loc) => ({
      id: loc.id,
      latitude: loc.lat,
      longitude: loc.lon,
      city: loc.city,
      isCurrentLocation: false,
    })),
  ];

  const isEmpty = markers.length === 0;
  const showHint = isEmpty && !pickedCoords;

  const resolvedCityName = placeName ?? t('mapPickResolving');

  const isPickedSaved = pickedCoords
    ? savedLocations.some(
        (loc) =>
          loc.city.toLowerCase() === resolvedCityName.toLowerCase() ||
          (Math.abs(loc.lat - pickedCoords.latitude) < 0.01 &&
            Math.abs(loc.lon - pickedCoords.longitude) < 0.01),
      )
    : false;

  // Initial camera: GPS first, then first saved location, else a world default.
  const initialCenter: [number, number] = gpsLocation
    ? [gpsLocation.longitude, gpsLocation.latitude]
    : savedLocations[0]
      ? [savedLocations[0].lon, savedLocations[0].lat]
      : [0, 20];
  const initialZoom = isEmpty ? 1 : 10;

  const handleToggleSelect = (id: string) => {
    setSelectedMarkerId((current) => (current === id ? null : id));
  };

  const handleLongPress = (e: any) => {
    const lngLat = e.nativeEvent?.lngLat;
    if (!lngLat || !Array.isArray(lngLat) || lngLat.length < 2) return;
    const [longitude, latitude] = lngLat;
    setSelectedMarkerId(null);
    setPickedCoords({ latitude, longitude });
    haptics.impact();
  };

  // Read the live zoom from the map (so pinch gestures stay in sync) and step it.
  const handleZoom = async (delta: number) => {
    const current = (await mapRef.current?.getZoom()) ?? initialZoom;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + delta));
    cameraRef.current?.zoomTo(next, { duration: 200 });
  };

  const handleViewDetails = (marker: MapMarkerData) => {
    router.push({
      pathname: '/details',
      params: { lat: marker.latitude, lon: marker.longitude, city: marker.city },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Pressable
          testID="map-back-button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left' }}
            size={24}
            tintColor="white"
          />
        </Pressable>
        <Text testID="map-title" style={styles.headerTitle}>
          {t('mapTitle')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.map}>
          <Map
            ref={mapRef}
            style={styles.map}
            mapStyle={MAP_STYLE_URL}
            onLongPress={handleLongPress}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{ center: initialCenter, zoom: initialZoom }}
            />
            {markers.map((marker) => (
              <WeatherMapMarker
                key={marker.id}
                marker={marker}
                isSelected={selectedMarkerId === marker.id}
                onToggleSelect={handleToggleSelect}
                onViewDetails={handleViewDetails}
              />
            ))}
            {pickedCoords && (
              <PickedLocationMarker
                latitude={pickedCoords.latitude}
                longitude={pickedCoords.longitude}
                city={resolvedCityName}
                isResolvingCity={isResolvingCity}
                isSaved={isPickedSaved}
                onViewDetails={handleViewDetails}
                onToggleSave={toggleSavedLocation}
                onDismiss={() => setPickedCoords(null)}
              />
            )}
          </Map>

          {showHint && (
            <View testID="map-pick-hint" style={styles.hintContainer} pointerEvents="none">
              <Text style={styles.hintText}>{t('mapPickHint')}</Text>
            </View>
          )}

          <View style={styles.zoomControls}>
            <Pressable
              testID="map-zoom-in-button"
              onPress={() => handleZoom(1)}
              style={({ pressed }) => [styles.zoomButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: theme.colors.ripple, borderless: false }}
              accessibilityRole="button"
              accessibilityLabel={t('mapZoomInLabel')}
            >
              <SymbolView name={{ ios: 'plus', android: 'add' }} size={24} tintColor="white" />
            </Pressable>
            <View style={styles.zoomDivider} />
            <Pressable
              testID="map-zoom-out-button"
              onPress={() => handleZoom(-1)}
              style={({ pressed }) => [styles.zoomButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: theme.colors.ripple, borderless: false }}
              accessibilityRole="button"
              accessibilityLabel={t('mapZoomOutLabel')}
            >
              <SymbolView name={{ ios: 'minus', android: 'remove' }} size={24} tintColor="white" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 60,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  hintContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  hintText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  },
  zoomControls: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.xl,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
