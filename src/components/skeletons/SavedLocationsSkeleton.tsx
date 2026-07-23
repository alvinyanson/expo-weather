import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SkeletonBox } from '../SkeletonBox';
import { theme } from '@/theme';

export interface SavedLocationsSkeletonProps {
  testID?: string;
}

export function SavedLocationsSkeleton({ testID = 'saved-skeleton' }: SavedLocationsSkeletonProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const renderCard = (key: number) => (
    <View key={key} style={[styles.card, isTablet && styles.gridItem]}>
      <SkeletonBox width={140} height={24} style={styles.mbSm} />
      <SkeletonBox width={180} height={14} />
    </View>
  );

  return (
    <View testID={testID} style={styles.container}>
      {isTablet ? (
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {renderCard(1)}
            {renderCard(2)}
          </View>
          <View style={styles.gridRow}>
            {renderCard(3)}
            {renderCard(4)}
          </View>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {Array.from({ length: 4 }).map((_, index) => renderCard(index))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  listContainer: {
    gap: theme.spacing.md,
  },
  gridContainer: {
    gap: 20,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 64,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  mbSm: {
    marginBottom: theme.spacing.xs,
  },
});
