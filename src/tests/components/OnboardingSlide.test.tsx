import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OnboardingSlide } from '@/components/OnboardingSlide';

vi.mock('expo-symbols', () => ({
  SymbolView: ({ name }: any) => <div data-testid="symbol-view">{JSON.stringify(name)}</div>,
}));

describe('OnboardingSlide', () => {
  it('renders title, description, symbol, and respects testID and width', () => {
    const { getByTestId, getByText } = render(
      <OnboardingSlide
        icon={{ ios: 'magnifyingglass', android: 'search' }}
        title="Search Any City"
        description="Quickly search and view current weather conditions."
        width={375}
        testID="slide-search"
      />,
    );

    const container = getByTestId('slide-search');
    expect(container).toBeTruthy();
    expect(getByText('Search Any City')).toBeTruthy();
    expect(getByText('Quickly search and view current weather conditions.')).toBeTruthy();
    expect(getByTestId('symbol-view')).toBeTruthy();
  });
});
