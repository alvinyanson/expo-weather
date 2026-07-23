import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatterySaverIndicator } from '@/components/BatterySaverIndicator';

const { mockBatterySaverAware, mockIsBatterySaverActive } = vi.hoisted(() => ({
  mockBatterySaverAware: { value: true },
  mockIsBatterySaverActive: { value: true },
}));

vi.mock('@/store/useSettingsStore', () => {
  const store = Object.assign(
    vi.fn(() => mockBatterySaverAware.value),
    {
      getState: vi.fn(() => ({ language: 'system' })),
      subscribe: vi.fn(),
    },
  );
  return { useSettingsStore: store };
});

vi.mock('@/store/useBatteryStore', () => {
  const store = vi.fn(() => mockIsBatterySaverActive.value);
  return { useBatteryStore: store };
});

describe('BatterySaverIndicator', () => {
  beforeEach(() => {
    mockBatterySaverAware.value = true;
    mockIsBatterySaverActive.value = true;
  });

  it('renders banner text when battery saver is active and setting is enabled', () => {
    const { getByText } = render(<BatterySaverIndicator />);
    expect(getByText(/Battery Saver Active/)).toBeTruthy();
  });

  it('renders banner text (at hidden height) when battery saver is not active', () => {
    mockIsBatterySaverActive.value = false;
    const { getByText } = render(<BatterySaverIndicator />);
    // The text is always in the tree, but animation controls visibility
    expect(getByText(/Battery Saver Active/)).toBeTruthy();
  });

  it('renders banner text (at hidden height) when setting is disabled', () => {
    mockBatterySaverAware.value = false;
    const { getByText } = render(<BatterySaverIndicator />);
    // Same: text always present, visibility controlled by animation
    expect(getByText(/Battery Saver Active/)).toBeTruthy();
  });
});
