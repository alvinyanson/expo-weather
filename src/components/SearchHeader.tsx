import { useDebounce, useSearchLocation } from '@/hooks';
import { useSearchStore } from '@/store/useSearchStore';
import { LocationSearchResult } from '@/interfaces';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { theme } from '@/theme';
import { t } from '@/services/i18n';
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
      {showRecent && (
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            Keyboard.dismiss();
          }}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.searchCapsule, { flex: 1, marginRight: 10 }]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search' }}
            size={18}
            tintColor={theme.colors.textHint}
            style={styles.searchIcon}
          />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            accessibilityLabel={t('searchPlaceholder')}
            placeholderTextColor={theme.colors.textHint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
          />
          {isSearching && <ActivityIndicator size="small" color="white" />}
        </View>
        <Pressable
          testID="map-button"
          onPress={() => router.push('/map')}
          style={({ pressed }) => [
            styles.settingsButton,
            { marginRight: 10 },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('mapButtonLabel')}
        >
          <SymbolView name={{ ios: 'map', android: 'map' }} size={24} tintColor="white" />
        </Pressable>
        <Pressable
          testID="saved-locations-button"
          onPress={() => router.push('/saved')}
          style={({ pressed }) => [
            styles.settingsButton,
            { marginRight: 10 },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('savedLocationsLabel')}
        >
          <SymbolView
            name={{ ios: 'bookmark', android: 'bookmark_border' }}
            size={24}
            tintColor="white"
          />
        </Pressable>
        <Pressable
          testID="settings-button"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('settingsTitle')}
        >
          <SymbolView
            name={{ ios: 'gearshape', android: 'settings' }}
            size={24}
            tintColor="white"
          />
        </Pressable>
      </View>

      {/* Search Results Dropdown */}
      {showRecent && searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
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
          <Text style={styles.recentSearchesTitle}>{t('recentSearchesTitle')}</Text>
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
                      tintColor={theme.colors.textHint}
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
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  settingsButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: theme.colors.surface,
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
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.overlay,
    borderRadius: 15,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dropdownItemText: {
    color: 'white',
    fontSize: 16,
  },
  recentSearchesTitle: {
    color: theme.colors.textHint,
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
  backdrop: {
    position: 'absolute',
    top: -500,
    left: -500,
    right: -500,
    bottom: -2000,
    backgroundColor: 'transparent',
  },
});
