import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { useNotificationListeners } from '@/hooks/useNotificationListeners';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ACTION_SAVE_LOCATION, ACTION_VIEW_DETAILS } from '@/services/notificationCategory.service';

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

const { toggleSavedLocationMock } = vi.hoisted(() => ({
  toggleSavedLocationMock: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/hooks/useSavedLocations', () => ({
  useSavedLocations: () => ({
    toggleSavedLocation: toggleSavedLocationMock,
  }),
}));

vi.mock('react-native-toast-message', () => ({
  default: {
    show: vi.fn(),
  },
}));

let receivedCallback: ((notification: any) => void) | null = null;
let responseCallback: ((response: any) => Promise<void>) | null = null;

const removeReceivedMock = vi.fn();
const removeResponseMock = vi.fn();

vi.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  addNotificationReceivedListener: vi.fn((cb) => {
    receivedCallback = cb;
    return { remove: removeReceivedMock };
  }),
  addNotificationResponseReceivedListener: vi.fn((cb) => {
    responseCallback = cb;
    return { remove: removeResponseMock };
  }),
}));

describe('useNotificationListeners', () => {
  const mockToastShow = vi.mocked(Toast.show);

  beforeEach(() => {
    vi.clearAllMocks();
    receivedCallback = null;
    responseCallback = null;
    useSettingsStore.setState({ notificationsEnabled: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('does not register listeners when notifications are disabled', () => {
    useSettingsStore.setState({ notificationsEnabled: false });
    renderHook(() => useNotificationListeners());

    expect(Notifications.addNotificationReceivedListener).not.toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
  });

  it('registers notification listeners and cleans them up on unmount when enabled', () => {
    const { unmount } = renderHook(() => useNotificationListeners());

    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();

    unmount();

    expect(removeReceivedMock).toHaveBeenCalled();
    expect(removeResponseMock).toHaveBeenCalled();
  });

  it('handles received notification log callback', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderHook(() => useNotificationListeners());

    receivedCallback?.({
      request: { content: { title: 'Weather Warning' } },
    });

    expect(consoleSpy).toHaveBeenCalledWith('Notification received:', 'Weather Warning');
    consoleSpy.mockRestore();
  });

  it('navigates to details on default notification tap', async () => {
    renderHook(() => useNotificationListeners());

    await responseCallback?.({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          content: {
            title: 'Alert',
            data: { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo' },
          },
        },
      },
    });

    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: {
        lat: '35.6762',
        lon: '139.6503',
        city: 'Tokyo',
      },
    });
  });

  it('navigates to details on VIEW_DETAILS action identifier', async () => {
    renderHook(() => useNotificationListeners());

    await responseCallback?.({
      actionIdentifier: ACTION_VIEW_DETAILS,
      notification: {
        request: {
          content: {
            title: 'Alert',
            data: { latitude: 40.7128, longitude: -74.006, city: 'New York' },
          },
        },
      },
    });

    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: {
        lat: '40.7128',
        lon: '-74.006',
        city: 'New York',
      },
    });
  });

  it('saves location and shows toast on SAVE_LOCATION action identifier', async () => {
    toggleSavedLocationMock.mockResolvedValueOnce(undefined);
    renderHook(() => useNotificationListeners());

    await responseCallback?.({
      actionIdentifier: ACTION_SAVE_LOCATION,
      notification: {
        request: {
          content: {
            title: 'Alert',
            data: { latitude: 48.8566, longitude: 2.3522, city: 'Paris' },
          },
        },
      },
    });

    expect(toggleSavedLocationMock).toHaveBeenCalledWith({
      lat: 48.8566,
      lon: 2.3522,
      city: 'Paris',
    });
    expect(mockToastShow).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Location saved from notification',
    });
  });

  it('ignores response with missing coordinates or invalid payload', async () => {
    renderHook(() => useNotificationListeners());

    await responseCallback?.({
      actionIdentifier: ACTION_VIEW_DETAILS,
      notification: {
        request: {
          content: {
            title: 'Alert',
            data: {},
          },
        },
      },
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(toggleSavedLocationMock).not.toHaveBeenCalled();
  });
});
