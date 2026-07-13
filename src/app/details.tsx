import { useFetchLocation, useFetchWeather, useSavedLocations } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { theme } from '@/theme';
import { formatTime } from '@/utils/formatters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { t } from '@/services/i18n';

import { DetailsHeader } from '@/components/DetailsHeader';
import { WeatherSummaryCard } from '@/components/WeatherSummaryCard';
import { DailyForecastList } from '@/components/DailyForecastList';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const windSpeedUnit = useSettingsStore((state) => state.windSpeedUnit);

  const tempUnit = temperatureUnit === 'celsius' ? '°C' : '°F';
  const windUnit = windSpeedUnit === 'kmh' ? 'km/h' : 'mph';

  const { data: gpsLocation, isLoading: isLoadingLocation } = useFetchLocation();

  const targetLocation =
    params.lat && params.lon
      ? {
          latitude: Number(params.lat),
          longitude: Number(params.lon),
          city: params.city as string,
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

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isGettingLocation = !params.lat && isLoadingLocation;
  const isLoading = isGettingLocation || (!weather && isFetchingWeather);

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
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>{t('loadingDetails')}</Text>
        </View>
      </View>
    );
  }

  if (!weather?.current || !weather?.daily || !targetLocation) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <DetailsHeader
        city={targetLocation.city}
        weather={weather}
        lastUpdated={lastUpdated}
        onBack={() => router.back()}
        onSave={handleSaveLocation}
        isSaved={isSaved}
      />

      <View style={isTablet ? styles.tabletContentContainer : styles.mobileContentContainer}>
        <View style={isTablet ? styles.tabletColumnLeft : undefined}>
          <WeatherSummaryCard weather={weather} tempUnit={tempUnit} windUnit={windUnit} />
        </View>

        <View style={isTablet ? styles.tabletColumnRight : styles.mobileColumnRight}>
          <DailyForecastList
            weather={weather}
            tempUnit={tempUnit}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
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
  tabletContentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
  },
  mobileContentContainer: {
    flex: 1,
    flexDirection: 'column',
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
