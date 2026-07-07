import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useFetchLocation } from './useFetchLocation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { saveUserPushToken } from '@/services';

/**
 * Custom hook that runs in the background to automatically synchronize
 * the user's push token and GPS coordinates to Firestore, checking
 * for location changes and caching updates in AsyncStorage.
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
      const cacheKey = `@user_push_token_last_saved_${user.uid}`;
      try {
        const cachedString = await AsyncStorage.getItem(cacheKey);
        if (cachedString) {
          const cached = JSON.parse(cachedString);
          const latDiff = Math.abs(cached.latitude - gpsLocation.latitude);
          const lonDiff = Math.abs(cached.longitude - gpsLocation.longitude);
          const isSignificantLocationChange = latDiff > 0.01 || lonDiff > 0.01;

          if (
            cached.userId === user.uid &&
            cached.pushToken === expoPushToken &&
            !isSignificantLocationChange
          ) {
            return;
          }
        }

        await saveUserPushToken(
          user.uid,
          expoPushToken,
          gpsLocation.latitude,
          gpsLocation.longitude,
        );

        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({
            userId: user.uid,
            pushToken: expoPushToken,
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
          }),
        );
      } catch (error) {
        console.error('[Notification Sync Error] Failed to sync push token:', error);
      }
    };

    checkAndSyncPushToken();
  }, [notificationsEnabled, user, expoPushToken, gpsLocation]);
}
