import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFetchLocation, useFetchWeather } from '@/hooks';
import { weatherCodeToCondition, weatherCodeToSymbol } from '@/utils/weatherMapper';

export default function DetailsScreen() {
  const router = useRouter();

  const { data: location, isLoading: isLoadingLocation } = useFetchLocation();
  const { data: weather, isLoading: isLoadingWeather } = useFetchWeather(location);

  const isLoading = isLoadingLocation || isLoadingWeather;

  const renderForecastItem = ({ item, index }: { item: number; index: number }) => {
    const date = new Date(weather!.daily.time[index]);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    return (
      <View style={styles.forecastRow}>
        <Text style={styles.forecastDay}>{dayName}</Text>
        <SymbolView
          name={weatherCodeToSymbol(weather!.daily.weather_code[index])}
          size={24}
          tintColor="white"
          style={styles.forecastIcon}
        />
        <View style={styles.tempRange}>
          <Text style={styles.maxTemp}>
            {Math.round(weather!.daily.temperature_2m_max[index])}°
          </Text>
          <Text style={styles.minTemp}>
            {Math.round(weather!.daily.temperature_2m_min[index])}°
          </Text>
        </View>
      </View>
    );
  };

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

  if (!weather || !location) {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true, radius: 24 }}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left' }}
            size={24}
            tintColor="white"
          />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerCity}>{location.city}</Text>
          <Text style={styles.headerCondition}>
            {weatherCodeToCondition(weather.current.weather_code)}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryTemp}>{Math.round(weather.current.temperature_2m)}°</Text>
          <SymbolView
            name={weatherCodeToSymbol(weather.current.weather_code)}
            size={60}
            tintColor="white"
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{weather.current.relative_humidity_2m}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailValue}>{weather.current.wind_speed_10m} km/h</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>UV Index</Text>
            <Text style={styles.detailValue}>{Math.round(weather.daily.uv_index_max[0])}</Text>
          </View>
        </View>
      </View>

      <View style={styles.forecastContainer}>
        <Text style={styles.forecastTitle}>8-Day Forecast</Text>
        <FlatList
          data={weather.daily.weather_code}
          renderItem={renderForecastItem}
          keyExtractor={(_, index) => weather.daily.time[index]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.forecastList}
        />
      </View>
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerCity: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  headerCondition: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTemp: {
    fontSize: 64,
    fontWeight: '200',
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  forecastContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    marginTop: 10,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
  },
  forecastList: {
    paddingBottom: 20,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  forecastDay: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontWeight: '400',
  },
  forecastIcon: {
    flex: 1,
    alignItems: 'center',
  },
  tempRange: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  maxTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 12,
  },
  minTemp: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
