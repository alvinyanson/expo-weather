import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

vi.hoisted(() => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';
});

vi.mock('@react-native-firebase/auth', () => {
  const mockAuthInstance = { currentUser: null };
  return {
    getAuth: vi.fn(() => mockAuthInstance),
    onAuthStateChanged: vi.fn(),
    signInAnonymously: vi.fn(),
    signInWithCredential: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: {
      credential: vi.fn((idToken, accessToken) => ({
        idToken,
        accessToken,
        providerId: 'google.com',
      })),
    },
  };
});

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: vi.fn(),
    hasPlayServices: vi.fn(),
    signIn: vi.fn(),
    getTokens: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { authService } from '@/services/auth.service';

const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
const mockFirebaseSignInAnonymously = vi.mocked(firebaseSignInAnonymously);
const mockSignInWithCredential = vi.mocked(signInWithCredential);
const mockFirebaseSignOut = vi.mocked(firebaseSignOut);
const mockGoogleSignin = vi.mocked(GoogleSignin);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('configure', () => {
    it('configures GoogleSignin with webClientId', () => {
      authService.configure();
      expect(mockGoogleSignin.configure).toHaveBeenCalledWith({
        webClientId: 'test-web-client-id',
      });
    });
  });

  describe('subscribe', () => {
    it('subscribes to auth state changes and maps user', () => {
      const mockUnsubscribe = vi.fn();
      let authCallback!: (user: any) => void;

      mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
        authCallback = cb as any;
        return mockUnsubscribe;
      });

      const userCallback = vi.fn();
      const unsub = authService.subscribe(userCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
      expect(unsub).toBe(mockUnsubscribe);

      // Trigger callback with raw firebase user
      const rawUser = {
        uid: 'user-123',
        isAnonymous: false,
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      };
      authCallback(rawUser);

      expect(userCallback).toHaveBeenCalledWith({
        uid: 'user-123',
        isAnonymous: false,
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      });

      // Trigger callback with null user
      authCallback(null);
      expect(userCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('signInWithGoogle', () => {
    it('throws error if Google sign in is cancelled', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true as never);
      mockGoogleSignin.signIn.mockResolvedValue({ type: 'cancelled' } as never);

      await expect(authService.signInWithGoogle()).rejects.toThrow('Google sign-in was cancelled');
    });

    it('throws error if no idToken is returned', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true as never);
      mockGoogleSignin.signIn.mockResolvedValue({ type: 'success' } as never);
      mockGoogleSignin.getTokens.mockResolvedValue({
        idToken: '',
        accessToken: 'access-123',
      } as never);

      await expect(authService.signInWithGoogle()).rejects.toThrow(
        'Google sign-in did not return an idToken',
      );
    });

    it('authenticates with credential and returns mapped user on success', async () => {
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true as never);
      mockGoogleSignin.signIn.mockResolvedValue({ type: 'success' } as never);
      mockGoogleSignin.getTokens.mockResolvedValue({
        idToken: 'id-token-123',
        accessToken: 'access-token-123',
      } as never);

      const firebaseUser = {
        uid: 'g-user-1',
        isAnonymous: false,
        displayName: 'Google User',
        email: 'guser@example.com',
        photoURL: 'https://example.com/g.jpg',
      };
      mockSignInWithCredential.mockResolvedValue({ user: firebaseUser } as never);

      const user = await authService.signInWithGoogle();

      expect(mockGoogleSignin.hasPlayServices).toHaveBeenCalledWith({
        showPlayServicesUpdateDialog: true,
      });
      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith(
        'id-token-123',
        'access-token-123',
      );
      expect(mockSignInWithCredential).toHaveBeenCalledWith(expect.anything(), expect.anything());
      expect(user).toEqual({
        uid: 'g-user-1',
        isAnonymous: false,
        displayName: 'Google User',
        email: 'guser@example.com',
        photoURL: 'https://example.com/g.jpg',
      });
    });
  });

  describe('signInAnonymously', () => {
    it('signs in anonymously and returns mapped user', async () => {
      const anonUser = {
        uid: 'anon-999',
        isAnonymous: true,
        displayName: null,
        email: null,
        photoURL: null,
      };
      mockFirebaseSignInAnonymously.mockResolvedValue({ user: anonUser } as never);

      const user = await authService.signInAnonymously();

      expect(mockFirebaseSignInAnonymously).toHaveBeenCalledWith(getAuth());
      expect(user).toEqual({
        uid: 'anon-999',
        isAnonymous: true,
        displayName: null,
        email: null,
        photoURL: null,
      });
    });
  });

  describe('signOut', () => {
    it('signs out from Google and Firebase', async () => {
      mockGoogleSignin.signOut.mockResolvedValue(null as never);
      mockFirebaseSignOut.mockResolvedValue(undefined);

      await authService.signOut();

      expect(mockGoogleSignin.signOut).toHaveBeenCalled();
      expect(mockFirebaseSignOut).toHaveBeenCalledWith(getAuth());
    });

    it('handles Google sign out error gracefully and proceeds with Firebase sign out', async () => {
      mockGoogleSignin.signOut.mockRejectedValue(new Error('Google signout error'));
      mockFirebaseSignOut.mockResolvedValue(undefined);

      await authService.signOut();

      expect(mockFirebaseSignOut).toHaveBeenCalledWith(getAuth());
    });
  });
});
