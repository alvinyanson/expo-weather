import * as SecureStore from 'expo-secure-store';
import { saveUserPushToken, clearUserPushToken } from './firestore.service';

export interface CachedPushToken {
  userId: string;
  pushToken: string;
  latitude: number;
  longitude: number;
}

const getPushTokenCacheKey = (userId: string) => `user_push_token_last_saved_${userId}`;

const hasPushTokenChanged = (
  cached: CachedPushToken,
  userId: string,
  pushToken: string,
  latitude: number,
  longitude: number,
): boolean => {
  if (cached.userId !== userId) return true;
  if (cached.pushToken !== pushToken) return true;
  const latDiff = Math.abs(cached.latitude - latitude);
  const lonDiff = Math.abs(cached.longitude - longitude);
  return latDiff > 0.01 || lonDiff > 0.01;
};

/**
 * Syncs the user's push token and coordinates to Firestore if they have changed significantly
 * or if no cache exists. Updates the SecureStore cache on successful sync.
 */
export const syncPushTokenIfNeeded = async (
  userId: string,
  pushToken: string,
  latitude: number,
  longitude: number,
  force = false,
): Promise<void> => {
  const cacheKey = getPushTokenCacheKey(userId);

  if (!force) {
    try {
      const cachedString = await SecureStore.getItemAsync(cacheKey);
      if (cachedString) {
        const cached = JSON.parse(cachedString) as CachedPushToken;
        if (!hasPushTokenChanged(cached, userId, pushToken, latitude, longitude)) {
          return;
        }
      }
    } catch (e) {
      console.warn('[PushTokenCache] Failed to read cache:', e);
    }
  }

  await saveUserPushToken(userId, pushToken, latitude, longitude);

  try {
    await SecureStore.setItemAsync(
      cacheKey,
      JSON.stringify({
        userId,
        pushToken,
        latitude,
        longitude,
      }),
    );
  } catch (e) {
    console.warn('[PushTokenCache] Failed to write cache:', e);
  }
};

/**
 * Clears the user's push token and coordinate details in Firestore and deletes the SecureStore cache.
 */
export const clearPushTokenSecurely = async (userId: string): Promise<void> => {
  await clearUserPushToken(userId);
  try {
    await SecureStore.deleteItemAsync(getPushTokenCacheKey(userId));
  } catch (e) {
    console.warn('[PushTokenCache] Failed to delete cache:', e);
  }
};
