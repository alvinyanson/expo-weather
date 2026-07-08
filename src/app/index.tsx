import { useFetchLocation, useFetchWeather, useSavedLocations, useSyncPushToken } from '@/hooks';
import { theme } from '@/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { SearchHeader } from '@/components/SearchHeader';
import { CurrentWeather } from '@/components/CurrentWeather';
import { HourlyForecast } from '@/components/HourlyForecast';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const tempUnit = temperatureUnit === 'celsius' ? '°C' : '°F';

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

  const { savedLocations, saveLocation, deleteLocation } = useSavedLocations();

  // Synchronize notifications token and coordinates in the background
  useSyncPushToken();

  const matchingSaved = gpsLocation
    ? savedLocations.find(
        (loc) =>
          loc.city.toLowerCase() === gpsLocation.city.toLowerCase() ||
          (Math.abs(loc.lat - gpsLocation.latitude) < 0.01 &&
            Math.abs(loc.lon - gpsLocation.longitude) < 0.01),
      )
    : undefined;

  const isSaved = !!matchingSaved;

  const handlePressWeather = () => {
    router.push({
      pathname: '/details',
      params: gpsLocation
        ? { lat: gpsLocation.latitude, lon: gpsLocation.longitude, city: gpsLocation.city }
        : {},
    });
  };

  const handleSaveLocation = async () => {
    if (!gpsLocation) return;
    try {
      if (isSaved && matchingSaved) {
        await deleteLocation(matchingSaved.id);
        Toast.show({
          type: 'success',
          text1: 'Deleted',
          text2: 'Location removed from saved list.',
        });
      } else {
        await saveLocation({
          city: gpsLocation.city,
          lat: gpsLocation.latitude,
          lon: gpsLocation.longitude,
        });
        Toast.show({
          type: 'success',
          text1: 'Saved',
          text2: 'Location saved successfully.',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not update saved location. Please try again.',
      });
    }
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

  const renderContent = () => {
    const content = (
      <>
        <View style={isTablet ? styles.tabletColumnLeft : undefined}>
          {weather && (
            <CurrentWeather
              city={gpsLocation?.city}
              weather={weather}
              tempUnit={tempUnit}
              onPress={handlePressWeather}
            />
          )}
        </View>

        <View style={isTablet ? styles.tabletColumnRight : undefined}>
          {weather && <HourlyForecast weather={weather} />}

          {weather && gpsLocation && (
            <View style={styles.saveButtonWrapper}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  isSaved && styles.saveButtonSaved,
                  pressed && styles.saveButtonPressed,
                ]}
                onPress={handleSaveLocation}
                android_ripple={{ color: theme.colors.ripple }}
              >
                <>
                  <SymbolView
                    name={{
                      ios: isSaved ? 'bookmark.fill' : 'bookmark',
                      android: isSaved ? 'bookmark' : 'bookmark_border',
                    }}
                    size={18}
                    tintColor={isSaved ? theme.colors.accent : 'white'}
                  />
                  <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                    {isSaved ? 'Saved' : 'Save Location'}
                  </Text>
                </>
              </Pressable>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap for more details</Text>
          </View>
        </View>
      </>
    );

    if (isTablet) {
      return <View style={styles.tabletContentContainer}>{content}</View>;
    }

    return (
      <ScrollView
        contentContainerStyle={styles.mobileContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SearchHeader />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Fetching weather data...</Text>
        </View>
      ) : (
        renderContent()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabletContentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  mobileContentContainer: {
    flexGrow: 1,
    flexDirection: 'column',
  },
  tabletColumnLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  tabletColumnRight: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  saveButtonWrapper: {
    alignSelf: 'center',
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: 180,
    minHeight: 48,
  },
  saveButtonSaved: {
    backgroundColor: 'rgba(246, 173, 85, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(246, 173, 85, 0.3)',
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
  saveButtonTextSaved: {
    color: theme.colors.accent,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textHint,
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
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});
