import { describe, expect, it } from 'vitest';
import { shouldDismiss } from '@/utils/dismissGesture';

describe('shouldDismiss', () => {
  const dismissDistance = 200;
  const velocityThreshold = 800;

  it('returns false when both translation and velocity are below thresholds', () => {
    expect(shouldDismiss(100, 400, dismissDistance, velocityThreshold)).toBe(false);
  });

  it('returns true when translation meets the dismiss distance', () => {
    expect(shouldDismiss(200, 0, dismissDistance, velocityThreshold)).toBe(true);
  });

  it('returns true when translation exceeds the dismiss distance', () => {
    expect(shouldDismiss(300, 0, dismissDistance, velocityThreshold)).toBe(true);
  });

  it('returns true when velocity meets the velocity threshold', () => {
    expect(shouldDismiss(50, 800, dismissDistance, velocityThreshold)).toBe(true);
  });

  it('returns true when velocity exceeds the velocity threshold', () => {
    expect(shouldDismiss(10, 1200, dismissDistance, velocityThreshold)).toBe(true);
  });

  it('returns true when both thresholds are met', () => {
    expect(shouldDismiss(250, 900, dismissDistance, velocityThreshold)).toBe(true);
  });

  it('returns false when translation is just below the dismiss distance', () => {
    expect(shouldDismiss(199.9, 0, dismissDistance, velocityThreshold)).toBe(false);
  });

  it('returns false when velocity is just below the velocity threshold', () => {
    expect(shouldDismiss(0, 799.9, dismissDistance, velocityThreshold)).toBe(false);
  });

  it('returns false for zero translation and zero velocity', () => {
    expect(shouldDismiss(0, 0, dismissDistance, velocityThreshold)).toBe(false);
  });

  it('returns false for negative translation and negative velocity', () => {
    expect(shouldDismiss(-100, -500, dismissDistance, velocityThreshold)).toBe(false);
  });

  it('handles exact boundary: translation equals dismiss distance', () => {
    expect(shouldDismiss(dismissDistance, 0, dismissDistance, velocityThreshold)).toBe(true);
  });

  it('handles exact boundary: velocity equals velocity threshold', () => {
    expect(shouldDismiss(0, velocityThreshold, dismissDistance, velocityThreshold)).toBe(true);
  });
});
