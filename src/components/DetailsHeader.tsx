import { weatherCodeToCondition } from '@/utils/weatherMapper';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeatherResponse } from '@/interfaces';
import { theme } from '@/theme';
import { t } from '@/services/i18n';

interface DetailsHeaderProps {
  city: string;
  weather: WeatherResponse;
  lastUpdated: string;
  onBack: () => void;
  /** When provided, a save (bookmark) action is shown in the header's right slot. */
  onSave?: () => void;
  isSaved?: boolean;
}

export const DetailsHeader = ({
  city,
  weather,
  lastUpdated,
  onBack,
  onSave,
  isSaved = false,
}: DetailsHeaderProps) => {
  return (
    <View style={styles.header}>
      <Pressable
        testID="back-button"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
        accessibilityRole="button"
        accessibilityLabel={t('goBack')}
      >
        <SymbolView
          name={{ ios: 'chevron.left', android: 'chevron_left' }}
          size={24}
          tintColor="white"
        />
      </Pressable>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerCity}>{city}</Text>
        <Text style={styles.headerCondition}>
          {weatherCodeToCondition(weather.current.weather_code)}
        </Text>
        {lastUpdated ? (
          <Text testID="last-updated" style={styles.lastUpdatedText}>
            {t('updatedPrefix', { time: lastUpdated })}
          </Text>
        ) : null}
      </View>
      {onSave ? (
        <Pressable
          testID="details-save-button"
          onPress={onSave}
          accessibilityRole="button"
          accessibilityLabel={t('saveLocationLabel')}
          style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
        >
          <SymbolView
            name={{
              ios: isSaved ? 'bookmark.fill' : 'bookmark',
              android: isSaved ? 'bookmark' : 'bookmark_border',
            }}
            size={24}
            tintColor={isSaved ? theme.colors.accent : 'white'}
          />
        </Pressable>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  saveButton: {
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
    color: theme.colors.textMuted,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: theme.colors.textHint,
    marginTop: 2,
  },
});
