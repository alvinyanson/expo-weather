import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { reverseGeocode } from '@/services/location.service';

vi.mock('@/services/location.service', () => ({
  reverseGeocode: vi.fn(),
}));

const mockReverseGeocode = vi.mocked(reverseGeocode);

const createWrapper = () => {
  const queryClient = new QueryClient({
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

describe('useReverseGeocode', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled when no coordinates are provided', () => {
    const { result } = renderHook(() => useReverseGeocode(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it('calls reverseGeocode and returns the resolved city name when coordinates are provided', async () => {
    mockReverseGeocode.mockResolvedValue('Shibuya');

    const { result } = renderHook(
      () => useReverseGeocode({ latitude: 35.658, longitude: 139.701 }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockReverseGeocode).toHaveBeenCalledWith(35.658, 139.701);
    expect(result.current.data).toBe('Shibuya');
  });
});
