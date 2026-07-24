import { Fragment, createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SavedLocationsScreen from '@/app/saved';

const { backMock, pushMock } = vi.hoisted(() => ({ backMock: vi.fn(), pushMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: backMock, push: pushMock }),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

// Render the Swipeable's content and its (normally hidden) right actions inline
// so the Delete action is present in the DOM without simulating a real gesture.
vi.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  default: ({ children, renderRightActions }: any) =>
    createElement(
      Fragment,
      null,
      children,
      renderRightActions?.({ value: 0 }, { value: 0 }, { close: vi.fn() }),
    ),
}));

vi.mock('@/hooks', () => ({
  useSavedLocations: vi.fn(),
}));

import { useSavedLocations } from '@/hooks';

const mockHook = vi.mocked(useSavedLocations);

const baseHook = (overrides = {}) =>
  ({
    savedLocations: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    saveLocation: vi.fn(),
    isSaving: false,
    deleteLocation: vi.fn(),
    isDeleting: false,
    reorderSavedLocations: vi.fn(),
    isReordering: false,
    toggleSavedLocation: vi.fn(),
    confirmDeleteLocation: vi.fn(),
    ...overrides,
  }) as never;

const sampleLocations = [
  { id: '1', city: 'Manila', lat: 14.6, lon: 120.98, userId: 'u1', createdAt: 1700000000000 },
  { id: '2', city: 'Tokyo', lat: 35.68, lon: 139.69, userId: 'u1', createdAt: null },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('SavedLocationsScreen', () => {
  it('shows the loading state', () => {
    mockHook.mockReturnValue(baseHook({ isLoading: true }));

    render(<SavedLocationsScreen />);

    expect(screen.getByTestId('saved-skeleton')).toBeTruthy();
  });

  it('shows the empty state when there are no saved locations', () => {
    mockHook.mockReturnValue(baseHook({ savedLocations: [] }));

    render(<SavedLocationsScreen />);

    expect(screen.getByText('No saved locations yet.')).toBeTruthy();
  });

  it('renders the populated list', () => {
    mockHook.mockReturnValue(baseHook({ savedLocations: sampleLocations }));

    render(<SavedLocationsScreen />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('Tokyo')).toBeTruthy();
  });

  it('shows an error state with a retry action', () => {
    const refetch = vi.fn();
    mockHook.mockReturnValue(baseHook({ error: new Error('Network failed'), refetch }));

    render(<SavedLocationsScreen />);
    expect(screen.getByText('Network failed')).toBeTruthy();

    fireEvent.click(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('asks for confirmation and delegates to confirmDeleteLocation on confirm', async () => {
    const confirmDeleteLocation = vi.fn();
    mockHook.mockReturnValue(baseHook({ savedLocations: sampleLocations, confirmDeleteLocation }));

    render(<SavedLocationsScreen />);

    fireEvent.click(screen.getByLabelText('Delete Manila'));

    // Confirmation dialog shown (BottomSheet title)
    expect(screen.getByText('Delete Saved Location?')).toBeTruthy();

    // Click confirm delete button
    fireEvent.click(screen.getByTestId('confirm-delete-button'));

    expect(confirmDeleteLocation).toHaveBeenCalledWith(sampleLocations[0], expect.any(Function));
  });

  it('navigates to details screen on item press', () => {
    mockHook.mockReturnValue(baseHook({ savedLocations: sampleLocations }));

    render(<SavedLocationsScreen />);

    fireEvent.click(screen.getByText('Manila'));

    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/details',
      params: { lat: 14.6, lon: 120.98, city: 'Manila' },
    });
  });
});
