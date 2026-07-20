import { cleanup, render, screen } from '@testing-library/react';
import { CustomToast, toastConfig } from '@/components/CustomToast';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CustomToast', () => {
  it('renders success toast title and subtitle', () => {
    render(<CustomToast text1="Success Title" text2="Success Subtitle" type="success" />);

    expect(screen.getByText('Success Title')).toBeTruthy();
    expect(screen.getByText('Success Subtitle')).toBeTruthy();
  });

  it('renders error toast title and subtitle', () => {
    render(<CustomToast text1="Error Title" text2="Error Subtitle" type="error" />);

    expect(screen.getByText('Error Title')).toBeTruthy();
    expect(screen.getByText('Error Subtitle')).toBeTruthy();
  });

  it('renders info toast title and subtitle', () => {
    render(<CustomToast text1="Info Title" text2="Info Subtitle" type="info" />);

    expect(screen.getByText('Info Title')).toBeTruthy();
    expect(screen.getByText('Info Subtitle')).toBeTruthy();
  });

  it('renders toasts via toastConfig helper functions', () => {
    const { rerender } = render(toastConfig.success({ text1: 'Config Success', text2: 'Body 1' }));
    expect(screen.getByText('Config Success')).toBeTruthy();
    expect(screen.getByText('Body 1')).toBeTruthy();

    rerender(toastConfig.error({ text1: 'Config Error', text2: 'Body 2' }));
    expect(screen.getByText('Config Error')).toBeTruthy();
    expect(screen.getByText('Body 2')).toBeTruthy();

    rerender(toastConfig.info({ text1: 'Config Info', text2: 'Body 3' }));
    expect(screen.getByText('Config Info')).toBeTruthy();
    expect(screen.getByText('Body 3')).toBeTruthy();
  });
});
