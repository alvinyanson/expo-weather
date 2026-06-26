import { WeatherResponse } from '@/interfaces';
import { weatherCodeToCondition, weatherCodeToSymbol } from '@/utils/weatherMapper';
import { formatHourlyTime, formatRound } from '@/utils/formatters';
import { theme } from '@/theme';
import { SymbolView } from 'expo-symbols';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface HourlyForecastProps {
  weather: WeatherResponse;
}

export const HourlyForecast = ({ weather }: HourlyForecastProps) => {
  if (!weather.hourly) return null;

  return (
    <View style={styles.hourlyContainer}>
      <Text style={styles.hourlySummary}>
        {weatherCodeToCondition(weather.current.weather_code)} conditions will continue for the rest
        of the day. Wind gusts are up to {formatRound(weather.current.wind_speed_10m)} km/h.
      </Text>
      <View style={styles.hourlyDivider} />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={weather.hourly.time.reduce((acc, time, i) => {
          if (new Date(time).getTime() >= Date.now() - 3600000 && acc.length < 24) {
            acc.push({
              time,
              temperature: weather.hourly.temperature_2m[i],
              weatherCode: weather.hourly.weather_code[i],
              precipitation: weather.hourly.precipitation_probability[i],
            });
          }
          return acc;
        }, [] as any[])}
        keyExtractor={(item) => item.time}
        contentContainerStyle={styles.hourlyListContent}
        renderItem={({ item, index }) => {
          let timeString = '';
          if (index === 0) {
            timeString = 'Now';
          } else {
            timeString = formatHourlyTime(item.time);
          }
          return (
            <View style={styles.hourlyItem}>
              <Text style={styles.hourlyTime}>{timeString}</Text>
              <SymbolView
                name={weatherCodeToSymbol(item.weatherCode)}
                size={28}
                tintColor="white"
                type="monochrome"
                style={styles.hourlyIcon}
              />
              {item.precipitation > 0 ? (
                <Text style={styles.hourlyPrecipitation}>{item.precipitation}%</Text>
              ) : (
                <View style={{ height: 16 }} />
              )}
              <Text style={styles.hourlyTemp}>{formatRound(item.temperature)}°</Text>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hourlyContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
  },
  hourlySummary: {
    color: 'white',
    fontSize: 14,
    paddingHorizontal: 15,
    marginBottom: 15,
    lineHeight: 20,
  },
  hourlyDivider: {
    height: 1,
    backgroundColor: theme.colors.surface,
    marginBottom: 15,
  },
  hourlyListContent: {
    paddingHorizontal: 10,
  },
  hourlyItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  hourlyTime: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  hourlyIcon: {
    marginBottom: 10,
  },
  hourlyPrecipitation: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  hourlyTemp: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
});
