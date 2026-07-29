import { describe, it, expect } from 'vitest';
import {
  formatRound,
  formatDateFull,
  formatDayName,
  formatTime,
  formatHourlyTime,
  formatCoordinates,
  formatPressure,
  formatNumber,
  formatRelativeTime,
  getAppLocale,
} from '@/utils/formatters';

describe('formatters', () => {
  it('formatRound rounds to a whole number', () => {
    expect(formatRound(23.6)).toBe('24');
    expect(formatRound(23.4)).toBe('23');
  });

  it('formatDateFull returns formatted date string', () => {
    const res = formatDateFull('2026-06-26');
    expect(res).toBeTruthy();
    expect(typeof res).toBe('string');
  });

  it('formatDayName returns full weekday name', () => {
    const res = formatDayName('2026-06-25');
    expect(res).toBeTruthy();
    expect(typeof res).toBe('string');
  });

  it('formatTime returns formatted time string', () => {
    const res = formatTime('2026-06-26T10:30:00');
    expect(res).toBeTruthy();
    expect(typeof res).toBe('string');
  });

  it('formatHourlyTime returns formatted hourly time string', () => {
    const res = formatHourlyTime('2026-06-26T10:00:00');
    expect(res).toBeTruthy();
    expect(typeof res).toBe('string');
  });

  it('formatCoordinates formats coordinates with 4 decimals', () => {
    expect(formatCoordinates(14.5995, 120.9842)).toBe('14.5995, 120.9842');
  });

  it('formatPressure rounds pressure to a whole number string without grouping', () => {
    expect(formatPressure(1013.2)).toBe('1013');
  });

  it('formatNumber formats numbers using Intl.NumberFormat', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('formatRelativeTime formats relative elapsed time', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinsAgo)).toContain('5');
  });

  it('getAppLocale returns active locale string', () => {
    expect(getAppLocale()).toBeTruthy();
  });
});
