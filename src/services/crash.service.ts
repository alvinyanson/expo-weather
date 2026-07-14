import crashlytics from '@react-native-firebase/crashlytics';
import type { AuthUser } from '@/interfaces';

/** Records a handled error as a non-fatal. Use for genuine bugs, not expected errors. */
export function reportError(error: unknown, context?: Record<string, string>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (__DEV__) {
    console.error('[reportError]', err, context ?? '');
  }
  if (context) {
    crashlytics().log(JSON.stringify(context));
  }
  crashlytics().recordError(err);
}

/** Leaves a breadcrumb, attached to the next reported error/crash. */
export function logBreadcrumb(message: string): void {
  crashlytics().log(message);
}

/** Attributes subsequent reports to the signed-in user. */
export function setCrashUser(user: AuthUser | null): void {
  if (!user) return;
  crashlytics().setUserId(user.uid);
  crashlytics().setAttributes({ isAnonymous: String(user.isAnonymous) });
}
