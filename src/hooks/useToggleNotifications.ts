import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const handleToggleNotifications = useCallback(
    async (value: boolean) => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in.');
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
            Alert.alert(
              'Push Token Not Available',
              'Please ensure you have granted notification permissions in your device settings.',
            );
            return;
          }

          if (!gpsLocation) {
            Alert.alert(
              'Location Not Available',
              'Please ensure you have granted location permissions to get weather alerts for your current location.',
            );
            return;
          }

          await saveUserPushToken(user.uid, token, gpsLocation.latitude, gpsLocation.longitude);
          setNotificationsEnabled(true);
          await AsyncStorage.setItem(
            `@user_push_token_last_saved_${user.uid}`,
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
          await AsyncStorage.removeItem(`@user_push_token_last_saved_${user.uid}`);
        }
      } catch (error) {
        console.error('Failed to update notification settings:', error);
        Alert.alert('Error', 'Failed to update notification settings. Please try again.');
      } finally {
        setIsUpdatingNotifications(false);
      }
    },
    [user, expoPushToken, gpsLocation, register, setNotificationsEnabled],
  );

  return {
    notificationsEnabled,
    isUpdatingNotifications,
    handleToggleNotifications,
    sendTestNotification,
  };
}
