import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OnboardingScreen from '@/app/onboarding';
import { useOnboardingStore } from '@/store/useOnboardingStore';

vi.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      hasCompletedOnboarding: false,
      hasHydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders initial slide and Next button on first render', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Search Any City')).toBeTruthy();
    expect(
      screen.getByText(
        'Quickly search and view current weather conditions and forecasts for cities worldwide.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('onboarding-next')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-get-started')).toBeNull();
  });

  it('navigates to next slide when Next button is pressed', () => {
    render(<OnboardingScreen />);

    fireEvent.click(screen.getByTestId('onboarding-next'));

    // Slide index should now be 1
    expect(screen.getByText('Save Favorite Locations')).toBeTruthy();
    expect(screen.getByTestId('onboarding-next')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-get-started')).toBeNull();

    fireEvent.click(screen.getByTestId('onboarding-next'));

    // Slide index should now be 2
    expect(screen.getByText('Stay Informed')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-next')).toBeNull();
    expect(screen.getByTestId('onboarding-get-started')).toBeTruthy();
  });

  it('calls completeOnboarding when Get Started button is pressed', () => {
    const completeSpy = vi.spyOn(useOnboardingStore.getState(), 'completeOnboarding');

    render(<OnboardingScreen />);

    // Advance to final slide
    fireEvent.click(screen.getByTestId('onboarding-next'));
    fireEvent.click(screen.getByTestId('onboarding-next'));

    const getStartedBtn = screen.getByTestId('onboarding-get-started');
    act(() => {
      fireEvent.click(getStartedBtn);
    });

    expect(completeSpy).toHaveBeenCalled();
  });
});
