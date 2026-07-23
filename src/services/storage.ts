import { createMMKV, type MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';
import { Persister } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/** Centralized MMKV storage instance */
export const appStorage: MMKV = createMMKV();

/** Synchronous StateStorage adapter for Zustand persist middleware */
export const mmkvZustandStorage: StateStorage = {
  setItem: (name, value) => {
    appStorage.set(name, value);
  },
  getItem: (name) => {
    const value = appStorage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    appStorage.remove(name);
  },
};

/** Synchronous Persister for TanStack Query PersistQueryClientProvider */
export const mmkvQueryPersister: Persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => appStorage.getString(key) ?? null,
    setItem: (key, value) => appStorage.set(key, value),
    removeItem: (key) => appStorage.remove(key),
  },
});

/** Clears all stored key-value entries in MMKV */
export function clearAllStorage(): void {
  appStorage.clearAll();
}
