import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import LoginScreen from '@/app/login';
import { useAuth } from '@/hooks/useAuth';
import { reportError, logBreadcrumb } from '@/services/crash.service';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/crash.service', () => ({
  reportError: vi.fn(),
  logBreadcrumb: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockReportError = vi.mocked(reportError);
const mockLogBreadcrumb = vi.mocked(logBreadcrumb);

describe('LoginScreen', () => {
  let mockSignInWithGoogle: ReturnType<typeof vi.fn>;
  let mockSignInAnonymously: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignInWithGoogle = vi.fn().mockResolvedValue(undefined);
    mockSignInAnonymously = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: null,
      initializing: false,
      isAuthenticated: false,
      signInWithGoogle: mockSignInWithGoogle as never,
      signInAnonymously: mockSignInAnonymously as never,
      signOut: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders title, subtitle, and action buttons', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Expo Weather')).toBeTruthy();
    expect(screen.getByText('Sign in to continue')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Continue as Guest')).toBeTruthy();
    expect(screen.queryByText('Google sign-in failed')).toBeNull();
    expect(screen.queryByText('Guest sign-in failed')).toBeNull();
  });

  it('triggers Google sign-in when Google button is clicked', async () => {
    render(<LoginScreen />);

    await act(async () => {
      fireEvent.click(screen.getByText('Continue with Google'));
    });

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('logs breadcrumb and displays error when Google sign-in is cancelled', async () => {
    const cancelError = new Error('User cancelled the operation');
    mockSignInWithGoogle.mockRejectedValueOnce(cancelError);

    render(<LoginScreen />);

    await act(async () => {
      fireEvent.click(screen.getByText('Continue with Google'));
    });

    expect(mockLogBreadcrumb).toHaveBeenCalledWith('[Auth] Google sign-in cancelled by user');
    expect(mockReportError).not.toHaveBeenCalled();
    expect(screen.getByText('Google sign-in failed')).toBeTruthy();
  });

  it('reports error and displays error message on generic Google sign-in failure', async () => {
    const error = new Error('Network error');
    mockSignInWithGoogle.mockRejectedValueOnce(error);

    render(<LoginScreen />);

    await act(async () => {
      fireEvent.click(screen.getByText('Continue with Google'));
    });

    expect(mockReportError).toHaveBeenCalledWith(error, { where: 'login.handleGoogle' });
    expect(mockLogBreadcrumb).not.toHaveBeenCalled();
    expect(screen.getByText('Google sign-in failed')).toBeTruthy();
  });

  it('triggers guest sign-in when Guest button is clicked', async () => {
    render(<LoginScreen />);

    await act(async () => {
      fireEvent.click(screen.getByText('Continue as Guest'));
    });

    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('reports error and displays error message on guest sign-in failure', async () => {
    const error = new Error('Guest sign-in error');
    mockSignInAnonymously.mockRejectedValueOnce(error);

    render(<LoginScreen />);

    await act(async () => {
      fireEvent.click(screen.getByText('Continue as Guest'));
    });

    expect(mockReportError).toHaveBeenCalledWith(error, { where: 'login.handleGuest' });
    expect(screen.getByText('Guest sign-in failed')).toBeTruthy();
  });
});
