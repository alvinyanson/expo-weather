import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { SavedLocation } from '@/interfaces';
import { formatDateFull, formatTime } from '@/utils/formatters';
import { theme } from '@/theme';
import { t } from '@/services/i18n';

export interface SavedLocationItemProps {
  location: SavedLocation;
  onDelete: (location: SavedLocation) => void;
  onPress: () => void;
  drag?: () => void;
  isActive?: boolean;
}

const ACTION_WIDTH = 88;

/** Animated red "Delete" action revealed when the row is swiped to the left. */
const RightAction = ({
  drag,
  onPress,
  city,
}: {
  drag: SharedValue<number>;
  onPress: () => void;
  city: string;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + ACTION_WIDTH }],
  }));

  return (
    <Reanimated.View style={[styles.actionContainer, animatedStyle]}>
      <Pressable
        testID="delete-location-button"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('deleteAccessLabel', { city })}
        style={({ pressed }) => [styles.deleteAction, pressed && styles.buttonPressed]}
        android_ripple={{ color: theme.colors.ripple }}
      >
        <SymbolView
          name={{ ios: 'trash', android: 'delete' }}
          size={22}
          tintColor={theme.colors.text}
        />
        <Text style={styles.deleteText}>{t('deleteLabel')}</Text>
      </Pressable>
    </Reanimated.View>
  );
};

export const SavedLocationItem = ({
  location,
  onDelete,
  onPress,
  drag,
  isActive = false,
}: SavedLocationItemProps) => {
  const savedAt = location.createdAt
    ? `${formatDateFull(location.createdAt)} · ${formatTime(location.createdAt)}`
    : null;

  return (
    <ReanimatedSwipeable
      containerStyle={styles.swipeable}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      enabled={!isActive}
      renderRightActions={(_progress, dragValue, methods) => (
        <RightAction
          drag={dragValue}
          city={location.city}
          onPress={() => {
            methods.close();
            onDelete(location);
          }}
        />
      )}
    >
      <Pressable
        testID="saved-location-item"
        style={({ pressed }) => [
          styles.card,
          isActive && styles.activeCard,
          pressed && styles.buttonPressed,
        ]}
        onPress={onPress}
        onLongPress={drag}
        disabled={isActive}
        android_ripple={{ color: theme.colors.ripple }}
        accessibilityRole="button"
        accessibilityActions={[{ name: 'delete', label: t('deleteLabel') }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'delete') {
            onDelete(location);
          }
        }}
      >
        <View style={styles.infoContainer}>
          <Text testID="saved-location-city" style={styles.city}>
            {location.city}
          </Text>
          {savedAt ? (
            <Text testID="saved-location-date" style={styles.savedAt}>
              {t('savedPrefix', { savedAt })}
            </Text>
          ) : null}
        </View>
        {drag ? (
          <Pressable
            testID="drag-handle"
            onPressIn={drag}
            onLongPress={drag}
            style={({ pressed }) => [styles.dragHandle, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('dragHandleAccessLabel', { city: location.city })}
          >
            <SymbolView
              name={{ ios: 'line.3.horizontal', android: 'drag_handle' }}
              size={22}
              tintColor={theme.colors.textHint}
            />
          </Pressable>
        ) : null}
      </Pressable>
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  swipeable: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeCard: {
    backgroundColor: theme.colors.surfaceHighlight,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dragHandle: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  city: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '600',
    color: theme.colors.text,
  },
  savedAt: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textHint,
    marginTop: theme.spacing.xs,
  },
  actionContainer: {
    width: ACTION_WIDTH,
  },
  deleteAction: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  deleteText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
