import { vi } from 'vitest';
import React from 'react';

vi.mock('react-native-toast-message', () => ({
  default: {
    show: vi.fn(),
    hide: vi.fn(),
  },
}));

vi.mock('@expo/ui/community/bottom-sheet', () => {
  const MockBottomSheet = React.forwardRef(({ children }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      expand: vi.fn(),
      collapse: vi.fn(),
      close: vi.fn(),
    }));
    return React.createElement('div', { 'data-testid': 'mock-bottom-sheet' }, children);
  });
  MockBottomSheet.displayName = 'MockBottomSheet';

  const MockBottomSheetView = ({ children }: any) => {
    return React.createElement('div', { 'data-testid': 'mock-bottom-sheet-view' }, children);
  };
  MockBottomSheetView.displayName = 'MockBottomSheetView';

  return {
    default: MockBottomSheet,
    BottomSheetView: MockBottomSheetView,
  };
});
