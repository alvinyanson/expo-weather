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
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const saveMutation = useMutation<string, Error, SaveLocationInput>({
    mutationFn: (location) => {
      if (!uid) throw new Error('You must be signed in to save a location.');
      return saveLocation(uid, location);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteSavedLocation,
    onSuccess: invalidate,
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
