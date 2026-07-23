import { render, screen } from '@testing-library/react';
import * as RN from 'react-native';
import { DetailsScreenSkeleton } from '@/components/skeletons/DetailsScreenSkeleton';

describe('DetailsScreenSkeleton', () => {
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

  it('renders default details-skeleton testID on mobile', () => {
    render(<DetailsScreenSkeleton />);
    expect(screen.getByTestId('details-skeleton')).toBeTruthy();
  });

  it('renders custom testID', () => {
    render(<DetailsScreenSkeleton testID="custom-details-skeleton" />);
    expect(screen.getByTestId('custom-details-skeleton')).toBeTruthy();
  });

  it('adapts structure when rendered on tablet width', () => {
    vi.spyOn(RN, 'useWindowDimensions').mockReturnValue({
      width: 800,
      height: 1024,
      scale: 1,
      fontScale: 1,
    });
    render(<DetailsScreenSkeleton />);
    expect(screen.getByTestId('details-skeleton')).toBeTruthy();
  });
});
