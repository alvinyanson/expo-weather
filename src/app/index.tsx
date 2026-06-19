import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Keyboard,
} from 'react-native';
import { useFetchLocation, useFetchWeather, useDebounce, useSearchLocation } from '@/hooks';
import { weatherCodeToCondition, weatherCodeToSymbol } from '@/utils/weatherMapper';
import { useSearchStore, LocationSearchResult } from '@/store/useSearchStore';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { addSearch, recentSearches } = useSearchStore();

  const {
    data: gpsLocation,
    isLoading: isLoadingLocation,
    error: locationError,
    refetch: refetchLocation,
  } = useFetchLocation();

  const {
    data: weather,
    isLoading: isLoadingWeather,
    error: weatherError,
    refetch: refetchWeather,
  } = useFetchWeather(gpsLocation);

  const { data: searchResults, isFetching: isSearching } = useSearchLocation(debouncedSearchQuery);

  const handlePressWeather = () => {
    router.push({
      pathname: '/details',
      params: gpsLocation
        ? { lat: gpsLocation.latitude, lon: gpsLocation.longitude, city: gpsLocation.city }
        : {},
    });
  };

  const handleSelectLocation = (location: LocationSearchResult) => {
    Keyboard.dismiss();
    addSearch(location);
    setSearchQuery('');
    setShowRecent(false);
    router.push({
      pathname: '/details',
      params: { lat: location.latitude, lon: location.longitude, city: location.name },
    });
  };

  const isLoading = isLoadingLocation || isLoadingWeather;
  const error = locationError || weatherError;

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <SymbolView
            name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
            size={48}
            tintColor="white"
          />
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              refetchLocation();
              refetchWeather();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
          />
          {isSearching && <ActivityIndicator size="small" color="white" />}
        </View>

        {/* Search Results Dropdown */}
        {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
          <View style={styles.dropdownContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.dropdownItem} onPress={() => handleSelectLocation(item)}>
                  <Text style={styles.dropdownItemText}>
                    {item.name}
                    {item.admin1 ? `, ${item.admin1}` : ''}
                    {item.country ? `, ${item.country}` : ''}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Recent Searches Preview */}
        {showRecent && searchQuery.length === 0 && recentSearches.length > 0 && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item.id.toString() + 'recent'}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.dropdownItem} onPress={() => handleSelectLocation(item)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.recentIcon}>
                      <SymbolView
                        name={{ ios: 'clock', android: 'history' }}
                        size={18}
                        tintColor="rgba(255, 255, 255, 0.5)"
                      />
                    </View>
                    <Text style={styles.dropdownItemText}>
                      {item.name}
                      {item.admin1 ? `, ${item.admin1}` : ''}
                      {item.country ? `, ${item.country}` : ''}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Fetching weather data...</Text>
        </View>
      ) : (
        <>
          <View style={styles.locationHeader}>
            <Text style={styles.cityName}>{gpsLocation?.city}</Text>
            <Text style={styles.dateText}>
              Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.heroContainer, pressed && styles.heroPressed]}
            onPress={handlePressWeather}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', borderless: false }}
          >
            {weather && (
              <>
                <SymbolView
                  name={weatherCodeToSymbol(weather.current.weather_code)}
                  size={120}
                  tintColor="white"
                  type="monochrome"
                  style={styles.heroIcon}
                />
                <Text style={styles.temperatureText}>
                  {Math.round(weather.current.temperature_2m)}°C
                </Text>
                <Text style={styles.conditionText}>
                  {weatherCodeToCondition(weather.current.weather_code)}
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap for more details</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E', // Deep Sky Blue / Storm Gray inspired atmospheric solid
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 50, // Increased slightly for status bar safe area conceptually
    zIndex: 10,
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
  dropdownContainer: {
    backgroundColor: 'rgba(25, 35, 126, 0.95)',
    borderRadius: 15,
    marginTop: 5,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    color: 'white',
    fontSize: 16,
  },
  recentSearchesTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  recentIcon: {
    marginRight: 10,
  },
  locationHeader: {
    alignItems: 'center',
    marginTop: 20,
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
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});
