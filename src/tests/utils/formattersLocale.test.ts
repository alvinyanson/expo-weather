import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAppLocale,
  formatNumber,
  formatRound,
  formatDateFull,
  formatDayName,
  formatTime,
  formatHourlyTime,
  formatRelativeTime,
  formatCoordinates,
  formatPressure,
} from '@/utils/formatters';
import { i18n } from '@/services/i18n';

describe('formattersLocale', () => {
  let originalLocale: string;

  beforeEach(() => {
    originalLocale = i18n.locale;
  });

  afterEach(() => {
    i18n.locale = originalLocale;
  });

  describe('getAppLocale', () => {
    it('returns current i18n locale', () => {
      i18n.locale = 'ja';
      expect(getAppLocale()).toBe('ja');

      i18n.locale = 'en';
      expect(getAppLocale()).toBe('en');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers for en locale', () => {
      expect(formatNumber(1234567.89, undefined, 'en')).toBe('1,234,567.89');
    });

    it('formats numbers for ja locale', () => {
      expect(formatNumber(1234567.89, undefined, 'ja')).toBe('1,234,567.89');
    });

    it('respects Intl.NumberFormatOptions', () => {
      expect(
        formatNumber(12.3456, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, 'en'),
      ).toBe('12.35');
    });

    it('defaults to getAppLocale when locale parameter is omitted', () => {
      i18n.locale = 'en';
      expect(formatNumber(1000)).toBe('1,000');
    });
  });

  describe('formatRound', () => {
    it('rounds and formats number according to locale', () => {
      expect(formatRound(23.6, 'en')).toBe('24');
      expect(formatRound(23.4, 'ja')).toBe('23');
    });
  });

  describe('formatDateFull', () => {
    it('formats date full string for en locale', () => {
      const testDate = new Date(2026, 5, 26); // June 26, 2026
      const result = formatDateFull(testDate, 'en');
      expect(result).toContain('June');
      expect(result).toContain('26');
    });

    it('formats date full string for ja locale', () => {
      const testDate = new Date(2026, 5, 26); // June 26, 2026
      const result = formatDateFull(testDate, 'ja');
      expect(result).toContain('6月26日');
    });
  });

  describe('formatDayName', () => {
    it('formats weekday name for en locale', () => {
      const testDate = new Date(2026, 5, 25); // Thursday
      expect(formatDayName(testDate, 'en')).toBe('Thursday');
    });

    it('formats weekday name for ja locale', () => {
      const testDate = new Date(2026, 5, 25); // Thursday
      expect(formatDayName(testDate, 'ja')).toBe('木曜日');
    });
  });

  describe('formatTime', () => {
    it('formats time string for en locale', () => {
      const testDate = new Date(2026, 5, 26, 10, 30);
      const formatted = formatTime(testDate, 'en');
      expect(formatted).toMatch(/10:30\s*AM/i);
    });

    it('formats time string for ja locale', () => {
      const testDate = new Date(2026, 5, 26, 10, 30);
      const formatted = formatTime(testDate, 'ja');
      expect(formatted).toContain('10:30');
    });
  });

  describe('formatHourlyTime', () => {
    it('formats hourly time for en locale', () => {
      const testDate = new Date(2026, 5, 26, 10, 0);
      const formatted = formatHourlyTime(testDate, 'en');
      expect(formatted.toLowerCase()).toContain('10');
    });

    it('formats hourly time for ja locale', () => {
      const testDate = new Date(2026, 5, 26, 10, 0);
      const formatted = formatHourlyTime(testDate, 'ja');
      expect(formatted).toContain('10');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats past minutes in en locale', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinsAgo, 'en');
      expect(result).toMatch(/5 minutes ago/i);
    });

    it('formats past minutes in ja locale', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinsAgo, 'ja');
      expect(result).toContain('5');
      expect(result).toContain('分前');
    });

    it('formats past hours in en locale', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
      const result = formatRelativeTime(twoHoursAgo, 'en');
      expect(result).toMatch(/2 hours ago/i);
    });

    it('formats past days in ja locale', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000);
      const result = formatRelativeTime(threeDaysAgo, 'ja');
      expect(result).toContain('3');
    });
  });

  describe('formatCoordinates', () => {
    it('formats coordinates with 4 decimal places for en', () => {
      expect(formatCoordinates(14.5995, 120.9842, 'en')).toBe('14.5995, 120.9842');
    });

    it('formats coordinates with 4 decimal places for ja', () => {
      expect(formatCoordinates(14.5995, 120.9842, 'ja')).toBe('14.5995, 120.9842');
    });
  });

  describe('formatPressure', () => {
    it('formats pressure as whole number string for en and ja', () => {
      expect(formatPressure(1013.25, 'en')).toBe('1013');
      expect(formatPressure(1013.25, 'ja')).toBe('1013');
    });
  });
});
