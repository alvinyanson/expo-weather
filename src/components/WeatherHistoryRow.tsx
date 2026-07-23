import { SymbolView } from 'expo-symbols';
import { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeatherHistoryRow as WeatherHistoryRowType } from '@/interfaces';
import { theme } from '@/theme';
import { formatTime } from '@/utils/formatters';
import { weatherCodeToSymbol, getIconTintColor } from '@/utils/weatherMapper';

type Props = {
  row: WeatherHistoryRowType;
};

export const WeatherHistoryRow = ({ row }: Props): ReactElement => {
  const tempUnit = row.temperature_unit === 'celsius' ? '°C' : '°F';
  const windUnit = row.wind_speed_unit === 'kmh' ? 'km/h' : 'mph';
  const symbolName = weatherCodeToSymbol(row.weather_code);
  const tintColor = getIconTintColor(row.weather_code);
  const timeLabel = formatTime(row.fetched_at);
  const pressureLabel = row.pressure != null ? `${Math.round(row.pressure)} hPa` : '—';

  return (
    <View style={styles.container}>
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{timeLabel}</Text>
      </View>

      <View style={styles.iconColumn}>
        <SymbolView name={symbolName} size={22} tintColor={tintColor} />
      </View>

      <View style={styles.tempColumn}>
        <Text style={styles.temp}>
          {Math.round(row.temperature)}
          {tempUnit}
        </Text>
      </View>

      <View style={styles.detailsColumn}>
        <View style={styles.metricRow}>
          <SymbolView
            name={{ ios: 'drop.fill', android: 'water_drop' }}
            size={12}
            tintColor={theme.colors.textMuted}
          />
          <Text style={styles.detailText}>{row.humidity}%</Text>
        </View>

        <View style={styles.metricRow}>
          <SymbolView
            name={{ ios: 'wind', android: 'air' }}
            size={12}
            tintColor={theme.colors.textMuted}
          />
          <Text style={styles.detailText}>
            {Math.round(row.wind_speed)} {windUnit}
          </Text>
        </View>
      </View>

      <View style={styles.pressureColumn}>
        <View style={styles.metricRow}>
          <SymbolView
            name={{ ios: 'gauge.with.dots.needle.bottom.100percent', android: 'speed' }}
            size={12}
            tintColor={theme.colors.textMuted}
          />
          <Text style={styles.detailText}>{pressureLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  timeColumn: {
    width: 64,
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
  },
  iconColumn: {
    width: 28,
    alignItems: 'center',
  },
  tempColumn: {
    width: 52,
  },
  temp: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  detailsColumn: {
    flex: 1,
    gap: 2,
  },
  pressureColumn: {
    alignItems: 'flex-end',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
  },
});
