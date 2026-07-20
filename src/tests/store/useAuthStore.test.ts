import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthUser } from '@/interfaces';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      initializing: true,
    });
  });

  it('has default state with null user and initializing true', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.initializing).toBe(true);
  });

  it('sets authenticated user correctly', () => {
    const mockUser: AuthUser = {
      uid: 'user-123',
      isAnonymous: false,
      displayName: 'Alice',
      email: 'alice@example.com',
      photoURL: null,
    };

    useAuthStore.getState().setUser(mockUser);

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('can reset user to null', () => {
    const mockUser: AuthUser = {
      uid: 'user-123',
      isAnonymous: true,
      displayName: null,
      email: null,
      photoURL: null,
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);

    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('sets initializing state correctly', () => {
    useAuthStore.getState().setInitializing(false);
    expect(useAuthStore.getState().initializing).toBe(false);

    useAuthStore.getState().setInitializing(true);
    expect(useAuthStore.getState().initializing).toBe(true);
  });
});
