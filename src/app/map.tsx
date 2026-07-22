import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Camera, Map, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import { t } from '@/services/i18n';
import { useFetchLocation, useSavedLocations } from '@/hooks';
import { WeatherMapMarker } from '@/components/WeatherMapMarker';
import type { MapMarkerData } from '@/interfaces';
import { theme } from '@/theme';

const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

export default function MapScreen() {
  const router = useRouter();
  const { data: gpsLocation } = useFetchLocation();
  const { savedLocations } = useSavedLocations();

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
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
        {isEmpty ? (
          <View style={styles.center}>
            <SymbolView
              name={{ ios: 'map', android: 'map' }}
              size={48}
              tintColor={theme.colors.textHint}
            />
            <Text testID="map-empty" style={styles.emptyTitle}>
              {t('mapEmptyTitle')}
            </Text>
            <Text style={styles.emptySubtitle}>{t('mapEmptySubtitle')}</Text>
          </View>
        ) : (
          <View style={styles.map}>
            <Map ref={mapRef} style={styles.map} mapStyle={MAP_STYLE_URL}>
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
            </Map>

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
                <SymbolView
                  name={{ ios: 'minus', android: 'remove' }}
                  size={24}
                  tintColor="white"
                />
              </Pressable>
            </View>
          </View>
        )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    color: theme.colors.textHint,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
