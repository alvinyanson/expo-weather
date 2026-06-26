import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { AuthUser, FirebaseUserLike } from '@/interfaces';

/**
 * Web OAuth client id (client_type: 3 in google-services.json). Required by
 * GoogleSignin to mint an idToken that Firebase will accept. Not secret, but
 * read from env to match the repo's EXPO_PUBLIC_* config convention.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

function mapUser(user: FirebaseUserLike | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

let configured = false;

export const authService = {
  configure() {
    if (configured) return;
    if (!WEB_CLIENT_ID) {
      // EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set — Google Sign-In is disabled.
      return;
    }
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  },

  subscribe(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(getAuth(), (user) => callback(mapUser(user)));
  },

  async signInWithGoogle() {
    if (!WEB_CLIENT_ID) {
      throw new Error(
        'Google Sign-In is not configured (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID missing)',
      );
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const result = await GoogleSignin.signIn();
    if ('type' in result && result.type === 'cancelled') {
      throw new Error('Google sign-in was cancelled');
    }

    // Pull BOTH tokens.
    const { idToken, accessToken } = await GoogleSignin.getTokens();
    if (!idToken) {
      throw new Error('Google sign-in did not return an idToken');
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const { user } = await signInWithCredential(getAuth(), credential);
    return mapUser(user) as AuthUser;
  },

  async signInAnonymously() {
    const { user } = await firebaseSignInAnonymously(getAuth());
    return mapUser(user) as AuthUser;
  },

  async signOut() {
    try {
      await GoogleSignin.signOut();
    } catch {
      // no-op; this is intentional
    }
    await firebaseSignOut(getAuth());
  },
};
