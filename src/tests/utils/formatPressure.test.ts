import { describe, it, expect } from 'vitest';
import { formatPressure } from '@/utils/formatters';

describe('formatPressure', () => {
  it('rounds to a whole number', () => {
    expect(formatPressure(1013.2)).toBe('1013');
  });

  it('rounds up at .5', () => {
    expect(formatPressure(1012.5)).toBe('1013');
  });

  it('returns a string for a whole number', () => {
    expect(formatPressure(1000)).toBe('1000');
  });
});
