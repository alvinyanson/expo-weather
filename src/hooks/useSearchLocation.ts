import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '@/services/location.service';

export function useSearchLocation(query: string) {
  return useQuery({
    queryKey: ['searchLocations', query],
    queryFn: () => searchLocations(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
