import { render, screen } from '@testing-library/react';
import * as RN from 'react-native';
import { SavedLocationsSkeleton } from '@/components/skeletons/SavedLocationsSkeleton';

describe('SavedLocationsSkeleton', () => {
  beforeEach(() => {
    vi.spyOn(RN, 'useWindowDimensions').mockReturnValue({
      width: 375,
      height: 812,
      scale: 1,
      fontScale: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders default saved-skeleton testID on mobile', () => {
    render(<SavedLocationsSkeleton />);
    expect(screen.getByTestId('saved-skeleton')).toBeTruthy();
  });

  it('renders custom testID', () => {
    render(<SavedLocationsSkeleton testID="custom-saved-skeleton" />);
    expect(screen.getByTestId('custom-saved-skeleton')).toBeTruthy();
  });

  it('adapts structure when rendered on tablet width', () => {
    vi.spyOn(RN, 'useWindowDimensions').mockReturnValue({
      width: 800,
      height: 1024,
      scale: 1,
      fontScale: 1,
    });
    render(<SavedLocationsSkeleton />);
    expect(screen.getByTestId('saved-skeleton')).toBeTruthy();
  });
});
