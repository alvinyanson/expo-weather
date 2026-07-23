import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOnboardingStore } from '@/store/useOnboardingStore';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      hasCompletedOnboarding: false,
      hasHydrated: false,
    });
    vi.clearAllMocks();
  });

  it('has default initial state', () => {
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(false);
    expect(state.hasHydrated).toBe(false);
  });

  it('can complete onboarding', () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('can set hydration state', () => {
    useOnboardingStore.getState().setHasHydrated(true);
    expect(useOnboardingStore.getState().hasHydrated).toBe(true);

    useOnboardingStore.getState().setHasHydrated(false);
    expect(useOnboardingStore.getState().hasHydrated).toBe(false);
  });
});
