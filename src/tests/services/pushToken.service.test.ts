import { vi, describe, it, expect, beforeEach } from 'vitest';
import { syncPushTokenIfNeeded, clearPushTokenSecurely } from '@/services/pushToken.service';
import * as SecureStore from 'expo-secure-store';
import { saveUserPushToken, clearUserPushToken } from '@/services/firestore.service';

vi.mock('@/services/firestore.service', () => ({
  saveUserPushToken: vi.fn(),
  clearUserPushToken: vi.fn(),
}));

const mockSaveUserPushToken = vi.mocked(saveUserPushToken);
const mockClearUserPushToken = vi.mocked(clearUserPushToken);

describe('syncPushTokenIfNeeded', () => {
  const mockGetItemAsync = vi.mocked(SecureStore.getItemAsync);
  const mockSetItemAsync = vi.mocked(SecureStore.setItemAsync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves push token and writes to SecureStore if no cache exists', async () => {
    mockGetItemAsync.mockResolvedValue(null);
    mockSaveUserPushToken.mockResolvedValue(undefined);

    await syncPushTokenIfNeeded('user-123', 'token-abc', 14.6, 120.98);

    expect(mockSaveUserPushToken).toHaveBeenCalledWith('user-123', 'token-abc', 14.6, 120.98);
    expect(mockSetItemAsync).toHaveBeenCalledWith(
      'user_push_token_last_saved_user-123',
      expect.stringContaining('"pushToken":"token-abc"'),
    );
  });

  it('skips saving to Firestore if push token and coordinates match cache', async () => {
    mockGetItemAsync.mockResolvedValue(
      JSON.stringify({
        userId: 'user-123',
        pushToken: 'token-abc',
        latitude: 14.6,
        longitude: 120.98,
      }),
    );

    await syncPushTokenIfNeeded('user-123', 'token-abc', 14.6, 120.98);

    expect(mockSaveUserPushToken).not.toHaveBeenCalled();
    expect(mockSetItemAsync).not.toHaveBeenCalled();
  });

  it('saves push token if coordinates have changed significantly', async () => {
    mockGetItemAsync.mockResolvedValue(
      JSON.stringify({
        userId: 'user-123',
        pushToken: 'token-abc',
        latitude: 14.0, // Significant change (diff > 0.01)
        longitude: 120.98,
      }),
    );
    mockSaveUserPushToken.mockResolvedValue(undefined);

    await syncPushTokenIfNeeded('user-123', 'token-abc', 14.6, 120.98);

    expect(mockSaveUserPushToken).toHaveBeenCalledWith('user-123', 'token-abc', 14.6, 120.98);
    expect(mockSetItemAsync).toHaveBeenCalled();
  });

  it('forces save push token if force param is true', async () => {
    mockGetItemAsync.mockResolvedValue(
      JSON.stringify({
        userId: 'user-123',
        pushToken: 'token-abc',
        latitude: 14.6,
        longitude: 120.98,
      }),
    );
    mockSaveUserPushToken.mockResolvedValue(undefined);

    await syncPushTokenIfNeeded('user-123', 'token-abc', 14.6, 120.98, true);

    expect(mockSaveUserPushToken).toHaveBeenCalledWith('user-123', 'token-abc', 14.6, 120.98);
    expect(mockSetItemAsync).toHaveBeenCalled();
  });
});

describe('clearPushTokenSecurely', () => {
  const mockDeleteItemAsync = vi.mocked(SecureStore.deleteItemAsync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nullifies token in Firestore and deletes SecureStore cache', async () => {
    mockClearUserPushToken.mockResolvedValue(undefined);
    mockDeleteItemAsync.mockResolvedValue(undefined);

    await clearPushTokenSecurely('user-123');

    expect(mockClearUserPushToken).toHaveBeenCalledWith('user-123');
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('user_push_token_last_saved_user-123');
  });
});
