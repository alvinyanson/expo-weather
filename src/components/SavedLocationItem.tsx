import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { SavedLocation } from '@/interfaces';
import { formatDateFull, formatTime } from '@/utils/formatters';
import { theme } from '@/theme';
import { t } from '@/services/i18n';

interface SavedLocationItemProps {
  location: SavedLocation;
  onDelete: (location: SavedLocation) => void;
  onPress: () => void;
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

export const SavedLocationItem = ({ location, onDelete, onPress }: SavedLocationItemProps) => {
  const savedAt = location.createdAt
    ? `${formatDateFull(location.createdAt)} · ${formatTime(location.createdAt)}`
    : null;

  return (
    <ReanimatedSwipeable
      containerStyle={styles.swipeable}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      renderRightActions={(_progress, drag, methods) => (
        <RightAction
          drag={drag}
          city={location.city}
          onPress={() => {
            methods.close();
            onDelete(location);
          }}
        />
      )}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.buttonPressed]}
        onPress={onPress}
        android_ripple={{ color: theme.colors.ripple }}
        accessibilityRole="button"
        accessibilityActions={[{ name: 'delete', label: t('deleteLabel') }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'delete') {
            onDelete(location);
          }
        }}
      >
        <Text style={styles.city}>{location.city}</Text>
        {savedAt ? <Text style={styles.savedAt}>{t('savedPrefix', { savedAt })}</Text> : null}
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
    justifyContent: 'center',
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
