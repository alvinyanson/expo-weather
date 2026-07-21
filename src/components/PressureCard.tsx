import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useBarometer } from '@/hooks/useBarometer';
import { formatPressure } from '@/utils/formatters';
import { theme } from '@/theme';
import { t } from '@/services/i18n';

interface PressureCardProps {
  forecastPressure?: number; // weather.current.surface_pressure (hPa), may be undefined for stale cache
}

// Builds the sensor-vs-forecast comparison note. Threshold is 1 hPa.
const comparisonNote = (pressure: number, forecastPressure: number): string => {
  const delta = Math.round(pressure - forecastPressure);
  if (Math.abs(delta) <= 1) return t('pressureMatchesForecast');
  if (delta > 1) return t('pressureAboveForecast', { delta });
  return t('pressureBelowForecast', { delta: Math.abs(delta) });
};

export const PressureCard = ({ forecastPressure }: PressureCardProps) => {
  const { status, pressure } = useBarometer();
  const hasForecast = typeof forecastPressure === 'number';

  return (
    <View testID="pressure-card" style={styles.card}>
      <Text style={styles.title}>{t('pressureCardTitle')}</Text>

      {status === 'checking' && (
        <View style={styles.checkingRow}>
          <ActivityIndicator color="white" />
          <Text style={styles.hint}>{t('pressureChecking')}</Text>
        </View>
      )}

      {status === 'unavailable' && (
        <View>
          <Text style={styles.hint}>{t('pressureUnavailable')}</Text>
          {hasForecast && (
            <View style={styles.row}>
              <Text style={styles.label}>{t('pressureForecastLabel')}</Text>
              <Text style={styles.value}>
                {formatPressure(forecastPressure)} {t('pressureUnit')}
              </Text>
            </View>
          )}
        </View>
      )}

      {status === 'available' && pressure != null && (
        <View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('pressureSensorLabel')}</Text>
            <Text style={styles.value}>
              {formatPressure(pressure)} {t('pressureUnit')}
            </Text>
          </View>
          {hasForecast && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>{t('pressureForecastLabel')}</Text>
                <Text style={styles.value}>
                  {formatPressure(forecastPressure)} {t('pressureUnit')}
                </Text>
              </View>
              <Text style={styles.note}>{comparisonNote(pressure, forecastPressure)}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textHint,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textHint,
  },
  note: {
    fontSize: 13,
    color: theme.colors.textHint,
    marginTop: 4,
  },
});
