import { describe, it, expect } from 'vitest';
import { formatCoordinates } from '@/utils/formatters';

describe('formatCoordinates', () => {
  it('joins lat and lon rounded to 4 decimals', () => {
    expect(formatCoordinates(14.5995, 120.9842)).toBe('14.5995, 120.9842');
  });

  it('rounds values with more than 4 decimals', () => {
    expect(formatCoordinates(14.599512, 120.984219)).toBe('14.5995, 120.9842');
  });

  it('pads values with fewer than 4 decimals', () => {
    expect(formatCoordinates(1, 2.5)).toBe('1.0000, 2.5000');
  });

  it('handles negative coordinates', () => {
    expect(formatCoordinates(-33.8688, -151.2093)).toBe('-33.8688, -151.2093');
  });
});
