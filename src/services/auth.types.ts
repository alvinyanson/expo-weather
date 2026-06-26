/**
 * Auth types decoupled from `@react-native-firebase` so the store and other
 * consumers don't pull in native module types directly.
 */

/** Minimal mapped shape of an authenticated user. */
export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
