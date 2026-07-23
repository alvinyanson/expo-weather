import { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { OnboardingSlide } from '@/components/OnboardingSlide';
import { OnboardingPagination } from '@/components/OnboardingPagination';
import { SymbolName } from '@/utils/weatherMapper';
import { t } from '@/services/i18n';
import { theme } from '@/theme';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface SlideData {
  id: string;
  icon: SymbolName;
  titleKey: string;
  descriptionKey: string;
}

const ONBOARDING_SLIDES: SlideData[] = [
  {
    id: 'search',
    icon: { ios: 'magnifyingglass', android: 'search' },
    titleKey: 'onboardingSearchTitle',
    descriptionKey: 'onboardingSearchDescription',
  },
  {
    id: 'save',
    icon: { ios: 'bookmark.fill', android: 'bookmark_border' },
    titleKey: 'onboardingSaveTitle',
    descriptionKey: 'onboardingSaveDescription',
  },
  {
    id: 'alerts',
    icon: { ios: 'bell.fill', android: 'notifications' },
    titleKey: 'onboardingAlertsTitle',
    descriptionKey: 'onboardingAlertsDescription',
  },
];

const handleGetStarted = () => {
  useOnboardingStore.getState().completeOnboarding();
};

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    if (width > 0) {
      const index = Math.round(offsetX / width);
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < ONBOARDING_SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => (
            <OnboardingSlide
              icon={item.icon}
              title={t(item.titleKey)}
              description={t(item.descriptionKey)}
              width={width}
              testID={`onboarding-slide-${item.id}`}
            />
          )}
        />
      </View>

      <OnboardingPagination
        scrollX={scrollX}
        count={ONBOARDING_SLIDES.length}
        slideWidth={width}
        testID="onboarding-pagination"
      />

      <View style={styles.actionRow}>
        {activeIndex < ONBOARDING_SLIDES.length - 1 ? (
          <Pressable
            testID="onboarding-next"
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={handleNext}
            android_ripple={{ color: theme.colors.rippleDark }}
          >
            <Text style={styles.actionButtonText}>{t('onboardingNext')}</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="onboarding-get-started"
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={handleGetStarted}
            android_ripple={{ color: theme.colors.rippleDark }}
          >
            <Text style={styles.actionButtonText}>{t('onboardingGetStarted')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xl,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  actionButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
