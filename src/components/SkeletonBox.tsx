import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '@/theme';

export interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SkeletonBox({
  width = '100%',
  height = 20,
  borderRadius = theme.borderRadius.md,
  style,
  testID,
}: SkeletonBoxProps) {
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 800 }), withTiming(0.75, { duration: 800 })),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surface,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}
