'use worklet';

/** Returns true when the drag should commit a dismiss. */
export function shouldDismiss(
  translationY: number,
  velocityY: number,
  dismissDistance: number,
  velocityThreshold: number,
): boolean {
  'worklet';
  return translationY >= dismissDistance || velocityY >= velocityThreshold;
}
