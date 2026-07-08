import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSavedLocation, getSavedLocations, saveLocation } from '@/services';
import { useAuthStore } from '@/store/useAuthStore';
import type { SavedLocation, SaveLocationInput } from '@/interfaces';

export const useSavedLocations = () => {
  const uid = useAuthStore((state) => state.user?.uid);
  const queryClient = useQueryClient();
  const queryKey = ['savedLocations', uid];

  const list = useQuery<SavedLocation[], Error>({
    queryKey,
    queryFn: () => getSavedLocations(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const saveMutation = useMutation<
    string,
    Error,
    SaveLocationInput,
    { previousLocations?: SavedLocation[] }
  >({
    mutationFn: (location) => {
      if (!uid) throw new Error('You must be signed in to save a location.');
      return saveLocation(uid, location);
    },
    onMutate: async (newLocation) => {
      await queryClient.cancelQueries({ queryKey });

      const previousLocations = queryClient.getQueryData<SavedLocation[]>(queryKey);

      const optimisticLocation: SavedLocation = {
        id: `temp-${Date.now()}`,
        city: newLocation.city,
        lat: newLocation.lat,
        lon: newLocation.lon,
        createdAt: Date.now(),
        userId: uid || '',
      };

      queryClient.setQueryData<SavedLocation[]>(queryKey, (old) => [
        ...(old || []),
        optimisticLocation,
      ]);

      return { previousLocations };
    },
    onError: (err, newLocation, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(queryKey, context.previousLocations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation<void, Error, string, { previousLocations?: SavedLocation[] }>({
    mutationFn: deleteSavedLocation,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousLocations = queryClient.getQueryData<SavedLocation[]>(queryKey);

      queryClient.setQueryData<SavedLocation[]>(queryKey, (old) =>
        (old || []).filter((loc) => loc.id !== deletedId),
      );

      return { previousLocations };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(queryKey, context.previousLocations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    savedLocations: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error ?? saveMutation.error ?? deleteMutation.error ?? null,
    refetch: list.refetch,

    saveLocation: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    deleteLocation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
