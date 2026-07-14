import { useState } from 'react';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { t } from '@/services/i18n';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useFetchLocation } from './useFetchLocation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { saveUserPushToken, clearUserPushToken } from '@/services';

export function useToggleNotifications() {
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
  const { expoPushToken, sendTestNotification, register } = useNotifications();
  const { user } = useAuth();
  const { data: gpsLocation } = useFetchLocation();
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: t('toastErrorTitle'),
        text2: t('toastMustBeLoggedIn'),
      });
      return;
    }

    setIsUpdatingNotifications(true);
    try {
      if (value) {
        let token = expoPushToken;
        if (!token) {
          token = await register();
        }

        if (!token) {
          Toast.show({
            type: 'error',
            text1: t('toastNoPushTokenTitle'),
            text2: t('toastNoPushTokenBody'),
          });
          return;
        }

        if (!gpsLocation) {
          Toast.show({
            type: 'error',
            text1: t('toastNoLocationTitle'),
            text2: t('toastNoLocationBody'),
          });
          return;
        }

        await saveUserPushToken(user.uid, token, gpsLocation.latitude, gpsLocation.longitude);
        setNotificationsEnabled(true);
        await SecureStore.setItemAsync(
          `user_push_token_last_saved_${user.uid}`,
          JSON.stringify({
            userId: user.uid,
            pushToken: token,
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
          }),
        );
      } else {
        await clearUserPushToken(user.uid);
        setNotificationsEnabled(false);
        await SecureStore.deleteItemAsync(`user_push_token_last_saved_${user.uid}`);
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      Toast.show({
        type: 'error',
        text1: t('toastErrorTitle'),
        text2: t('toastUpdateSettingsError'),
      });
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  return {
    notificationsEnabled,
    isUpdatingNotifications,
    handleToggleNotifications,
    sendTestNotification,
  };
}
