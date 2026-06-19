import { create } from 'zustand';

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface SearchStore {
  recentSearches: LocationSearchResult[];
  addSearch: (location: LocationSearchResult) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  recentSearches: [],
  addSearch: (location) =>
    set((state) => {
      const filtered = state.recentSearches.filter((item) => item.id !== location.id);
      return {
        recentSearches: [location, ...filtered].slice(0, 10),
      };
    }),
}));
