import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useNetworkStore } from '@/store/useNetworkStore';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    useNetworkStore.setState({ isConnected: true });
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    const { getByText } = render(<OfflineIndicator />);
    expect(getByText('Offline. Displaying cached data.')).toBeTruthy();
  });

  // Note: the component is currently always rendering the text but its container opacity/height changes via reanimated.
  // We can just assert that it renders correctly and doesn't crash.
});
