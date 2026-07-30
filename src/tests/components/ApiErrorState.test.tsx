import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { ApiErrorState } from '@/components/ApiErrorState';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const createAxiosError = (code: string, status?: number): AxiosError => {
  return new AxiosError(
    'Error message',
    code,
    undefined,
    undefined,
    status ? ({ status } as any) : undefined,
  );
};

describe('ApiErrorState component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders timeout error UI correctly', () => {
    const error = createAxiosError('ECONNABORTED');
    render(<ApiErrorState error={error} onRetry={vi.fn()} />);

    expect(screen.getByText('Request Timed Out')).toBeTruthy();
    expect(
      screen.getByText(
        'The server took too long to respond. Please check your connection and try again.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('api-error-retry-button')).toBeTruthy();
  });

  it('renders offline error UI correctly', () => {
    const error = createAxiosError('ERR_NETWORK');
    render(<ApiErrorState error={error} onRetry={vi.fn()} />);

    expect(screen.getByText('No Internet Connection')).toBeTruthy();
    expect(
      screen.getByText(
        'You appear to be offline. Please connect to the internet to update weather data.',
      ),
    ).toBeTruthy();
  });

  it('renders server error UI correctly', () => {
    const error = createAxiosError('ERR_BAD_RESPONSE', 500);
    render(<ApiErrorState error={error} onRetry={vi.fn()} />);

    expect(screen.getByText('Server Error')).toBeTruthy();
    expect(
      screen.getByText('The weather service encountered an error. Please try again later.'),
    ).toBeTruthy();
  });

  it('renders retrying state with the in-flight attempt count when isRetrying is true', () => {
    const error = createAxiosError('ECONNABORTED');
    // One failure recorded means the second attempt is the one currently running.
    render(
      <ApiErrorState
        error={error}
        isRetrying={true}
        failureCount={1}
        maxRetries={3}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByTestId('api-error-retrying')).toBeTruthy();
    expect(screen.getByText('Retrying (Attempt 2 of 3)...')).toBeTruthy();
    expect(screen.queryByTestId('api-error-retry-button')).toBeNull();
  });

  it('caps the displayed attempt count at maxRetries', () => {
    const error = createAxiosError('ECONNABORTED');
    render(<ApiErrorState error={error} isRetrying={true} failureCount={3} maxRetries={3} />);

    expect(screen.getByText('Retrying (Attempt 3 of 3)...')).toBeTruthy();
  });

  it('hides the retry button for non-retryable client errors', () => {
    const error = createAxiosError('ERR_BAD_REQUEST', 404);
    render(<ApiErrorState error={error} onRetry={vi.fn()} />);

    expect(screen.getByText('Something Went Wrong')).toBeTruthy();
    expect(screen.queryByTestId('api-error-retry-button')).toBeNull();
  });

  it('triggers onRetry callback when retry button is pressed', () => {
    const onRetryMock = vi.fn();
    const error = createAxiosError('ECONNABORTED');
    render(<ApiErrorState error={error} onRetry={onRetryMock} />);

    const retryBtn = screen.getByTestId('api-error-retry-button');
    fireEvent.click(retryBtn);

    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });
});
