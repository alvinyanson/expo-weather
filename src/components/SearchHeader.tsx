import { useDebounce, useSearchLocation } from '@/hooks';
import { LocationSearchResult, useSearchStore } from '@/store/useSearchStore';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export const SearchHeader = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { addSearch, recentSearches } = useSearchStore();
  const { data: searchResults, isFetching: isSearching } = useSearchLocation(debouncedSearchQuery);

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

  return (
    <View style={styles.searchContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.searchCapsule, { flex: 1, marginRight: 10 }]}>
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
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
        >
          <SymbolView
            name={{ ios: 'gearshape', android: 'settings' }}
            size={24}
            tintColor="white"
          />
        </Pressable>
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
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 50,
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
  settingsButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
