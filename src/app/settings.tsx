import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAuth, useToggleNotifications } from '@/hooks';
import { useSettingsStore } from '@/store/useSettingsStore';
import { theme } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { temperatureUnit, windSpeedUnit, setTemperatureUnit, setWindSpeedUnit } =
    useSettingsStore();

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
    ? 'Guest'
    : (user?.email ?? user?.displayName ?? 'Signed in');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: theme.colors.ripple, borderless: true, radius: 24 }}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left' }}
            size={24}
            tintColor="white"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>Temperature Unit</Text>
            <Text style={styles.settingDescription}>
              {temperatureUnit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Pressable
              style={[
                styles.toggleButton,
                temperatureUnit === 'celsius' && styles.toggleButtonActive,
              ]}
              onPress={() => setTemperatureUnit('celsius')}
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
              style={[
                styles.toggleButton,
                temperatureUnit === 'fahrenheit' && styles.toggleButtonActive,
              ]}
              onPress={() => setTemperatureUnit('fahrenheit')}
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
            <Text style={styles.settingLabel}>Wind Speed Unit</Text>
            <Text style={styles.settingDescription}>
              {windSpeedUnit === 'kmh' ? 'Kilometers per hour' : 'Miles per hour'}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleButton, windSpeedUnit === 'kmh' && styles.toggleButtonActive]}
              onPress={() => setWindSpeedUnit('kmh')}
            >
              <Text style={[styles.toggleText, windSpeedUnit === 'kmh' && styles.toggleTextActive]}>
                km/h
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, windSpeedUnit === 'mph' && styles.toggleButtonActive]}
              onPress={() => setWindSpeedUnit('mph')}
            >
              <Text style={[styles.toggleText, windSpeedUnit === 'mph' && styles.toggleTextActive]}>
                mph
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>Weather Alerts</Text>
            <Text style={styles.settingDescription}>
              Get notified of weather updates at current location
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            {isUpdatingNotifications ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Switch
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
              style={({ pressed }) => [styles.testButton, pressed && styles.buttonPressed]}
              onPress={sendTestNotification}
              android_ripple={{ color: theme.colors.ripple }}
            >
              <Text style={styles.testButtonText}>Test Notification</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>Account</Text>
            <Text style={styles.settingDescription}>{accountLabel}</Text>
          </View>
        </View>

        <View style={styles.signOutButtonWrapper}>
          <Pressable
            style={({ pressed }) => [styles.signOutButton, pressed && styles.buttonPressed]}
            onPress={signOut}
            android_ripple={{ color: theme.colors.ripple }}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
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
    paddingVertical: 8,
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
