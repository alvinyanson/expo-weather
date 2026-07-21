import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DetailsHeader } from '@/components/DetailsHeader';
import type { WeatherResponse } from '@/interfaces';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

const weather = {
  current: { weather_code: 0 },
} as unknown as WeatherResponse;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DetailsHeader', () => {
  it('renders city name, weather condition, and last updated time', () => {
    const onBack = vi.fn();
    render(
      <DetailsHeader city="Manila" weather={weather} lastUpdated="10:00 AM" onBack={onBack} />,
    );

    expect(screen.getByText('Manila')).toBeTruthy();
    expect(screen.getByText('Clear Sky')).toBeTruthy();
    expect(screen.getByText('Updated 10:00 AM')).toBeTruthy();
  });

  it('triggers onBack when back button is pressed', () => {
    const onBack = vi.fn();
    render(
      <DetailsHeader city="Manila" weather={weather} lastUpdated="10:00 AM" onBack={onBack} />,
    );

    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders save button and triggers onSave when provided', () => {
    const onBack = vi.fn();
    const onSave = vi.fn();

    render(
      <DetailsHeader
        city="Manila"
        weather={weather}
        lastUpdated="10:00 AM"
        onBack={onBack}
        onSave={onSave}
        isSaved={false}
      />,
    );

    const saveButton = screen.getByTestId('details-save-button');
    expect(saveButton).toBeTruthy();

    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('does not render save button when onSave is not provided', () => {
    const onBack = vi.fn();
    render(
      <DetailsHeader city="Manila" weather={weather} lastUpdated="10:00 AM" onBack={onBack} />,
    );

    expect(screen.queryByTestId('details-save-button')).toBeNull();
  });

  it('renders share button and triggers onShare when provided', () => {
    const onBack = vi.fn();
    const onShare = vi.fn();

    render(
      <DetailsHeader
        city="Manila"
        weather={weather}
        lastUpdated="10:00 AM"
        onBack={onBack}
        onShare={onShare}
      />,
    );

    const shareButton = screen.getByTestId('details-share-button');
    expect(shareButton).toBeTruthy();

    fireEvent.click(shareButton);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('does not render share button when onShare is not provided', () => {
    const onBack = vi.fn();
    render(
      <DetailsHeader city="Manila" weather={weather} lastUpdated="10:00 AM" onBack={onBack} />,
    );

    expect(screen.queryByTestId('details-share-button')).toBeNull();
  });
});
