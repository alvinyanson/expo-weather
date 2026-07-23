import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WeatherHistoryRow } from '@/components/WeatherHistoryRow';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useWeatherHistory } from '@/hooks/useWeatherHistory';
import { DailyWeatherSummary, WeatherHistoryRow as WeatherHistoryRowType } from '@/interfaces';
import { theme } from '@/theme';

export default function HistoryScreen(): ReactElement {
  const router = useRouter();
  const { lat, lon, city } = useLocalSearchParams<{ lat: string; lon: string; city: string }>();

  const latitude = Number(lat);
  const longitude = Number(lon);

  const db = useDatabase();
  const { summaries, isLoading, clearHistory } = useWeatherHistory(db, latitude, longitude);

  const handleClear = async () => {
    await clearHistory();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left' }}
              size={24}
              tintColor={theme.colors.text}
            />
          </Pressable>
          <Text style={styles.headerTitle}>{city}</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.text} />
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left' }}
            size={24}
            tintColor={theme.colors.text}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {city}
        </Text>
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear history"
          style={({ pressed }) => [styles.trashButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
        >
          <SymbolView
            name={{ ios: 'trash', android: 'delete' }}
            size={22}
            tintColor={theme.colors.text}
          />
        </Pressable>
      </View>

      {summaries.length === 0 ? (
        <View style={styles.center}>
          <SymbolView
            name={{ ios: 'clock.arrow.circlepath', android: 'history' }}
            size={56}
            tintColor={theme.colors.textHint}
          />
          <Text style={styles.emptyText}>No history yet</Text>
        </View>
      ) : (
        <SectionList<WeatherHistoryRowType, DailyWeatherSummary>
          sections={summaries}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <WeatherHistoryRow row={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>{section.date}</Text>
              <Text style={styles.sectionMinMax}>
                Low: {Math.round(section.temp_min)}° High: {Math.round(section.temp_max)}°
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textHint,
    fontSize: theme.typography.sizes.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.overlay,
  },
  sectionDate: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  sectionMinMax: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
});
