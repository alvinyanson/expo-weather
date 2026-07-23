import { describe, it, expect, beforeEach } from 'vitest';
import {
  appStorage,
  mmkvZustandStorage,
  mmkvQueryPersister,
  clearAllStorage,
} from '@/services/storage';

describe('storage service module', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('exports an MMKV appStorage instance', () => {
    expect(appStorage).toBeDefined();
    expect(typeof appStorage.set).toBe('function');
    expect(typeof appStorage.getString).toBe('function');
  });

  it('handles Zustand StateStorage getItem, setItem, and removeItem', () => {
    mmkvZustandStorage.setItem('test-key', 'test-val');
    expect(mmkvZustandStorage.getItem('test-key')).toBe('test-val');

    mmkvZustandStorage.removeItem('test-key');
    expect(mmkvZustandStorage.getItem('test-key')).toBeNull();
  });

  it('returns null for missing keys in mmkvZustandStorage', () => {
    expect(mmkvZustandStorage.getItem('nonexistent-key')).toBeNull();
  });

  it('exports mmkvQueryPersister with persister methods', () => {
    expect(mmkvQueryPersister).toBeDefined();
    expect(typeof mmkvQueryPersister.persistClient).toBe('function');
    expect(typeof mmkvQueryPersister.restoreClient).toBe('function');
    expect(typeof mmkvQueryPersister.removeClient).toBe('function');
  });

  it('clears all storage when clearAllStorage is called', () => {
    appStorage.set('key1', 'val1');
    appStorage.set('key2', 'val2');

    expect(appStorage.getString('key1')).toBe('val1');

    clearAllStorage();

    expect(appStorage.getString('key1')).toBeUndefined();
    expect(appStorage.getString('key2')).toBeUndefined();
  });
});
