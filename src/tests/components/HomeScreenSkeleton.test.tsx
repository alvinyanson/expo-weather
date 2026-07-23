import { render, screen } from '@testing-library/react';
import * as RN from 'react-native';
import { HomeScreenSkeleton } from '@/components/skeletons/HomeScreenSkeleton';

describe('HomeScreenSkeleton', () => {
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

  it('renders default home-skeleton testID on mobile', () => {
    render(<HomeScreenSkeleton />);
    expect(screen.getByTestId('home-skeleton')).toBeTruthy();
  });

  it('renders custom testID', () => {
    render(<HomeScreenSkeleton testID="custom-home-skeleton" />);
    expect(screen.getByTestId('custom-home-skeleton')).toBeTruthy();
  });

  it('adapts structure when rendered on tablet width', () => {
    vi.spyOn(RN, 'useWindowDimensions').mockReturnValue({
      width: 800,
      height: 1024,
      scale: 1,
      fontScale: 1,
    });
    render(<HomeScreenSkeleton />);
    expect(screen.getByTestId('home-skeleton')).toBeTruthy();
  });
});
