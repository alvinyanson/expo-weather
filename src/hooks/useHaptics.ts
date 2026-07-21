import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

// Fire-and-forget haptic helpers, gated by the hapticsEnabled setting.
export const useHaptics = () => {
  // Missing/undefined counts as enabled (default-on).
  const enabled = useSettingsStore((state) => state.hapticsEnabled) !== false;

  const selection = () => {
    if (!enabled) return;
    Haptics.selectionAsync().catch(() => {});
  };

  const success = () => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const error = () => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  const impact = (style?: Haptics.ImpactFeedbackStyle) => {
    if (!enabled) return;
    Haptics.impactAsync(style ?? Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return { selection, success, error, impact };
};
