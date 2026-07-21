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
  /** When provided, a share action is shown in the header's right slot (before save). */
  onShare?: () => void;
  /** When provided, a save (bookmark) action is shown in the header's right slot. */
  onSave?: () => void;
  isSaved?: boolean;
  /** When provided, long-pressing the city name copies its coordinates. */
  onCopyCoordinates?: () => void;
}

export const DetailsHeader = ({
  city,
  weather,
  lastUpdated,
  onBack,
  onShare,
  onSave,
  isSaved = false,
  onCopyCoordinates,
}: DetailsHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSlot}>
        <Pressable
          testID="back-button"
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
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
      </View>
      <View style={styles.headerTitleContainer}>
        <Text
          testID="details-city"
          style={styles.headerCity}
          onLongPress={onCopyCoordinates}
          accessibilityHint={onCopyCoordinates ? t('copyCoordinatesHint') : undefined}
        >
          {city}
        </Text>
        <Text style={styles.headerCondition}>
          {weatherCodeToCondition(weather.current.weather_code)}
        </Text>
        {lastUpdated ? (
          <Text testID="last-updated" style={styles.lastUpdatedText}>
            {t('updatedPrefix', { time: lastUpdated })}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightSlot}>
        {onShare ? (
          <Pressable
            testID="details-share-button"
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel={t('shareLabel')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
          >
            <SymbolView
              name={{ ios: 'square.and.arrow.up', android: 'share' }}
              size={24}
              tintColor="white"
            />
          </Pressable>
        ) : null}
        {onSave ? (
          <Pressable
            testID="details-save-button"
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel={t('saveLocationLabel')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
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
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 60,
  },
  leftSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  iconButton: {
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
