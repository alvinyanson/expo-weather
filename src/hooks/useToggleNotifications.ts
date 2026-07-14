import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { t } from '@/services/i18n';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useFetchLocation } from './useFetchLocation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { syncPushTokenIfNeeded, clearPushTokenSecurely } from '@/services';
import { reportError } from '@/services/crash.service';

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

        await syncPushTokenIfNeeded(
          user.uid,
          token,
          gpsLocation.latitude,
          gpsLocation.longitude,
          true,
        );
        setNotificationsEnabled(true);
      } else {
        await clearPushTokenSecurely(user.uid);
        setNotificationsEnabled(false);
      }
    } catch (error) {
      reportError(error, { where: 'useToggleNotifications', uid: user.uid });
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
