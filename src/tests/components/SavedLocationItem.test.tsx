import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SavedLocationItem } from '@/components/SavedLocationItem';
import type { SavedLocation } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('react-native-reanimated', () => ({
  default: { View: ({ children }: any) => <div>{children}</div> },
  useAnimatedStyle: vi.fn(() => ({})),
}));

vi.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  default: ({ children, renderRightActions }: any) => (
    <div>
      {children}
      {renderRightActions?.({ value: 0 }, { value: 0 }, { close: vi.fn() })}
    </div>
  ),
}));

const mockLocation: SavedLocation = {
  id: 'loc-1',
  city: 'Manila',
  lat: 14.5995,
  lon: 120.9842,
  userId: 'user-1',
  createdAt: 1700000000000,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SavedLocationItem', () => {
  it('renders location city and saved date', () => {
    const onDelete = vi.fn();
    const onPress = vi.fn();

    render(<SavedLocationItem location={mockLocation} onDelete={onDelete} onPress={onPress} />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByTestId('saved-location-date')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('triggers onPress when clicked', () => {
    const onDelete = vi.fn();
    const onPress = vi.fn();

    render(<SavedLocationItem location={mockLocation} onDelete={onDelete} onPress={onPress} />);

    fireEvent.click(screen.getByTestId('saved-location-item'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('triggers onDelete when delete button is pressed', () => {
    const onDelete = vi.fn();
    const onPress = vi.fn();

    render(<SavedLocationItem location={mockLocation} onDelete={onDelete} onPress={onPress} />);

    fireEvent.click(screen.getByTestId('delete-location-button'));
    expect(onDelete).toHaveBeenCalledWith(mockLocation);
  });

  it('handles location without createdAt date', () => {
    const locationNoDate: SavedLocation = { ...mockLocation, createdAt: null };
    const onDelete = vi.fn();
    const onPress = vi.fn();

    render(<SavedLocationItem location={locationNoDate} onDelete={onDelete} onPress={onPress} />);

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.queryByTestId('saved-location-date')).toBeNull();
  });
});
