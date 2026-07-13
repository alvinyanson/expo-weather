import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationSearchResult } from '@/interfaces';

interface SearchStore {
  recentSearches: LocationSearchResult[];
  addSearch: (location: LocationSearchResult) => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      recentSearches: [],
      addSearch: (location) =>
        set((state) => {
          const filtered = state.recentSearches.filter((item) => item.id !== location.id);
          return {
            recentSearches: [location, ...filtered].slice(0, 10),
          };
        }),
    }),
    {
      name: 'recent-searches-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
