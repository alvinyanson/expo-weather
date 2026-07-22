import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SearchHeader } from '@/components/SearchHeader';

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/hooks', () => ({
  useDebounce: vi.fn((val) => val), // mock debounce to return value immediately
  useSearchLocation: vi.fn(),
}));

const mockAddSearch = vi.fn();
vi.mock('@/store/useSearchStore', () => ({
  useSearchStore: vi.fn(() => ({
    addSearch: mockAddSearch,
    recentSearches: [],
  })),
}));

import { useSearchLocation } from '@/hooks';
const mockSearchHook = vi.mocked(useSearchLocation);

const searchResults = [
  { id: 101, name: 'Tokyo', latitude: 35.6895, longitude: 139.6917, country: 'Japan' },
];

const searchHookState = (overrides = {}) =>
  ({
    data: undefined,
    isFetching: false,
    ...overrides,
  }) as never;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SearchHeader', () => {
  it('renders search input correctly', () => {
    mockSearchHook.mockReturnValue(searchHookState());
    render(<SearchHeader />);
    expect(screen.getByPlaceholderText('Search city...')).toBeTruthy();
  });

  it('shows search results and selects a location', () => {
    mockSearchHook.mockReturnValue(searchHookState({ data: searchResults }));
    render(<SearchHeader />);

    const searchInput = screen.getByPlaceholderText('Search city...');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Tok' } });

    expect(screen.getByText('Tokyo, Japan')).toBeTruthy();

    fireEvent.click(screen.getByText('Tokyo, Japan'));

    expect(mockAddSearch).toHaveBeenCalledWith(searchResults[0]);
    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: { lat: 35.6895, lon: 139.6917, city: 'Tokyo' },
    });
  });

  it('navigates to settings on settings button press', () => {
    mockSearchHook.mockReturnValue(searchHookState());
    render(<SearchHeader />);

    fireEvent.click(screen.getByTestId('settings-button'));
    expect(pushMock).toHaveBeenCalledWith('/settings');
  });

  it('navigates to saved locations on saved locations button press', () => {
    mockSearchHook.mockReturnValue(searchHookState());
    render(<SearchHeader />);

    fireEvent.click(screen.getByTestId('saved-locations-button'));
    expect(pushMock).toHaveBeenCalledWith('/saved');
  });

  it('navigates to the map on map button press', () => {
    mockSearchHook.mockReturnValue(searchHookState());
    render(<SearchHeader />);

    fireEvent.click(screen.getByTestId('map-button'));
    expect(pushMock).toHaveBeenCalledWith('/map');
  });
});
