import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFetchLocation } from '@/hooks/useFetchLocation';
import { fetchLocation } from '@/services';
import type { LocationData } from '@/interfaces';

vi.mock('@/services', () => ({
  fetchLocation: vi.fn(),
}));

const mockFetchLocation = vi.mocked(fetchLocation);

const mockLocation: LocationData = {
  latitude: 35.6762,
  longitude: 139.6503,
  city: 'Tokyo',
};

describe('useFetchLocation', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches current location successfully', async () => {
    mockFetchLocation.mockResolvedValue(mockLocation);

    const { result } = renderHook(() => useFetchLocation(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchLocation).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockLocation);
  });

  it('handles error state when location fetch rejects', async () => {
    const errorMsg = 'Location permission denied';
    mockFetchLocation.mockRejectedValue(new Error(errorMsg));

    const { result } = renderHook(() => useFetchLocation(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 4000 });

    expect(mockFetchLocation).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMsg);
  });
});
