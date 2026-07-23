import { useMemo } from 'react';
import { WeatherResponse } from '@/interfaces';
import {
  weatherCodeToCondition,
  weatherCodeToSymbol,
  getIconTintColor,
} from '@/utils/weatherMapper';
import { formatHourlyTime, formatRound } from '@/utils/formatters';
import { selectNext24Hours } from '@/utils/hourlyChart';
import { theme } from '@/theme';
import { SymbolView } from 'expo-symbols';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/services/i18n';

interface HourlyForecastProps {
  weather: WeatherResponse;
}

export const HourlyForecast = ({ weather }: HourlyForecastProps) => {
  const windSpeedUnit = useSettingsStore((state) => state.windSpeedUnit);
  const windUnit = windSpeedUnit === 'kmh' ? 'km/h' : 'mph';

  const hourlyData = useMemo(() => {
    if (!weather.hourly) return [];
    const points = selectNext24Hours(weather.hourly);
    return points.map((pt) => {
      const idx = weather.hourly?.time.indexOf(pt.time) ?? -1;
      return {
        time: pt.time,
        temperature: pt.temperature,
        precipitation: pt.precipitation,
        weatherCode: idx >= 0 ? (weather.hourly?.weather_code[idx] ?? 0) : 0,
      };
    });
  }, [weather.hourly]);

  if (!weather.hourly) return null;

  return (
    <View testID="hourly-forecast" style={styles.hourlyContainer}>
      <Text style={styles.hourlySummary}>
        {t('hourlySummary', {
          condition: weatherCodeToCondition(weather.current.weather_code),
          windSpeed: formatRound(weather.current.wind_speed_10m),
          windUnit: windUnit,
        })}
      </Text>
      <View style={styles.hourlyDivider} />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={hourlyData}
        keyExtractor={(item) => item.time}
        contentContainerStyle={styles.hourlyListContent}
        renderItem={({ item, index }) => {
          let timeString = '';
          if (index === 0) {
            timeString = t('nowText');
          } else {
            timeString = formatHourlyTime(item.time);
          }
          return (
            <View style={styles.hourlyItem}>
              <Text style={styles.hourlyTime}>{timeString}</Text>
              <SymbolView
                name={weatherCodeToSymbol(item.weatherCode)}
                size={28}
                tintColor={getIconTintColor(item.weatherCode)}
                type="monochrome"
                style={styles.hourlyIcon}
                accessible={false}
                importantForAccessibility="no"
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
