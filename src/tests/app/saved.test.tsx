import { Fragment, createElement } from 'react';
import { Alert } from 'react-native';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SavedLocationsScreen from '@/app/saved';

const { backMock } = vi.hoisted(() => ({ backMock: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: backMock, push: vi.fn() }),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

// Reanimated relies on native modules that don't exist under jsdom, so stub the
// pieces SavedLocationItem uses (mirrors the OfflineIndicator test).
vi.mock('react-native-reanimated', () => ({
  default: { View: ({ children }: any) => createElement(Fragment, null, children) },
  useAnimatedStyle: vi.fn(() => ({})),
}));

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

    expect(screen.getByText('Loading saved locations...')).toBeTruthy();
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

  it('asks for confirmation and deletes on confirm', async () => {
    const deleteLocation = vi.fn().mockResolvedValue(undefined);
    mockHook.mockReturnValue(baseHook({ savedLocations: sampleLocations, deleteLocation }));

    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<SavedLocationsScreen />);

    fireEvent.click(screen.getByLabelText('Delete Manila'));

    // Confirmation dialog shown
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete this saved location?',
      'This action cannot be undone.',
      expect.any(Array),
    );

    // Invoke the "Delete" button from the confirmation dialog
    const buttons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    const deleteButton = buttons.find((b) => b.text === 'Delete');
    await deleteButton?.onPress?.();

    expect(deleteLocation).toHaveBeenCalledWith('1');
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Location deleted', 'Manila was removed.');
    });
  });

  it('surfaces an error if deletion fails', async () => {
    const deleteLocation = vi.fn().mockRejectedValue(new Error('boom'));
    mockHook.mockReturnValue(baseHook({ savedLocations: sampleLocations, deleteLocation }));

    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<SavedLocationsScreen />);
    fireEvent.click(screen.getByLabelText('Delete Manila'));

    const buttons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    await buttons.find((b) => b.text === 'Delete')?.onPress?.();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete failed',
        'Could not delete the location. Please try again.',
      );
    });
  });
});
