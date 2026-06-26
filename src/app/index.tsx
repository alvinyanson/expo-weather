import { useFetchLocation, useFetchWeather } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { SearchHeader } from '@/components/SearchHeader';
import { CurrentWeather } from '@/components/CurrentWeather';
import { HourlyForecast } from '@/components/HourlyForecast';

export default function HomeScreen() {
  const router = useRouter();
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const tempUnit = temperatureUnit === 'celsius' ? '°C' : '°F';

  const {
    data: gpsLocation,
    isLoading: isLoadingLocation,
    error: locationError,
    refetch: refetchLocation,
  } = useFetchLocation();

  const {
    data: weather,
    isLoading: isLoadingWeather,
    error: weatherError,
    refetch: refetchWeather,
  } = useFetchWeather(gpsLocation);

  const handlePressWeather = () => {
    router.push({
      pathname: '/details',
      params: gpsLocation
        ? { lat: gpsLocation.latitude, lon: gpsLocation.longitude, city: gpsLocation.city }
        : {},
    });
  };

  const isLoading = isLoadingLocation || isLoadingWeather;
  const error = locationError || weatherError;

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <SymbolView
            name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
            size={48}
            tintColor="white"
          />
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              refetchLocation();
              refetchWeather();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SearchHeader />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Fetching weather data...</Text>
        </View>
      ) : (
        <>
          {weather && (
            <CurrentWeather
              city={gpsLocation?.city}
              weather={weather}
              tempUnit={tempUnit}
              onPress={handlePressWeather}
            />
          )}

          {weather && <HourlyForecast weather={weather} />}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap for more details</Text>
          </View>
        </>
      )}
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
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});
