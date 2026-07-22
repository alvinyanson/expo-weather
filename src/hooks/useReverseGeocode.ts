import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { reverseGeocode } from '@/services/location.service';

export function useReverseGeocode(coords?: {
  latitude: number;
  longitude: number;
}): UseQueryResult<string, Error> {
  return useQuery({
    queryKey: ['reverseGeocode', coords?.latitude, coords?.longitude],
    queryFn: () => {
      if (!coords) throw new Error('Coordinates required');
      return reverseGeocode(coords.latitude, coords.longitude);
    },
    enabled: !!coords,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
