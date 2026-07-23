import {
  useCopyCoordinates,
  useFetchLocation,
  useFetchWeather,
  useHaptics,
  useSavedLocations,
  useShareWeather,
} from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { theme } from '@/theme';
import { formatTime } from '@/utils/formatters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { t } from '@/services/i18n';

import { DetailsHeader } from '@/components/DetailsHeader';
import { WeatherSummaryCard } from '@/components/WeatherSummaryCard';
import { DailyForecastList } from '@/components/DailyForecastList';
import { PressureCard } from '@/components/PressureCard';
import { HourlyTemperatureChart } from '@/components/HourlyTemperatureChart';
import { DetailsScreenSkeleton } from '@/components/skeletons/DetailsScreenSkeleton';
import { SwipeToDismiss } from '@/components/SwipeToDismiss';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lon?: string; city?: string }>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const windSpeedUnit = useSettingsStore((state) => state.windSpeedUnit);

  const tempUnit = temperatureUnit === 'celsius' ? '°C' : '°F';
  const windUnit = windSpeedUnit === 'kmh' ? 'km/h' : 'mph';

  const { data: gpsLocation, isLoading: isLoadingLocation } = useFetchLocation();

  const targetLocation =
    params.lat && params.lon && params.city
      ? {
          latitude: Number(params.lat),
          longitude: Number(params.lon),
          city: params.city,
        }
      : gpsLocation;

  const {
    data: weather,
    isFetching: isFetchingWeather,
    isError,
    refetch,
    dataUpdatedAt,
  } = useFetchWeather(targetLocation);

  const lastUpdated = dataUpdatedAt ? formatTime(dataUpdatedAt) : '';

  const { savedLocations, toggleSavedLocation } = useSavedLocations();
  const haptics = useHaptics();
  const { share } = useShareWeather();
  const { copy } = useCopyCoordinates();

  const matchingSaved = targetLocation
    ? savedLocations.find(
        (loc) =>
          loc.city.toLowerCase() === targetLocation.city.toLowerCase() ||
          (Math.abs(loc.lat - targetLocation.latitude) < 0.01 &&
            Math.abs(loc.lon - targetLocation.longitude) < 0.01),
      )
    : undefined;

  const isSaved = !!matchingSaved;

  const handleSaveLocation = () => {
    if (targetLocation) {
      toggleSavedLocation({
        lat: targetLocation.latitude,
        lon: targetLocation.longitude,
        city: targetLocation.city,
      });
    }
  };

  const handleShare = () => {
    if (!weather || !targetLocation) return;
    share({ city: targetLocation.city, weather, tempUnit });
  };

  const handleCopyCoordinates = () => {
    if (!targetLocation) return;
    copy(targetLocation.latitude, targetLocation.longitude);
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    haptics.impact();
    setRefreshing(false);
  };

  const isGettingLocation = !params.lat && isLoadingLocation;
  const isLoading = isGettingLocation || (!weather && isFetchingWeather);

  const handleDismiss = () => {
    haptics.impact();
    router.back();
  };

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>{t('noWeatherData')}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>{t('goBack')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <DetailsScreenSkeleton />;
  }

  if (!weather?.current || !weather?.daily || !targetLocation) {
    return null;
  }

  return (
    <SwipeToDismiss onDismiss={handleDismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <DetailsHeader
          city={targetLocation.city}
          weather={weather}
          lastUpdated={lastUpdated}
          onBack={() => router.back()}
          onShare={handleShare}
          onSave={handleSaveLocation}
          isSaved={isSaved}
          onCopyCoordinates={handleCopyCoordinates}
        />

        <Pressable
          style={({ pressed }) => [styles.historyButton, pressed && styles.historyButtonPressed]}
          android_ripple={{ color: theme.colors.ripple }}
          accessibilityRole="button"
          accessibilityLabel="View weather history"
          onPress={() =>
            router.push({
              pathname: '/history',
              params: {
                lat: String(targetLocation.latitude),
                lon: String(targetLocation.longitude),
                city: targetLocation.city,
              },
            })
          }
        >
          <Text style={styles.historyButtonText}>View History</Text>
        </Pressable>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={
            isTablet ? styles.tabletContentContainer : styles.mobileContentContainer
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={isTablet ? styles.tabletColumnLeft : undefined}>
            <WeatherSummaryCard weather={weather} tempUnit={tempUnit} windUnit={windUnit} />
            <PressureCard forecastPressure={weather.current.surface_pressure} />
            <HourlyTemperatureChart weather={weather} tempUnit={tempUnit} />
          </View>

          <View style={isTablet ? styles.tabletColumnRight : styles.mobileColumnRight}>
            <DailyForecastList
              weather={weather}
              tempUnit={tempUnit}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </View>
        </ScrollView>
      </View>
    </SwipeToDismiss>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  historyButton: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  historyButtonPressed: {
    opacity: 0.8,
  },
  historyButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  tabletContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 20,
  },
  mobileContentContainer: {
    flexDirection: 'column',
    paddingBottom: 20,
  },
  tabletColumnLeft: {
    flex: 1,
  },
  tabletColumnRight: {
    flex: 1,
  },
  mobileColumnRight: {
    flex: 1,
  },
});
