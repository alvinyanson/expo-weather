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

  // Note: react-native-web drops onLongPress on Text (only native fires it), so the
  // long-press -> copy path is exercised by the useCopyCoordinates hook test and
  // verified manually on device. Here we assert the testable wiring surface.
  it('exposes the city name under testID for the copy-coordinates long-press', () => {
    const onBack = vi.fn();
    const onCopyCoordinates = vi.fn();
    render(
      <DetailsHeader
        city="Manila"
        weather={weather}
        lastUpdated="10:00 AM"
        onBack={onBack}
        onCopyCoordinates={onCopyCoordinates}
      />,
    );

    expect(screen.getByTestId('details-city')).toBeTruthy();
    expect(screen.getByTestId('details-city').textContent).toBe('Manila');
  });

  it('renders the city name unchanged when onCopyCoordinates is omitted', () => {
    const onBack = vi.fn();
    render(
      <DetailsHeader city="Manila" weather={weather} lastUpdated="10:00 AM" onBack={onBack} />,
    );

    expect(screen.getByTestId('details-city').textContent).toBe('Manila');
  });
});
