import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import { t } from '@/services/i18n';
import * as Notifications from 'expo-notifications';
import { reportError } from '@/services/crash.service';
import { useSettingsStore } from '@/store/useSettingsStore';

const ANDROID_CHANNEL: Notifications.NotificationChannelInput = {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
};

// How notifications behave while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// EAS projectId is required to request an Expo push token.
function getProjectId(): string | undefined {
  return Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
}

async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') return true;

  Toast.show({
    type: 'info',
    text1: t('toastPermissionRequiredTitle'),
    text2: t('toastPermissionRequiredBody'),
  });
  return false;
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', ANDROID_CHANNEL);
  }

  if (!(await ensureNotificationPermission())) return undefined;

  // Push token registration
  const projectId = getProjectId();
  if (!projectId) return undefined;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    reportError(error, { where: 'registerForPushNotificationsAsync', projectId });
    return undefined;
  }
}

export function useNotifications() {
  const { expoPushToken, setExpoPushToken } = useSettingsStore();

  const register = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
      return token;
    } catch (error) {
      reportError(error, { where: 'useNotifications.register' });
      return undefined;
    }
  };

  return { expoPushToken, register };
}
