import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useFetchLocation } from './useFetchLocation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { syncPushTokenIfNeeded } from '@/services';
import { reportError } from '@/services/crash.service';

/**
 * Custom hook that runs in the background to automatically synchronize
 * the user's push token and GPS coordinates to Firestore, checking
 * for location changes and caching updates in SecureStore.
 */
export function useSyncPushToken() {
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const { user } = useAuth();
  const { expoPushToken } = useNotifications();
  const { data: gpsLocation } = useFetchLocation();

  useEffect(() => {
    if (!notificationsEnabled || !user || !expoPushToken || !gpsLocation) {
      return;
    }

    const checkAndSyncPushToken = async () => {
      try {
        await syncPushTokenIfNeeded(
          user.uid,
          expoPushToken,
          gpsLocation.latitude,
          gpsLocation.longitude,
        );
      } catch (error) {
        reportError(error, { where: 'useSyncPushToken', uid: user.uid });
      }
    };

    checkAndSyncPushToken();
  }, [notificationsEnabled, user, expoPushToken, gpsLocation]);
}
