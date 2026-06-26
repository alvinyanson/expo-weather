import { useFetchLocation, useFetchWeather } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, StatusBar } from 'react-native';

import { DetailsHeader } from '@/components/DetailsHeader';
import { WeatherSummaryCard } from '@/components/WeatherSummaryCard';
import { DailyForecastList } from '@/components/DailyForecastList';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
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

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

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
          <Text style={styles.loadingText}>No weather data available.</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
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
          <Text style={styles.loadingText}>Loading details...</Text>
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
      />

      <WeatherSummaryCard weather={weather} tempUnit={tempUnit} windUnit={windUnit} />

      <DailyForecastList
        weather={weather}
        tempUnit={tempUnit}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});
