import { weatherCodeToSymbol } from '@/utils/weatherMapper';
import { SymbolView } from 'expo-symbols';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { WeatherResponse } from '@/interfaces';

interface DailyForecastListProps {
  weather: WeatherResponse;
  tempUnit: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export const DailyForecastList = ({
  weather,
  tempUnit,
  refreshing,
  onRefresh,
}: DailyForecastListProps) => {
  if (!weather?.daily) return null;

  const renderForecastItem = ({ index }: { item: number; index: number }) => {
    const date = new Date(weather.daily.time[index]);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    return (
      <View style={styles.forecastRow}>
        <Text style={styles.forecastDay}>{dayName}</Text>
        <SymbolView
          name={weatherCodeToSymbol(weather.daily.weather_code[index])}
          size={24}
          tintColor="white"
          style={styles.forecastIcon}
        />
        <View style={styles.tempRange}>
          <Text style={styles.maxTemp}>
            {Math.round(weather.daily.temperature_2m_max[index])}
            {tempUnit}
          </Text>
          <Text style={styles.minTemp}>
            {Math.round(weather.daily.temperature_2m_min[index])}
            {tempUnit}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.forecastContainer}>
      <View style={styles.forecastHeader}>
        <Text style={styles.forecastTitle}>8-Day Forecast</Text>
        <View style={styles.forecastLabels}>
          <Text style={styles.forecastLabelMax}>Max</Text>
          <Text style={styles.forecastLabelMin}>Min</Text>
        </View>
      </View>
      <FlatList
        data={weather.daily.weather_code}
        renderItem={renderForecastItem}
        keyExtractor={(_, index) => weather.daily.time[index]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.forecastList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={['#1A237E']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  forecastContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    marginTop: 10,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  forecastLabels: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastLabelMax: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    width: 50,
    textAlign: 'right',
    marginRight: 12,
  },
  forecastLabelMin: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    width: 50,
    textAlign: 'right',
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
    width: 50,
    textAlign: 'right',
    marginRight: 12,
  },
  minTemp: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    width: 50,
    textAlign: 'right',
  },
});
