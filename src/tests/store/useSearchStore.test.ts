import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSearchStore } from '@/store/useSearchStore';

describe('useSearchStore', () => {
  beforeEach(() => {
    // Clear store before each test
    useSearchStore.setState({ recentSearches: [] });
    vi.clearAllMocks();
  });

  it('should start with an empty list of recent searches', () => {
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });

  it('should add a new search to the recent searches', () => {
    const location = { id: 1, name: 'London', latitude: 51.5, longitude: -0.1 };

    useSearchStore.getState().addSearch(location);

    expect(useSearchStore.getState().recentSearches).toHaveLength(1);
    expect(useSearchStore.getState().recentSearches[0]).toEqual(location);
  });

  it('should not add duplicate locations, but move existing to the top', () => {
    const loc1 = { id: 1, name: 'London', latitude: 51.5, longitude: -0.1 };
    const loc2 = { id: 2, name: 'Paris', latitude: 48.8, longitude: 2.3 };

    useSearchStore.getState().addSearch(loc1);
    useSearchStore.getState().addSearch(loc2);
    useSearchStore.getState().addSearch(loc1); // add duplicate

    const searches = useSearchStore.getState().recentSearches;
    expect(searches).toHaveLength(2);
    expect(searches[0]).toEqual(loc1); // moved to top
    expect(searches[1]).toEqual(loc2);
  });

  it('should keep only the 10 most recent searches', () => {
    for (let i = 1; i <= 15; i++) {
      useSearchStore.getState().addSearch({
        id: i,
        name: `City ${i}`,
        latitude: 0,
        longitude: 0,
      });
    }

    const searches = useSearchStore.getState().recentSearches;
    expect(searches).toHaveLength(10);
    expect(searches[0]!.id).toBe(15);
    expect(searches[9]!.id).toBe(6);
  });
});
