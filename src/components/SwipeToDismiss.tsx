import type { ReactElement } from 'react';
import { shouldDismiss } from '@/utils/dismissGesture';
import { theme } from '@/theme';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface SwipeToDismissProps {
  /** Called after the dismiss animation completes (e.g. router.back). */
  onDismiss: () => void;
  children: React.ReactNode;
  /** Fraction of screen height a downward drag must exceed to commit. Default 0.25. */
  dismissDistanceRatio?: number;
  /** Downward fling velocity (px/s) that commits regardless of distance. Default 800. */
  velocityThreshold?: number;
  testID?: string;
}

export function SwipeToDismiss({
  onDismiss,
  children,
  dismissDistanceRatio = 0.25,
  velocityThreshold = 800,
  testID,
}: SwipeToDismissProps): ReactElement {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetY(15)
    .failOffsetY(-15)
    .onUpdate((event) => {
      'worklet';
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      'worklet';
      const dismissDistance = screenHeight * dismissDistanceRatio;

      if (shouldDismiss(event.translationY, event.velocityY, dismissDistance, velocityThreshold)) {
        translateY.value = withTiming(screenHeight, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, screenHeight], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View testID={testID} style={styles.wrapper}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <Animated.View style={[styles.content, contentStyle]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.overlay,
  },
  content: {
    flex: 1,
  },
});
