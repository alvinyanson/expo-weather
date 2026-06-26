/** Minimal mapped shape of an authenticated user. */
export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Minimal structural shape we read off a Firebase user.
 */
export type FirebaseUserLike = Pick<
  AuthUser,
  'uid' | 'isAnonymous' | 'displayName' | 'email' | 'photoURL'
>;
