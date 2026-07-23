import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { t } from '@/services/i18n';
import { useSavedLocations } from '@/hooks';
import { SavedLocationItem } from '@/components/SavedLocationItem';
import { SavedLocationsSkeleton } from '@/components/skeletons/SavedLocationsSkeleton';
import type { SavedLocation } from '@/interfaces';
import { theme } from '@/theme';

export default function SavedLocationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { savedLocations, isLoading, error, refetch, confirmDeleteLocation } = useSavedLocations();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<SavedLocation | null>(null);

  const confirmDelete = (location: SavedLocation) => {
    setLocationToDelete(location);
    setIsModalVisible(true);
  };

  const handleConfirmDelete = () => {
    confirmDeleteLocation(locationToDelete, () => setIsModalVisible(false));
  };

  const handlePressLocation = (location: SavedLocation) => {
    router.push({
      pathname: '/details',
      params: { lat: location.lat, lon: location.lon, city: location.city },
    });
  };

  const renderBody = () => {
    if (isLoading) {
      return <SavedLocationsSkeleton />;
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
            <Text style={styles.retryText}>{t('retryText')}</Text>
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
          <Text testID="saved-empty" style={styles.emptyTitle}>
            {t('emptySavedTitle')}
          </Text>
          <Text style={styles.emptySubtitle}>{t('emptySavedSubtitle')}</Text>
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
          testID="saved-back-button"
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
        <Text testID="saved-title" style={styles.headerTitle}>
          {t('savedLocationsTitle')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>{renderBody()}</View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('deleteModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('deleteModalSubtitle', { city: locationToDelete?.city })}
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                testID="cancel-delete-button"
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                testID="confirm-delete-button"
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteText}>{t('deleteLabel')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.overlay,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 64,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: theme.colors.surface,
  },
  modalDeleteButton: {
    backgroundColor: theme.colors.danger,
  },
  modalCancelText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
  modalDeleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
});
