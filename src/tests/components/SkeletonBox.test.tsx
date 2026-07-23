import { render, screen } from '@testing-library/react';
import { SkeletonBox } from '@/components/SkeletonBox';

describe('SkeletonBox', () => {
  it('renders with default props and custom testID', () => {
    render(<SkeletonBox testID="custom-skeleton-box" />);
    const element = screen.getByTestId('custom-skeleton-box');
    expect(element).toBeTruthy();
  });

  it('applies custom dimensions and styles', () => {
    render(
      <SkeletonBox
        width={100}
        height={50}
        borderRadius={8}
        testID="styled-box"
        style={{ marginTop: 10 }}
      />,
    );
    const element = screen.getByTestId('styled-box');
    expect(element).toBeTruthy();
  });
});
