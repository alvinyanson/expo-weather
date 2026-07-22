import { Marker } from '@maplibre/maplibre-react-native';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapMarkerData } from '@/interfaces';
import { useFetchWeather } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/services/i18n';
import {
  getIconTintColor,
  weatherCodeToCondition,
  weatherCodeToSymbol,
} from '@/utils/weatherMapper';
import { formatRound } from '@/utils/formatters';
import { theme } from '@/theme';

interface PickedLocationMarkerProps {
  latitude: number;
  longitude: number;
  city: string;
  isResolvingCity: boolean;
  isSaved: boolean;
  onViewDetails: (marker: MapMarkerData) => void;
  onToggleSave: (target: { lat: number; lon: number; city: string }) => void;
  onDismiss: () => void;
}

export const PickedLocationMarker = ({
  latitude,
  longitude,
  city,
  isResolvingCity,
  isSaved,
  onViewDetails,
  onToggleSave,
  onDismiss,
}: PickedLocationMarkerProps) => {
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const tempUnit = temperatureUnit === 'celsius' ? '°C' : '°F';

  const displayCity = isResolvingCity ? t('mapPickResolving') : city;

  const { data: weather, isLoading } = useFetchWeather({
    latitude,
    longitude,
    city: displayCity,
  });

  const markerData: MapMarkerData = {
    id: 'picked-location',
    latitude,
    longitude,
    city: displayCity,
    isCurrentLocation: false,
  };

  return (
    <Marker id="picked-location" lngLat={[longitude, latitude]}>
      <View style={styles.container}>
        <View testID="picked-marker-callout" style={styles.callout}>
          <View style={styles.headerRow}>
            <Text style={styles.calloutCity} numberOfLines={1}>
              {displayCity}
            </Text>
            <Pressable
              testID="picked-marker-dismiss"
              onPress={onDismiss}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('pickedDismissLabel')}
            >
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'close' }}
                size={20}
                tintColor={theme.colors.textMuted}
              />
            </Pressable>
          </View>

          {isLoading || !weather ? (
            <ActivityIndicator
              testID="picked-marker-loading"
              size="small"
              color="white"
              style={styles.loader}
            />
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

          <View style={styles.actionsRow}>
            <Pressable
              testID="picked-marker-details"
              onPress={() => onViewDetails(markerData)}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('pickedViewDetailsLabel')}
            >
              <Text style={styles.actionText}>{t('pickedViewDetailsLabel')}</Text>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right' }}
                size={16}
                tintColor={theme.colors.accent}
              />
            </Pressable>

            <Pressable
              testID="picked-marker-save"
              onPress={() => onToggleSave({ lat: latitude, lon: longitude, city: displayCity })}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? t('pickedUnsaveLabel') : t('pickedSaveLabel')}
            >
              <SymbolView
                name={{
                  ios: isSaved ? 'bookmark.fill' : 'bookmark',
                  android: isSaved ? 'bookmark' : 'bookmark_border',
                }}
                size={20}
                tintColor={isSaved ? theme.colors.accent : 'white'}
              />
            </Pressable>
          </View>
        </View>

        <View testID="picked-marker-pin" style={styles.pin}>
          <SymbolView
            name={{ ios: 'mappin.circle.fill', android: 'location_on' }}
            size={36}
            tintColor={theme.colors.accent}
          />
        </View>
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
    minWidth: 180,
    alignItems: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  calloutCity: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    flex: 1,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
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
  loader: {
    marginVertical: theme.spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  actionText: {
    color: theme.colors.accent,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500',
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
