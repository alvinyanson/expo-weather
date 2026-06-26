import { cleanup, render, screen } from '@testing-library/react';
import { DetailsHeader } from '@/components/DetailsHeader';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const weather = {
  current: { weather_code: 0 },
} as any;

afterEach(() => {
  cleanup();
});

describe('DetailsHeader', () => {
  it('renders correctly', () => {
    const onBack = vi.fn();
    render(
      <DetailsHeader city="Manila" weather={weather} lastUpdated="10:00 AM" onBack={onBack} />,
    );

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('Clear Sky')).toBeTruthy();
    expect(screen.getByText('Updated 10:00 AM')).toBeTruthy();
  });
});
