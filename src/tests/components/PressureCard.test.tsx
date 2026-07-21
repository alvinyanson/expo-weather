import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PressureCard } from '@/components/PressureCard';
import type { BarometerStatus } from '@/hooks/useBarometer';

const { useBarometer } = vi.hoisted(() => ({ useBarometer: vi.fn() }));

vi.mock('@/hooks/useBarometer', () => ({ useBarometer }));

const drive = (status: BarometerStatus, pressure: number | null) =>
  useBarometer.mockReturnValue({ status, pressure });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PressureCard', () => {
  it('shows the checking state', () => {
    drive('checking', null);
    render(<PressureCard />);
    expect(screen.getByText('Checking sensor...')).toBeTruthy();
  });

  it('shows the unavailable message and no sensor value', () => {
    drive('unavailable', null);
    render(<PressureCard forecastPressure={1010} />);
    expect(screen.getByText('No barometer on this device.')).toBeTruthy();
    // Forecast row still shown so the card is not empty.
    expect(screen.getByText('Forecast')).toBeTruthy();
    expect(screen.getByText('1010 hPa')).toBeTruthy();
    expect(screen.queryByText('Device')).toBeNull();
  });

  it('shows the sensor reading when available', () => {
    drive('available', 1013.2);
    render(<PressureCard />);
    expect(screen.getByText('Device')).toBeTruthy();
    expect(screen.getByText('1013 hPa')).toBeTruthy();
    // No forecast, no note.
    expect(screen.queryByText('Forecast')).toBeNull();
  });

  it('notes when the sensor matches the forecast (within 1 hPa)', () => {
    drive('available', 1013);
    render(<PressureCard forecastPressure={1013.4} />);
    expect(screen.getByText('Matches the forecast.')).toBeTruthy();
  });

  it('notes when the sensor is above the forecast', () => {
    drive('available', 1020);
    render(<PressureCard forecastPressure={1013} />);
    expect(screen.getByText('7 hPa above forecast')).toBeTruthy();
  });

  it('notes when the sensor is below the forecast', () => {
    drive('available', 1005);
    render(<PressureCard forecastPressure={1013} />);
    expect(screen.getByText('8 hPa below forecast')).toBeTruthy();
  });
});
