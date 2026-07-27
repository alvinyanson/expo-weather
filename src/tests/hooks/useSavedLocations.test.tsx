import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import {
  deleteSavedLocation,
  getSavedLocations,
  saveLocation,
  updateSavedLocationOrders,
} from '@/services/firestore.service';
import { useAuthStore } from '@/store/useAuthStore';
import Toast from 'react-native-toast-message';
import { reportError } from '@/services/crash.service';
import type { SavedLocation } from '@/interfaces';

vi.mock('@/services/firestore.service', () => ({
  getSavedLocations: vi.fn(),
  saveLocation: vi.fn(),
  deleteSavedLocation: vi.fn(),
  updateSavedLocationOrders: vi.fn(),
}));

const selectionMock = vi.fn();
const successMock = vi.fn();
const errorMock = vi.fn();

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    selection: selectionMock,
    success: successMock,
    error: errorMock,
    impact: vi.fn(),
  }),
}));

vi.mock('@/services/crash.service', () => ({
  reportError: vi.fn(),
}));

vi.mock('react-native-toast-message', () => ({
  default: {
    show: vi.fn(),
  },
}));

const mockGetSavedLocations = vi.mocked(getSavedLocations);
const mockSaveLocation = vi.mocked(saveLocation);
const mockDeleteSavedLocation = vi.mocked(deleteSavedLocation);
const mockUpdateSavedLocationOrders = vi.mocked(updateSavedLocationOrders);
const mockReportError = vi.mocked(reportError);
const mockToastShow = vi.mocked(Toast.show);

const sampleSavedLocation: SavedLocation = {
  id: 'loc-123',
  city: 'Paris',
  lat: 48.8566,
  lon: 2.3522,
  userId: 'user-1',
  createdAt: 1000,
  order: 0,
};

describe('useSavedLocations', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { uid: 'user-1', isAnonymous: false } as never,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches saved locations for signed in user', async () => {
    mockGetSavedLocations.mockResolvedValue([sampleSavedLocation]);

    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.savedLocations).toHaveLength(1));

    expect(mockGetSavedLocations).toHaveBeenCalledWith('user-1');
    expect(result.current.savedLocations).toEqual([sampleSavedLocation]);
  });

  it('returns empty savedLocations when no user is signed in', () => {
    useAuthStore.setState({ user: null });

    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.savedLocations).toEqual([]);
    expect(mockGetSavedLocations).not.toHaveBeenCalled();
  });

  it('toggleSavedLocation - saves a location when it is not currently saved', async () => {
    mockGetSavedLocations.mockResolvedValue([]);
    mockSaveLocation.mockResolvedValue('new-loc-id');

    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleSavedLocation({ city: 'Berlin', lat: 52.52, lon: 13.405 });
    });

    expect(mockSaveLocation).toHaveBeenCalledWith('user-1', {
      city: 'Berlin',
      lat: 52.52,
      lon: 13.405,
    });
    expect(successMock).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      }),
    );
  });

  it('toggleSavedLocation - deletes a location when it is already saved', async () => {
    mockGetSavedLocations.mockResolvedValue([sampleSavedLocation]);
    mockDeleteSavedLocation.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.savedLocations).toHaveLength(1));

    await act(async () => {
      await result.current.toggleSavedLocation({ city: 'paris', lat: 48.85, lon: 2.35 });
    });

    expect(mockDeleteSavedLocation).toHaveBeenCalledWith('loc-123', expect.anything());
    expect(successMock).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      }),
    );
  });

  it('toggleSavedLocation - handles error when save or delete fails', async () => {
    mockGetSavedLocations.mockResolvedValue([]);
    mockSaveLocation.mockRejectedValue(new Error('Save error'));

    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleSavedLocation({ city: 'Berlin', lat: 52.52, lon: 13.405 });
    });

    expect(errorMock).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      }),
    );
  });

  it('confirmDeleteLocation - deletes location and triggers haptic, onSettled callback, and toast', async () => {
    mockGetSavedLocations.mockResolvedValue([sampleSavedLocation]);
    mockDeleteSavedLocation.mockResolvedValue(undefined);

    const onSettled = vi.fn();
    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.confirmDeleteLocation(sampleSavedLocation, onSettled);
    });

    expect(mockDeleteSavedLocation).toHaveBeenCalledWith('loc-123', expect.anything());
    expect(successMock).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      }),
    );
  });

  it('confirmDeleteLocation - handles error when deletion fails', async () => {
    mockDeleteSavedLocation.mockRejectedValue(new Error('Delete error'));

    const onSettled = vi.fn();
    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.confirmDeleteLocation(sampleSavedLocation, onSettled);
    });

    expect(errorMock).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalled();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      }),
    );
  });

  it('reorderSavedLocations - calls updateSavedLocationOrders and triggers selection haptic', async () => {
    mockUpdateSavedLocationOrders.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSavedLocations(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.reorderSavedLocations([sampleSavedLocation]);
    });

    expect(mockUpdateSavedLocationOrders).toHaveBeenCalledWith([{ id: 'loc-123', order: 0 }]);
    expect(selectionMock).toHaveBeenCalled();
  });
});
