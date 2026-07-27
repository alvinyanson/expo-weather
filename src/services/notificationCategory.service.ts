import * as Notifications from 'expo-notifications';
import { t } from './i18n';

export const WEATHER_ALERT_CATEGORY = 'WEATHER_ALERT';
export const ACTION_VIEW_DETAILS = 'VIEW_DETAILS';
export const ACTION_SAVE_LOCATION = 'SAVE_LOCATION';

export interface RichNotificationData {
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
  categoryIdentifier?: string;
}

export async function registerNotificationCategoriesAsync(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(WEATHER_ALERT_CATEGORY, [
    {
      identifier: ACTION_VIEW_DETAILS,
      buttonTitle: t('notificationActionViewDetails'),
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: ACTION_SAVE_LOCATION,
      buttonTitle: t('notificationActionSaveLocation'),
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
}
