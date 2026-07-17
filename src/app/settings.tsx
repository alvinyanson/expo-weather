import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAuth, useToggleNotifications } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { theme } from '@/theme';
import { t } from '@/services/i18n';
import crashlytics from '@react-native-firebase/crashlytics';
import { reportError, logBreadcrumb } from '@/services/crash.service';

const handleTestCrash = () => {
  crashlytics().crash();
};

// Demonstrates a non-fatal: leaves breadcrumbs, then records a handled error.
// The dashboard issue shows the breadcrumb trail plus the context custom keys.
const handleTestNonFatal = () => {
  logBreadcrumb('[Demo] user opened settings');
  logBreadcrumb('[Demo] tapped test non-fatal');
  reportError(new Error('Test non-fatal from settings'), {
    where: 'settings.handleTestNonFatal',
    demo: 'true',
  });
};

export default function SettingsScreen() {
  const router = useRouter();
  const {
    temperatureUnit,
    windSpeedUnit,
    setTemperatureUnit,
    setWindSpeedUnit,
    language,
    setLanguage,
  } = useSettingsStore();

  const {
    notificationsEnabled,
    isUpdatingNotifications,
    handleToggleNotifications,
    sendTestNotification,
  } = useToggleNotifications();

  const { user, signOut } = useAuth();

  // On sign-out the auth listener clears the store and the root layout
  // redirects to the login screen.
  const accountLabel = user?.isAnonymous
    ? t('guestValue')
    : (user?.email ?? user?.displayName ?? t('signedInValue'));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Pressable
          testID="settings-back-button"
          onPress={() => router.back()}
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
        <Text testID="settings-title" style={styles.headerTitle}>
          {t('settingsTitle')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>{t('tempUnitLabel')}</Text>
            <Text testID={`temp-desc-${temperatureUnit}`} style={styles.settingDescription}>
              {temperatureUnit === 'celsius' ? t('celsiusDesc') : t('fahrenheitDesc')}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Pressable
              testID="temp-toggle-celsius"
              style={[
                styles.toggleButton,
                temperatureUnit === 'celsius' && styles.toggleButtonActive,
              ]}
              onPress={() => setTemperatureUnit('celsius')}
              accessibilityRole="switch"
              accessibilityState={{ checked: temperatureUnit === 'celsius' }}
            >
              <Text
                style={[
                  styles.toggleText,
                  temperatureUnit === 'celsius' && styles.toggleTextActive,
                ]}
              >
                °C
              </Text>
            </Pressable>
            <Pressable
              testID="temp-toggle-fahrenheit"
              style={[
                styles.toggleButton,
                temperatureUnit === 'fahrenheit' && styles.toggleButtonActive,
              ]}
              onPress={() => setTemperatureUnit('fahrenheit')}
              accessibilityRole="switch"
              accessibilityState={{ checked: temperatureUnit === 'fahrenheit' }}
            >
              <Text
                style={[
                  styles.toggleText,
                  temperatureUnit === 'fahrenheit' && styles.toggleTextActive,
                ]}
              >
                °F
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>{t('windUnitLabel')}</Text>
            <Text style={styles.settingDescription}>
              {windSpeedUnit === 'kmh' ? t('kmhDesc') : t('mphDesc')}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Pressable
              testID="wind-toggle-kmh"
              style={[styles.toggleButton, windSpeedUnit === 'kmh' && styles.toggleButtonActive]}
              onPress={() => setWindSpeedUnit('kmh')}
              accessibilityRole="switch"
              accessibilityState={{ checked: windSpeedUnit === 'kmh' }}
            >
              <Text style={[styles.toggleText, windSpeedUnit === 'kmh' && styles.toggleTextActive]}>
                km/h
              </Text>
            </Pressable>
            <Pressable
              testID="wind-toggle-mph"
              style={[styles.toggleButton, windSpeedUnit === 'mph' && styles.toggleButtonActive]}
              onPress={() => setWindSpeedUnit('mph')}
              accessibilityRole="switch"
              accessibilityState={{ checked: windSpeedUnit === 'mph' }}
            >
              <Text style={[styles.toggleText, windSpeedUnit === 'mph' && styles.toggleTextActive]}>
                mph
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>{t('languageLabel')}</Text>
            <Text style={styles.settingDescription}>
              {language === 'system'
                ? t('systemLanguage')
                : language === 'en'
                  ? t('englishLanguage')
                  : t('japaneseLanguage')}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Pressable
              testID="language-toggle-system"
              style={[styles.toggleButton, language === 'system' && styles.toggleButtonActive]}
              onPress={() => setLanguage('system')}
              accessibilityRole="switch"
              accessibilityState={{ checked: language === 'system' }}
            >
              <Text style={[styles.toggleText, language === 'system' && styles.toggleTextActive]}>
                Sys
              </Text>
            </Pressable>
            <Pressable
              testID="language-toggle-en"
              style={[styles.toggleButton, language === 'en' && styles.toggleButtonActive]}
              onPress={() => setLanguage('en')}
              accessibilityRole="switch"
              accessibilityState={{ checked: language === 'en' }}
            >
              <Text style={[styles.toggleText, language === 'en' && styles.toggleTextActive]}>
                EN
              </Text>
            </Pressable>
            <Pressable
              testID="language-toggle-ja"
              style={[styles.toggleButton, language === 'ja' && styles.toggleButtonActive]}
              onPress={() => setLanguage('ja')}
              accessibilityRole="switch"
              accessibilityState={{ checked: language === 'ja' }}
            >
              <Text style={[styles.toggleText, language === 'ja' && styles.toggleTextActive]}>
                JA
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>{t('alertsLabel')}</Text>
            <Text style={styles.settingDescription}>{t('alertsDesc')}</Text>
          </View>
          <View style={styles.toggleContainer}>
            {isUpdatingNotifications ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Switch
                testID="weather-alerts-switch"
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                thumbColor={notificationsEnabled ? 'white' : '#f4f3f4'}
              />
            )}
          </View>
        </View>

        {notificationsEnabled && (
          <View style={styles.testButtonWrapper}>
            <Pressable
              testID="test-notification-button"
              style={({ pressed }) => [styles.testButton, pressed && styles.buttonPressed]}
              onPress={sendTestNotification}
              android_ripple={{ color: theme.colors.ripple }}
            >
              <Text style={styles.testButtonText}>{t('testNotification')}</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.testButtonWrapper, notificationsEnabled && { marginTop: 16 }]}>
          <Pressable
            testID="test-crash-button"
            style={({ pressed }) => [styles.testButton, pressed && styles.buttonPressed]}
            onPress={handleTestCrash}
            android_ripple={{ color: theme.colors.ripple }}
          >
            <Text style={styles.testButtonText}>{t('testCrash')}</Text>
          </Pressable>
        </View>

        <View style={[styles.testButtonWrapper, { marginTop: 16 }]}>
          <Pressable
            testID="test-non-fatal-button"
            style={({ pressed }) => [styles.testButton, pressed && styles.buttonPressed]}
            onPress={handleTestNonFatal}
            android_ripple={{ color: theme.colors.ripple }}
          >
            <Text style={styles.testButtonText}>{t('testNonFatal')}</Text>
          </Pressable>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>{t('accountLabel')}</Text>
            <Text testID="account-value" style={styles.settingDescription}>
              {accountLabel}
            </Text>
          </View>
        </View>

        <View style={styles.signOutButtonWrapper}>
          <Pressable
            testID="sign-out-button"
            style={({ pressed }) => [styles.signOutButton, pressed && styles.buttonPressed]}
            onPress={signOut}
            android_ripple={{ color: theme.colors.ripple }}
          >
            <Text style={styles.signOutButtonText}>{t('signOut')}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  buttonPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
  },
  labelContainer: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textHint,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: theme.colors.primary,
  },
  testButtonWrapper: {
    borderRadius: 8,
    marginTop: 30,
    overflow: 'hidden',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingVertical: 14,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  signOutButtonWrapper: {
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderError,
    overflow: 'hidden',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
