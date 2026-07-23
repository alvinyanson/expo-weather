import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SkeletonBox } from '../SkeletonBox';
import { theme } from '@/theme';

export interface DetailsScreenSkeletonProps {
  testID?: string;
}

export function DetailsScreenSkeleton({ testID = 'details-skeleton' }: DetailsScreenSkeletonProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const leftColumnContent = (
    <>
      {/* WeatherSummaryCard Skeleton */}
      <View style={styles.card}>
        <View style={styles.centerItems}>
          <SkeletonBox width={120} height={20} style={styles.mbSm} />
          <SkeletonBox width={80} height={48} style={styles.mbMd} />
        </View>
        <View style={styles.gridRow}>
          <SkeletonBox width="45%" height={60} borderRadius={theme.borderRadius.md} />
          <SkeletonBox width="45%" height={60} borderRadius={theme.borderRadius.md} />
        </View>
        <View style={[styles.gridRow, styles.mtSm]}>
          <SkeletonBox width="45%" height={60} borderRadius={theme.borderRadius.md} />
          <SkeletonBox width="45%" height={60} borderRadius={theme.borderRadius.md} />
        </View>
      </View>

      {/* PressureCard Skeleton */}
      <View style={styles.card}>
        <SkeletonBox width={140} height={20} style={styles.mbMd} />
        <SkeletonBox height={80} borderRadius={theme.borderRadius.md} />
      </View>
    </>
  );

  const rightColumnContent = (
    /* DailyForecastList Skeleton: 7 rows */
    <View style={styles.card}>
      <SkeletonBox width={140} height={20} style={styles.mbMd} />
      {Array.from({ length: 7 }).map((_, index) => (
        <View key={index} style={styles.dailyRow}>
          <SkeletonBox width={60} height={18} />
          <SkeletonBox width={24} height={24} borderRadius={12} />
          <SkeletonBox width={100} height={16} />
        </View>
      ))}
    </View>
  );

  return (
    <View testID={testID} style={styles.container}>
      {/* DetailsHeader Skeleton */}
      <View style={styles.header}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={120} height={24} />
        <SkeletonBox width={75} height={40} borderRadius={20} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={isTablet ? styles.tabletContentContainer : styles.mobileContentContainer}>
          <View style={isTablet ? styles.tabletColumnLeft : undefined}>{leftColumnContent}</View>
          <View style={isTablet ? styles.tabletColumnRight : styles.mobileColumnRight}>
            {rightColumnContent}
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    height: 90,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  tabletContentContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  mobileContentContainer: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  tabletColumnLeft: {
    flex: 1,
    gap: theme.spacing.md,
  },
  tabletColumnRight: {
    flex: 1,
  },
  mobileColumnRight: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  centerItems: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  mbSm: {
    marginBottom: theme.spacing.sm,
  },
  mbMd: {
    marginBottom: theme.spacing.md,
  },
  mtSm: {
    marginTop: theme.spacing.sm,
  },
});
