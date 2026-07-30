import { describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import {
  getApiErrorDetails,
  getApiErrorType,
  getExponentialBackoffDelay,
  MAX_QUERY_RETRIES,
  shouldRetryQuery,
} from '@/utils/apiError';
import { LocationPermissionError } from '@/services/weather.service';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));
vi.mock('expo-location', () => ({ PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' } }));

const createAxiosError = (config: {
  code?: string;
  message?: string;
  status?: number;
}): AxiosError => {
  return new AxiosError(
    config.message || 'Error',
    config.code,
    undefined,
    undefined,
    config.status
      ? ({
          status: config.status,
          data: {},
          headers: {},
          config: {} as any,
        } as any)
      : undefined,
  );
};

describe('apiError utility', () => {
  describe('getApiErrorType', () => {
    it('identifies timeout errors correctly', () => {
      expect(getApiErrorType(createAxiosError({ code: 'ECONNABORTED' }))).toBe('timeout');
      expect(getApiErrorType(createAxiosError({ code: 'ETIMEDOUT' }))).toBe('timeout');
      expect(getApiErrorType(createAxiosError({ message: 'timeout of 10000ms exceeded' }))).toBe(
        'timeout',
      );
      expect(getApiErrorType(new Error('Request timed out'))).toBe('timeout');
    });

    it('identifies offline network errors correctly', () => {
      expect(getApiErrorType(createAxiosError({ code: 'ERR_NETWORK' }))).toBe('offline');
      expect(getApiErrorType(createAxiosError({ message: 'Network Error' }))).toBe('offline');
      expect(getApiErrorType(createAxiosError({}))).toBe('offline');
      expect(getApiErrorType(new Error('User is offline'))).toBe('offline');
    });

    it('identifies 5xx server errors correctly', () => {
      expect(getApiErrorType(createAxiosError({ status: 500 }))).toBe('server');
      expect(getApiErrorType(createAxiosError({ status: 503 }))).toBe('server');
    });

    it('identifies 4xx client errors and permission errors correctly', () => {
      expect(getApiErrorType(createAxiosError({ status: 400 }))).toBe('client');
      expect(getApiErrorType(createAxiosError({ status: 404 }))).toBe('client');
      expect(getApiErrorType(new LocationPermissionError('Denied', false, 'denied' as any))).toBe(
        'client',
      );
    });

    it('treats a cancelled request as non-retryable instead of offline', () => {
      const cancelled = createAxiosError({ code: 'ERR_CANCELED', message: 'canceled' });

      expect(getApiErrorType(cancelled)).toBe('client');
      expect(shouldRetryQuery(0, cancelled)).toBe(false);
    });

    it('identifies unknown errors', () => {
      expect(getApiErrorType(new Error('Unexpected error'))).toBe('unknown');
    });
  });

  describe('getApiErrorDetails', () => {
    it('returns structured details for timeout error', () => {
      const details = getApiErrorDetails(createAxiosError({ code: 'ECONNABORTED' }));
      expect(details.type).toBe('timeout');
      expect(details.isRetryable).toBe(true);
      expect(details.iconName).toEqual({ ios: 'clock.fill', android: 'timer' });
      expect(details.title).toBeTruthy();
      expect(details.message).toBeTruthy();
    });

    it('returns structured details for offline error', () => {
      const details = getApiErrorDetails(createAxiosError({ code: 'ERR_NETWORK' }));
      expect(details.type).toBe('offline');
      expect(details.isRetryable).toBe(true);
      expect(details.iconName).toEqual({ ios: 'wifi.slash', android: 'wifi_off' });
    });

    it('returns structured details for server error', () => {
      const details = getApiErrorDetails(createAxiosError({ status: 500 }));
      expect(details.type).toBe('server');
      expect(details.isRetryable).toBe(true);
      expect(details.iconName).toEqual({
        ios: 'exclamationmark.triangle.fill',
        android: 'warning',
      });
    });

    it('returns structured details for non-retryable client error', () => {
      const details = getApiErrorDetails(createAxiosError({ status: 404 }));
      expect(details.type).toBe('client');
      expect(details.isRetryable).toBe(false);
      expect(details.iconName).toEqual({ ios: 'exclamationmark.circle.fill', android: 'error' });
    });
  });

  describe('shouldRetryQuery', () => {
    it('returns true for retryable errors under 3 attempts', () => {
      const timeoutError = createAxiosError({ code: 'ECONNABORTED' });
      expect(shouldRetryQuery(0, timeoutError)).toBe(true);
      expect(shouldRetryQuery(1, timeoutError)).toBe(true);
      expect(shouldRetryQuery(2, timeoutError)).toBe(true);
    });

    it('returns false when attempt limit reaches MAX_QUERY_RETRIES', () => {
      const serverError = createAxiosError({ status: 500 });
      expect(MAX_QUERY_RETRIES).toBe(3);
      expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, serverError)).toBe(true);
      expect(shouldRetryQuery(MAX_QUERY_RETRIES, serverError)).toBe(false);
      expect(shouldRetryQuery(MAX_QUERY_RETRIES + 1, serverError)).toBe(false);
    });

    it('returns false for 4xx client errors or permission errors', () => {
      const clientError = createAxiosError({ status: 400 });
      const permError = new LocationPermissionError('Denied', false, 'denied' as any);
      expect(shouldRetryQuery(0, clientError)).toBe(false);
      expect(shouldRetryQuery(0, permError)).toBe(false);
    });
  });

  describe('getExponentialBackoffDelay', () => {
    it('calculates exponential backoff delay correctly and caps at 10000ms', () => {
      expect(getExponentialBackoffDelay(0)).toBe(1000);
      expect(getExponentialBackoffDelay(1)).toBe(2000);
      expect(getExponentialBackoffDelay(2)).toBe(4000);
      expect(getExponentialBackoffDelay(3)).toBe(8000);
      expect(getExponentialBackoffDelay(4)).toBe(10000);
      expect(getExponentialBackoffDelay(5)).toBe(10000);
    });
  });
});
