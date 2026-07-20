import { vi, describe, it, expect, beforeEach } from 'vitest';
import { reportError, logBreadcrumb, setCrashUser } from '@/services/crash.service';
import type { AuthUser } from '@/interfaces';

const mockRecordError = vi.fn();
const mockLog = vi.fn();
const mockSetUserId = vi.fn();
const mockSetAttributes = vi.fn();

vi.mock('@react-native-firebase/crashlytics', () => ({
  default: () => ({
    recordError: mockRecordError,
    log: mockLog,
    setUserId: mockSetUserId,
    setAttributes: mockSetAttributes,
  }),
}));

describe('crash.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reportError', () => {
    it('records an Error instance to crashlytics', () => {
      const err = new Error('Test error');
      reportError(err);

      expect(mockRecordError).toHaveBeenCalledWith(err);
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('converts non-Error value to Error before recording', () => {
      reportError('string error');

      expect(mockRecordError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRecordError.mock.calls[0]![0].message).toBe('string error');
    });

    it('logs JSON context if context object is provided', () => {
      const err = new Error('Test with context');
      const context = { where: 'testComponent', info: 'extra' };

      reportError(err, context);

      expect(mockLog).toHaveBeenCalledWith(JSON.stringify(context));
      expect(mockRecordError).toHaveBeenCalledWith(err);
    });
  });

  describe('logBreadcrumb', () => {
    it('logs a breadcrumb message to crashlytics', () => {
      logBreadcrumb('[Auth] User clicked login');

      expect(mockLog).toHaveBeenCalledWith('[Auth] User clicked login');
    });
  });

  describe('setCrashUser', () => {
    it('does nothing if user is null', () => {
      setCrashUser(null);

      expect(mockSetUserId).not.toHaveBeenCalled();
      expect(mockSetAttributes).not.toHaveBeenCalled();
    });

    it('sets user ID and attributes when user is provided', () => {
      const user: AuthUser = {
        uid: 'user-777',
        isAnonymous: false,
        displayName: 'John Doe',
        email: 'john@example.com',
        photoURL: null,
      };

      setCrashUser(user);

      expect(mockSetUserId).toHaveBeenCalledWith('user-777');
      expect(mockSetAttributes).toHaveBeenCalledWith({ isAnonymous: 'false' });
    });
  });
});
