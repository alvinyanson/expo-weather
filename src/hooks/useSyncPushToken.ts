import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useFetchLocation } from './useFetchLocation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { syncPushTokenIfNeeded } from '@/services';

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
        console.error('[Notification Sync Error] Failed to sync push token:', error);
      }
    };

    checkAndSyncPushToken();
  }, [notificationsEnabled, user, expoPushToken, gpsLocation]);
}
