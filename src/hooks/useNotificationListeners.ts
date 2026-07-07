import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useNotificationListeners() {
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);

  useEffect(() => {
    if (!notificationsEnabled) return;

    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response.notification.request.content.title);
    });

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, [notificationsEnabled]);
}
