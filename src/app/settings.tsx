import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { temperatureUnit, windSpeedUnit, setTemperatureUnit, setWindSpeedUnit } =
    useSettingsStore();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true, radius: 24 }}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#1A237E',
  },
});
