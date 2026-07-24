import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { updateSavedLocationOrders } from '@/services/firestore.service';
import Toast from 'react-native-toast-message';
import type { SavedLocation } from '@/interfaces';

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      user: { uid: 'user-1', isAnonymous: false },
    }),
}));

vi.mock('@/services/firestore.service', () => ({
  getSavedLocations: vi.fn(),
  updateSavedLocationOrders: vi.fn(),
  deleteSavedLocation: vi.fn(),
  saveLocation: vi.fn(),
}));

const { selectionMock, errorHapticMock } = vi.hoisted(() => ({
  selectionMock: vi.fn(),
  errorHapticMock: vi.fn(),
}));

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    selection: selectionMock,
    success: vi.fn(),
    error: errorHapticMock,
    impact: vi.fn(),
  }),
}));

vi.mock('react-native-toast-message', () => ({
  default: { show: vi.fn() },
}));

const mockUpdateSavedLocationOrders = vi.mocked(updateSavedLocationOrders);

const sampleLocations: SavedLocation[] = [
  {
    id: 'loc-1',
    city: 'Manila',
    lat: 14.6,
    lon: 120.98,
    userId: 'user-1',
    createdAt: 1000,
    order: 0,
  },
  {
    id: 'loc-2',
    city: 'Tokyo',
    lat: 35.68,
    lon: 139.69,
    userId: 'user-1',
    createdAt: 2000,
    order: 1,
  },
];

describe('useSavedLocations reordering', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(['savedLocations', 'user-1'], sampleLocations);
  });

  it('optimistically updates query cache and calls updateSavedLocationOrders batch service', async () => {
    mockUpdateSavedLocationOrders.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSavedLocations(), { wrapper });

    const newOrder: SavedLocation[] = [sampleLocations[1]!, sampleLocations[0]!]; // Tokyo, then Manila

    await act(async () => {
      await result.current.reorderSavedLocations(newOrder);
    });

    expect(mockUpdateSavedLocationOrders).toHaveBeenCalledWith([
      { id: 'loc-2', order: 0 },
      { id: 'loc-1', order: 1 },
    ]);
    expect(selectionMock).toHaveBeenCalled();
  });

  it('rolls back query cache and displays toast error if batch update fails', async () => {
    mockUpdateSavedLocationOrders.mockRejectedValueOnce(new Error('Firestore error'));

    const { result } = renderHook(() => useSavedLocations(), { wrapper });

    const newOrder: SavedLocation[] = [sampleLocations[1]!, sampleLocations[0]!];

    await act(async () => {
      try {
        await result.current.reorderSavedLocations(newOrder);
      } catch {
        // mutation error expected
      }
    });

    expect(errorHapticMock).toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Error',
      text2: 'Could not update saved location. Please try again.',
    });

    // Cache should be rolled back to sampleLocations
    const cachedData = queryClient.getQueryData<SavedLocation[]>(['savedLocations', 'user-1']);
    expect(cachedData).toEqual(sampleLocations);
  });
});
