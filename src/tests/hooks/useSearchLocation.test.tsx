import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSearchLocation } from '@/hooks/useSearchLocation';
import { searchLocations } from '@/services/location.service';
import type { LocationSearchResult } from '@/interfaces';

vi.mock('@/services/location.service', () => ({
  searchLocations: vi.fn(),
}));

const mockSearchLocations = vi.mocked(searchLocations);

const mockResults: LocationSearchResult[] = [
  { id: 1, name: 'London', latitude: 51.5074, longitude: -0.1278, country: 'United Kingdom' },
  { id: 2, name: 'Londonderry', latitude: 54.9966, longitude: -7.3086, country: 'United Kingdom' },
];

describe('useSearchLocation', () => {
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

  it('is disabled when query length is less than 2 characters', () => {
    const { result: emptyResult } = renderHook(() => useSearchLocation(''), {
      wrapper: createWrapper(),
    });

    expect(emptyResult.current.fetchStatus).toBe('idle');
    expect(emptyResult.current.data).toBeUndefined();
    expect(mockSearchLocations).not.toHaveBeenCalled();

    const { result: singleCharResult } = renderHook(() => useSearchLocation('L'), {
      wrapper: createWrapper(),
    });

    expect(singleCharResult.current.fetchStatus).toBe('idle');
    expect(singleCharResult.current.data).toBeUndefined();
    expect(mockSearchLocations).not.toHaveBeenCalled();
  });

  it('executes search query when query length is 2 or more characters', async () => {
    mockSearchLocations.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useSearchLocation('Lo'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSearchLocations).toHaveBeenCalledWith('Lo');
    expect(result.current.data).toEqual(mockResults);
  });

  it('configures staleTime to 5 minutes', async () => {
    mockSearchLocations.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useSearchLocation('London'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient.getQueryCache().find({ queryKey: ['searchLocations', 'London'] });

    expect((query?.options as any)?.staleTime).toBe(1000 * 60 * 5);
  });
});
