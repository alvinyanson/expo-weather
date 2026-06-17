import { useQuery } from '@tanstack/react-query';
import { LocationData } from '@/interfaces';
import { fetchLocation } from '@/services';

export const useFetchLocation = () => {
  return useQuery<LocationData, Error>({
    queryKey: ['location'],
    queryFn: fetchLocation,
    retry: 1, // Only retry once for location
  });
};
