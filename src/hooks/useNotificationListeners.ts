import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { t } from '@/services/i18n';
import {
  ACTION_SAVE_LOCATION,
  ACTION_VIEW_DETAILS,
  type RichNotificationData,
} from '@/services/notificationCategory.service';

type Router = ReturnType<typeof useRouter>;
type ToggleSavedLocation = ReturnType<typeof useSavedLocations>['toggleSavedLocation'];

function handleViewDetails(data: Partial<RichNotificationData>, router: Router) {
  if (data.latitude == null || data.longitude == null) return;

  router.push({
    pathname: '/details',
    params: {
      lat: String(data.latitude),
      lon: String(data.longitude),
      city: data.city ?? '',
    },
  });
}

async function handleSaveLocation(
  data: Partial<RichNotificationData>,
  toggleSavedLocation: ToggleSavedLocation,
) {
  if (data.latitude == null || data.longitude == null || !data.city) return;

  await toggleSavedLocation({
    lat: Number(data.latitude),
    lon: Number(data.longitude),
    city: data.city,
  });

  Toast.show({
    type: 'success',
    text1: t('notificationLocationSavedToast'),
  });
}

export function useNotificationListeners() {
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const router = useRouter();
  const { toggleSavedLocation } = useSavedLocations();

  useEffect(() => {
    if (!notificationsEnabled) return;

    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log('Notification response:', response.notification.request.content.title);

        const actionId = response.actionIdentifier;
        const data = (response.notification.request.content.data ??
          {}) as Partial<RichNotificationData>;

        switch (actionId) {
          case ACTION_VIEW_DETAILS:
          case Notifications.DEFAULT_ACTION_IDENTIFIER:
            handleViewDetails(data, router);
            break;

          case ACTION_SAVE_LOCATION:
            await handleSaveLocation(data, toggleSavedLocation);
            break;

          default:
            break;
        }
      },
    );

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, [notificationsEnabled, router, toggleSavedLocation]);
}
