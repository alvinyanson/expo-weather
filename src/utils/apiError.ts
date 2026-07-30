import { isAxiosError } from 'axios';
import { SymbolName } from './weatherMapper';
import { t } from '@/services/i18n';

export type ApiErrorType = 'timeout' | 'offline' | 'server' | 'client' | 'unknown';

/** Max automatic retries for a retryable query error. */
export const MAX_QUERY_RETRIES = 3;

export interface ApiErrorDetails {
  type: ApiErrorType;
  title: string;
  message: string;
  iconName: SymbolName;
  isRetryable: boolean;
}

export const getApiErrorType = (error: unknown): ApiErrorType => {
  if ((error as any)?.name === 'LocationPermissionError') {
    return 'client';
  }

  if (isAxiosError(error)) {
    // An aborted request is not a failure to report or retry.
    if (error.code === 'ERR_CANCELED') {
      return 'client';
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.toLowerCase().includes('timeout')
    ) {
      return 'timeout';
    }

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      return 'offline';
    }

    if (error.response) {
      const status = error.response.status;
      if (status >= 500 && status < 600) {
        return 'server';
      }
      if (status >= 400 && status < 500) {
        return 'client';
      }
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'timeout';
    }
    if (msg.includes('network') || msg.includes('offline')) {
      return 'offline';
    }
  }

  return 'unknown';
};

export const getApiErrorDetails = (error: unknown): ApiErrorDetails => {
  const type = getApiErrorType(error);

  switch (type) {
    case 'timeout':
      return {
        type,
        title: t('errorTimeoutTitle'),
        message: t('errorTimeoutMessage'),
        iconName: { ios: 'clock.fill', android: 'timer' },
        isRetryable: true,
      };
    case 'offline':
      return {
        type,
        title: t('errorOfflineTitle'),
        message: t('errorOfflineMessage'),
        iconName: { ios: 'wifi.slash', android: 'wifi_off' },
        isRetryable: true,
      };
    case 'server':
      return {
        type,
        title: t('errorServerTitle'),
        message: t('errorServerMessage'),
        iconName: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
        isRetryable: true,
      };
    case 'client':
      return {
        type,
        title: t('errorGeneralTitle'),
        message: (error as Error)?.message || t('errorGeneralMessage'),
        iconName: { ios: 'exclamationmark.circle.fill', android: 'error' },
        isRetryable: false,
      };
    case 'unknown':
    default:
      return {
        type,
        title: t('errorGeneralTitle'),
        message: t('errorGeneralMessage'),
        iconName: { ios: 'exclamationmark.circle.fill', android: 'error' },
        isRetryable: true,
      };
  }
};

export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  const type = getApiErrorType(error);
  return type !== 'client';
};

export const getExponentialBackoffDelay = (failureCount: number): number => {
  return Math.min(1000 * Math.pow(2, failureCount), 10000);
};
