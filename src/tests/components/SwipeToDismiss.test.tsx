import { render, screen } from '@testing-library/react';
import { SwipeToDismiss } from '@/components/SwipeToDismiss';

function chainable(): any {
  return new Proxy(
    {},
    {
      get: (_target: any, prop: string) => {
        if (prop === 'onUpdate' || prop === 'onEnd') return () => chainable();
        if (prop === 'activeOffsetY' || prop === 'failOffsetY') return () => chainable();
        return () => chainable();
      },
    },
  );
}

vi.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native-web');
  return {
    Gesture: { Pan: () => chainable() },
    GestureDetector: ({ children }: any) => React.createElement(View, null, children),
  };
});

describe('SwipeToDismiss', () => {
  const onDismiss = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders its children', () => {
    render(
      <SwipeToDismiss onDismiss={onDismiss}>
        <div data-testid="child">Hello</div>
      </SwipeToDismiss>,
    );

    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('forwards testID to the wrapper', () => {
    render(
      <SwipeToDismiss onDismiss={onDismiss} testID="swipe-dismiss">
        <div>Content</div>
      </SwipeToDismiss>,
    );

    expect(screen.getByTestId('swipe-dismiss')).toBeTruthy();
  });

  it('does not call onDismiss on mount', () => {
    render(
      <SwipeToDismiss onDismiss={onDismiss}>
        <div>Content</div>
      </SwipeToDismiss>,
    );

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
