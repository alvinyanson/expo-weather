import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { MOCK_WEATHER } from '../data/mockWeather';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handlePressWeather = () => {
    router.push('/details');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.searchContainer}>
        <View style={styles.searchCapsule}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search' }}
            size={18}
            tintColor="rgba(255, 255, 255, 0.6)"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.locationHeader}>
        <Text style={styles.cityName}>{MOCK_WEATHER.city}</Text>
        <Text style={styles.dateText}>Today, June 16</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.heroContainer, pressed && styles.heroPressed]}
        onPress={handlePressWeather}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', borderless: false }}
      >
        <SymbolView
          name={MOCK_WEATHER.icon}
          size={120}
          tintColor="white"
          type="monochrome"
          style={styles.heroIcon}
        />
        <Text style={styles.temperatureText}>{MOCK_WEATHER.temperature}°C</Text>
        <Text style={styles.conditionText}>{MOCK_WEATHER.condition}</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap for more details</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E', // Deep Sky Blue / Storm Gray inspired atmospheric solid
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif-light',
  },
  locationHeader: {
    alignItems: 'center',
    marginTop: 40,
  },
  cityName: {
    fontSize: 34,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    marginVertical: 40,
    borderRadius: 24,
  },
  heroPressed: {
    opacity: 0.8,
  },
  heroIcon: {
    marginBottom: 20,
  },
  temperatureText: {
    fontSize: 80,
    fontWeight: '200',
    color: 'white',
  },
  conditionText: {
    fontSize: 24,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
