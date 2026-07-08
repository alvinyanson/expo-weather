import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@expo/ui/community/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useSavedLocations } from '@/hooks';
import { SavedLocationItem } from '@/components/SavedLocationItem';
import type { SavedLocation } from '@/interfaces';
import { theme } from '@/theme';

export default function SavedLocationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { savedLocations, isLoading, error, refetch, deleteLocation } = useSavedLocations();

  const sheetRef = useRef<BottomSheet>(null);
  const [locationToDelete, setLocationToDelete] = useState<SavedLocation | null>(null);

  const confirmDelete = (location: SavedLocation) => {
    setLocationToDelete(location);
    sheetRef.current?.expand();
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;
    try {
      await deleteLocation(locationToDelete.id);
      sheetRef.current?.close();
      Toast.show({
        type: 'success',
        text1: 'Location deleted',
        text2: `${locationToDelete.city} was removed.`,
      });
    } catch {
      sheetRef.current?.close();
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: 'Could not delete the location. Please try again.',
      });
    }
  };

  const handlePressLocation = (location: SavedLocation) => {
    router.push({
      pathname: '/details',
      params: { lat: location.lat, lon: location.lon, city: location.city },
    });
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.message}>Loading saved locations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <SymbolView
            name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
            size={48}
            tintColor="white"
          />
          <Text style={styles.message}>{error.message}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (savedLocations.length === 0) {
      return (
        <View style={styles.center}>
          <SymbolView
            name={{ ios: 'bookmark', android: 'bookmark_border' }}
            size={48}
            tintColor={theme.colors.textHint}
          />
          <Text style={styles.emptyTitle}>No saved locations yet.</Text>
          <Text style={styles.emptySubtitle}>
            Save a location from the home screen to see it here.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key={isTablet ? 'tablet' : 'mobile'}
        data={savedLocations}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={isTablet ? styles.gridItem : undefined}>
            <SavedLocationItem
              location={item}
              onDelete={confirmDelete}
              onPress={() => handlePressLocation(item)}
            />
          </View>
        )}
      />
    );
  };

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
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>{renderBody()}</View>

      <BottomSheet
        ref={sheetRef}
        snapPoints={['25%']}
        index={-1}
        enablePanDownToClose
        onClose={() => setLocationToDelete(null)}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Delete Saved Location?</Text>
          <Text style={styles.sheetSubtitle}>
            Are you sure you want to remove {locationToDelete?.city}? This action cannot be undone.
          </Text>
          <View style={styles.sheetButtons}>
            <Pressable
              testID="cancel-delete-button"
              style={[styles.sheetButton, styles.sheetCancelButton]}
              onPress={() => sheetRef.current?.close()}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              testID="confirm-delete-button"
              style={[styles.sheetButton, styles.sheetDeleteButton]}
              onPress={handleConfirmDelete}
            >
              <Text style={styles.sheetDeleteText}>Delete</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
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
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  listContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  message: {
    color: 'white',
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
  },
  emptyTitle: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    color: theme.colors.textHint,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.lg,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  columnWrapper: {
    gap: 20,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
  },
  sheetBackground: {
    backgroundColor: theme.colors.overlay,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  sheetIndicator: {
    backgroundColor: 'white',
  },
  sheetContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.sm,
  },
  sheetSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  sheetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelButton: {
    backgroundColor: theme.colors.surface,
  },
  sheetDeleteButton: {
    backgroundColor: theme.colors.danger,
  },
  sheetCancelText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
  sheetDeleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
});
