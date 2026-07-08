import { useCallback } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import apiClient from '@/services/api.client';
import { useSettingsStore } from '@/store/useSettingsStore';

// Expo push service endpoint. Passing an absolute URL to apiClient bypasses its
// (Open-Meteo) baseURL while still reusing the shared error interceptor.
const EXPO_PUSH_ENDPOINT = process.env.EXPO_PUBLIC_EXPO_PUSH_ENDPOINT;

const ANDROID_CHANNEL: Notifications.NotificationChannelInput = {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
};

interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

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
    text1: 'Permission required',
    text2: 'Enable notifications in settings to receive alerts.',
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
    console.log('Expo push token:', data);
    return data;
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
    return undefined;
  }
}

export function useNotifications() {
  const { expoPushToken, setExpoPushToken } = useSettingsStore();

  const register = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
      return token;
    } catch (error) {
      console.warn('Push registration error:', error);
      return undefined;
    }
  }, [setExpoPushToken]);

  // Sends a remote push notification to this device via the Expo push service,
  // using the registered push token.
  const sendTestNotification = useCallback(async () => {
    if (!expoPushToken) {
      Toast.show({
        type: 'error',
        text1: 'Not ready',
        text2: 'Push token is not available yet.',
      });
      return;
    }

    if (!EXPO_PUSH_ENDPOINT) {
      console.warn('EXPO_PUBLIC_EXPO_PUSH_ENDPOINT is not configured.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Push service is not configured.',
      });
      return;
    }

    const message: ExpoPushMessage = {
      to: expoPushToken,
      sound: 'default',
      title: 'Test Notification',
      body: 'Your notifications are set up and working!',
      data: { source: 'settings-test' },
    };

    try {
      await apiClient.post(EXPO_PUSH_ENDPOINT, message);
    } catch (error) {
      console.warn('Failed to send test notification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not send the test notification.',
      });
    }
  }, [expoPushToken]);

  return { expoPushToken, sendTestNotification, register };
}
