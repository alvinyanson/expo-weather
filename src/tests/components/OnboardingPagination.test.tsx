import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OnboardingPagination } from '@/components/OnboardingPagination';

describe('OnboardingPagination', () => {
  it('renders correct dot count and testIDs per index', () => {
    const scrollX = { value: 0 };
    const { getByTestId } = render(
      <OnboardingPagination
        scrollX={scrollX as any}
        count={3}
        slideWidth={375}
        testID="pagination-container"
      />,
    );

    expect(getByTestId('pagination-container')).toBeTruthy();
    expect(getByTestId('onboarding-dot-0')).toBeTruthy();
    expect(getByTestId('onboarding-dot-1')).toBeTruthy();
    expect(getByTestId('onboarding-dot-2')).toBeTruthy();
  });
});
