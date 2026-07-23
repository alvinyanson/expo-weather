import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { theme } from '@/theme';

export interface OnboardingPaginationProps {
  scrollX: SharedValue<number>;
  count: number;
  slideWidth: number;
  testID?: string;
}

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  slideWidth: number;
  testID?: string;
}

function Dot({ index, scrollX, slideWidth, testID }: DotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth];
    const width = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);

    return {
      width,
      opacity,
    };
  });

  return <Animated.View testID={testID} style={[styles.dot, animatedStyle]} />;
}

export function OnboardingPagination({
  scrollX,
  count,
  slideWidth,
  testID,
}: OnboardingPaginationProps) {
  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot
          key={i}
          index={i}
          scrollX={scrollX}
          slideWidth={slideWidth}
          testID={`onboarding-dot-${i}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text,
    marginHorizontal: 4,
  },
});
