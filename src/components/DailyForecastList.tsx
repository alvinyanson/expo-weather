import { weatherCodeToSymbol, getIconTintColor } from '@/utils/weatherMapper';
import { formatDayName, formatRound } from '@/utils/formatters';
import { theme } from '@/theme';
import { SymbolView } from 'expo-symbols';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { WeatherResponse } from '@/interfaces';
import { t } from '@/services/i18n';

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
    const time = weather.daily.time[index];
    const code = weather.daily.weather_code[index];
    const maxTemp = weather.daily.temperature_2m_max[index];
    const minTemp = weather.daily.temperature_2m_min[index];

    if (
      time === undefined ||
      code === undefined ||
      maxTemp === undefined ||
      minTemp === undefined
    ) {
      return null;
    }

    const dayName = formatDayName(time);

    return (
      <View style={styles.forecastRow}>
        <Text style={styles.forecastDay}>{dayName}</Text>
        <SymbolView
          name={weatherCodeToSymbol(code)}
          size={24}
          tintColor={getIconTintColor(code)}
          style={styles.forecastIcon}
          accessible={false}
          importantForAccessibility="no"
        />
        <View style={styles.tempRange}>
          <Text style={styles.maxTemp}>
            {formatRound(maxTemp)}
            {tempUnit}
          </Text>
          <Text style={styles.minTemp}>
            {formatRound(minTemp)}
            {tempUnit}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.forecastContainer}>
      <View style={styles.forecastHeader}>
        <Text style={styles.forecastTitle}>{t('forecastTitle')}</Text>
        <View style={styles.forecastLabels}>
          <Text style={styles.forecastLabelMax}>{t('forecastMax')}</Text>
          <Text style={styles.forecastLabelMin}>{t('forecastMin')}</Text>
        </View>
      </View>
      <FlatList
        data={weather.daily.weather_code}
        renderItem={renderForecastItem}
        keyExtractor={(_, index) => weather.daily.time[index] ?? String(index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.forecastList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  forecastContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
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
    color: theme.colors.textHint,
    textTransform: 'uppercase',
    width: 50,
    textAlign: 'right',
    marginRight: 12,
  },
  forecastLabelMin: {
    fontSize: 12,
    color: theme.colors.textHint,
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
    borderBottomColor: theme.colors.borderLight,
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
    color: theme.colors.textHint,
    width: 50,
    textAlign: 'right',
  },
});
