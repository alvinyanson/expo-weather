import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SkeletonBox } from '../SkeletonBox';
import { theme } from '@/theme';

export interface HomeScreenSkeletonProps {
  testID?: string;
}

export function HomeScreenSkeleton({ testID = 'home-skeleton' }: HomeScreenSkeletonProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const content = (
    <>
      <View style={isTablet ? styles.tabletColumnLeft : undefined}>
        {/* CurrentWeather Card Placeholder */}
        <View style={styles.currentWeatherCard}>
          <SkeletonBox width={140} height={24} style={styles.mbSm} />
          <SkeletonBox width={120} height={64} style={styles.mbSm} />
          <SkeletonBox width={100} height={20} />
        </View>
      </View>

      <View style={isTablet ? styles.tabletColumnRight : undefined}>
        {/* HourlyForecast Placeholder */}
        <View style={styles.hourlyContainer}>
          <SkeletonBox width={120} height={18} style={styles.mbMd} />
          <View style={styles.hourlyRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBox
                key={index}
                width={70}
                height={100}
                borderRadius={theme.borderRadius.lg}
              />
            ))}
          </View>
        </View>

        {/* Save Button Placeholder */}
        <View style={styles.saveButtonWrapper}>
          <SkeletonBox width={180} height={48} borderRadius={theme.borderRadius.round} />
        </View>

        {/* Footer Hint Placeholder */}
        <View style={styles.footer}>
          <SkeletonBox width={160} height={16} />
        </View>
      </View>
    </>
  );

  return (
    <View testID={testID} style={styles.container}>
      {/* Search Header Placeholder */}
      <View style={styles.header}>
        <SkeletonBox height={48} borderRadius={theme.borderRadius.lg} />
      </View>

      {isTablet ? (
        <View style={styles.tabletContentContainer}>{content}</View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.mobileContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.md,
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
  currentWeatherCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  hourlyContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  hourlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  saveButtonWrapper: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mbSm: {
    marginBottom: theme.spacing.sm,
  },
  mbMd: {
    marginBottom: theme.spacing.md,
  },
});
