import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNetworkStore } from '@/store/useNetworkStore';
import { theme } from '@/theme';

export function OfflineIndicator() {
  const isConnected = useNetworkStore((state) => state.isConnected);

  const animatedStyle = useAnimatedStyle(() => {
    const isOffline = isConnected === false;
    return {
      height: withTiming(isOffline ? 30 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }),
      opacity: withTiming(isOffline ? 1 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }),
    };
  }, [isConnected]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.innerContainer}>
        <Text style={styles.text}>Offline. Displaying cached data.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.danger,
    width: '100%',
    overflow: 'hidden',
    zIndex: 100,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
