import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSavedLocations } from '@/hooks';
import { SavedLocationItem } from '@/components/SavedLocationItem';
import type { SavedLocation } from '@/interfaces';
import { theme } from '@/theme';

export default function SavedLocationsScreen() {
  const router = useRouter();
  const { savedLocations, isLoading, error, refetch, deleteLocation } = useSavedLocations();

  const confirmDelete = (location: SavedLocation) => {
    Alert.alert('Delete this saved location?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLocation(location.id);
            Alert.alert('Location deleted', `${location.city} was removed.`);
          } catch {
            Alert.alert('Delete failed', 'Could not delete the location. Please try again.');
          }
        },
      },
    ]);
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
        data={savedLocations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <SavedLocationItem location={item} onDelete={confirmDelete} />}
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
});
