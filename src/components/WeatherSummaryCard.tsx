import { weatherCodeToSymbol } from '@/utils/weatherMapper';
import { formatRound } from '@/utils/formatters';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { WeatherResponse } from '@/interfaces';

interface WeatherSummaryCardProps {
  weather: WeatherResponse;
  tempUnit: string;
  windUnit: string;
}

export const WeatherSummaryCard = ({ weather, tempUnit, windUnit }: WeatherSummaryCardProps) => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryMain}>
        <Text style={styles.summaryTemp}>
          {formatRound(weather.current.temperature_2m)}
          {tempUnit}
        </Text>
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
          <Text style={styles.detailValue}>
            {weather.current.wind_speed_10m} {windUnit}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>UV Index</Text>
          <Text style={styles.detailValue}>{formatRound(weather.daily.uv_index_max[0])}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
