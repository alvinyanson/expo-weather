import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBatteryStore } from '@/store/useBatteryStore';
import { theme } from '@/theme';
import { t } from '@/services/i18n';

export function BatterySaverIndicator() {
  const batterySaverAware = useSettingsStore((state) => state.batterySaverAware);
  const isBatterySaverActive = useBatteryStore((state) => state.isBatterySaverActive);

  const isThrottled = batterySaverAware && isBatterySaverActive;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isThrottled ? 30 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }),
      opacity: withTiming(isThrottled ? 1 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }),
    };
  }, [isThrottled]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.innerContainer}>
        <Text style={styles.text}>{t('batterySaverBannerText')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E6A700',
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
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
