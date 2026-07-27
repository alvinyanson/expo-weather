import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Notifications from 'expo-notifications';
import {
  registerNotificationCategoriesAsync,
  WEATHER_ALERT_CATEGORY,
  ACTION_VIEW_DETAILS,
  ACTION_SAVE_LOCATION,
} from '@/services/notificationCategory.service';

vi.mock('expo-notifications', () => ({
  setNotificationCategoryAsync: vi.fn(),
}));

describe('notificationCategory.service', () => {
  const mockSetNotificationCategoryAsync = vi.mocked(Notifications.setNotificationCategoryAsync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports correct category and action constants', () => {
    expect(WEATHER_ALERT_CATEGORY).toBe('WEATHER_ALERT');
    expect(ACTION_VIEW_DETAILS).toBe('VIEW_DETAILS');
    expect(ACTION_SAVE_LOCATION).toBe('SAVE_LOCATION');
  });

  it('registers weather alert category with VIEW_DETAILS and SAVE_LOCATION actions', async () => {
    await registerNotificationCategoriesAsync();

    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledTimes(1);
    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledWith(WEATHER_ALERT_CATEGORY, [
      {
        identifier: ACTION_VIEW_DETAILS,
        buttonTitle: 'View Details',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: ACTION_SAVE_LOCATION,
        buttonTitle: 'Save Location',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  });
});
