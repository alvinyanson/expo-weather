import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSavedLocation, getSavedLocations, saveLocation } from '@/services';
import { useAuthStore } from '@/store/useAuthStore';
import type { SavedLocation, SaveLocationInput } from '@/interfaces';
import Toast from 'react-native-toast-message';
import { reportError } from '@/services/crash.service';
import { t } from '@/services/i18n';

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

  const toggleSavedLocation = async (
    targetLocation: { lat: number; lon: number; city: string } | null | undefined,
  ) => {
    if (!targetLocation) return;
    const matchingSaved = list.data?.find(
      (loc) =>
        loc.city.toLowerCase() === targetLocation.city.toLowerCase() ||
        (Math.abs(loc.lat - targetLocation.lat) < 0.01 &&
          Math.abs(loc.lon - targetLocation.lon) < 0.01),
    );

    try {
      if (matchingSaved) {
        await deleteMutation.mutateAsync(matchingSaved.id);
        Toast.show({
          type: 'success',
          text1: t('toastDeletedTitle'),
          text2: t('toastDeletedBody'),
        });
      } else {
        await saveMutation.mutateAsync({
          city: targetLocation.city,
          lat: targetLocation.lat,
          lon: targetLocation.lon,
        });
        Toast.show({ type: 'success', text1: t('toastSavedTitle'), text2: t('toastSavedBody') });
      }
    } catch (e) {
      reportError(e, { where: 'useSavedLocations.toggleSavedLocation' });
      Toast.show({ type: 'error', text1: t('toastErrorTitle'), text2: t('toastErrorBody') });
    }
  };

  const confirmDeleteLocation = async (
    locationToDelete: SavedLocation | null | undefined,
    onSettled?: () => void,
  ) => {
    if (!locationToDelete) return;
    try {
      await deleteMutation.mutateAsync(locationToDelete.id);
      onSettled?.();
      Toast.show({
        type: 'success',
        text1: t('toastConfirmDeletedTitle'),
        text2: t('toastConfirmDeletedBody', { city: locationToDelete.city }),
      });
    } catch (e) {
      onSettled?.();
      reportError(e, { where: 'useSavedLocations.confirmDeleteLocation' });
      Toast.show({
        type: 'error',
        text1: t('toastDeleteFailedTitle'),
        text2: t('toastDeleteFailedBody'),
      });
    }
  };

  return {
    savedLocations: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error ?? saveMutation.error ?? deleteMutation.error ?? null,
    refetch: list.refetch,

    saveLocation: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    deleteLocation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    toggleSavedLocation,
    confirmDeleteLocation,
  };
};
