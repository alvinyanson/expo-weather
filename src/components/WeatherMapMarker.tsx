import { Marker } from '@maplibre/maplibre-react-native';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapMarkerData } from '@/interfaces';
import { useFetchWeather } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  getIconTintColor,
  weatherCodeToCondition,
  weatherCodeToSymbol,
} from '@/utils/weatherMapper';
import { formatRound } from '@/utils/formatters';
import { theme } from '@/theme';

interface WeatherMapMarkerProps {
  marker: MapMarkerData;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (marker: MapMarkerData) => void;
}

export const WeatherMapMarker = ({
  marker,
  isSelected,
  onToggleSelect,
  onViewDetails,
}: WeatherMapMarkerProps) => {
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const tempUnit = temperatureUnit === 'celsius' ? '°C' : '°F';

  // Lazy: only fetch once selected. useFetchWeather disables itself on undefined.
  const { data: weather, isLoading } = useFetchWeather(
    isSelected
      ? { latitude: marker.latitude, longitude: marker.longitude, city: marker.city }
      : undefined,
  );

  const pinColor = marker.isCurrentLocation ? theme.colors.accent : theme.colors.secondary;

  return (
    <Marker id={marker.id} lngLat={[marker.longitude, marker.latitude]}>
      <View style={styles.container}>
        {isSelected && (
          <Pressable
            testID="map-marker-callout"
            style={styles.callout}
            onPress={() => onViewDetails(marker)}
            accessibilityRole="button"
          >
            <Text style={styles.calloutCity} numberOfLines={1}>
              {marker.city}
            </Text>
            {isLoading || !weather ? (
              <ActivityIndicator testID="map-marker-loading" size="small" color="white" />
            ) : (
              <View style={styles.calloutRow}>
                <SymbolView
                  name={weatherCodeToSymbol(weather.current.weather_code)}
                  size={24}
                  tintColor={getIconTintColor(weather.current.weather_code)}
                  type="monochrome"
                />
                <Text style={styles.calloutTemp}>
                  {formatRound(weather.current.temperature_2m)}
                  {tempUnit}
                </Text>
                <Text style={styles.calloutCondition} numberOfLines={1}>
                  {weatherCodeToCondition(weather.current.weather_code)}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        <Pressable
          testID={`map-marker-${marker.id}`}
          onPress={() => onToggleSelect(marker.id)}
          style={styles.pin}
          accessibilityRole="button"
          accessibilityLabel={marker.city}
        >
          <SymbolView
            name={{ ios: 'mappin.circle.fill', android: 'location_on' }}
            size={36}
            tintColor={pinColor}
          />
        </Pressable>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    minWidth: 140,
    alignItems: 'center',
  },
  calloutCity: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  calloutTemp: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  calloutCondition: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
  },
});
