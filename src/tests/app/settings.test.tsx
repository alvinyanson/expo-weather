import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SettingsScreen from '@/app/settings';
import { useAuth, useToggleNotifications } from '@/hooks';

const {
  backMock,
  mockSetTemperatureUnit,
  mockSetWindSpeedUnit,
  mockSetLanguage,
  mockSetHapticsEnabled,
  mockSelection,
  mockUseSettingsStoreState,
} = vi.hoisted(() => ({
  backMock: vi.fn(),
  mockSetTemperatureUnit: vi.fn(),
  mockSetWindSpeedUnit: vi.fn(),
  mockSetLanguage: vi.fn(),
  mockSetHapticsEnabled: vi.fn(),
  mockSelection: vi.fn(),
  mockUseSettingsStoreState: {
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    language: 'system',
    hapticsEnabled: true,
  },
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: backMock }),
}));

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useToggleNotifications: vi.fn(),
  useHaptics: () => ({
    selection: mockSelection,
    success: vi.fn(),
    error: vi.fn(),
    impact: vi.fn(),
  }),
}));

vi.mock('@/store/useSettingsStore', () => {
  const store = Object.assign(
    vi.fn(() => ({
      temperatureUnit: mockUseSettingsStoreState.temperatureUnit,
      windSpeedUnit: mockUseSettingsStoreState.windSpeedUnit,
      language: mockUseSettingsStoreState.language,
      hapticsEnabled: mockUseSettingsStoreState.hapticsEnabled,
      setTemperatureUnit: mockSetTemperatureUnit,
      setWindSpeedUnit: mockSetWindSpeedUnit,
      setLanguage: mockSetLanguage,
      setHapticsEnabled: mockSetHapticsEnabled,
    })),
    {
      getState: vi.fn(() => ({ language: 'system' })),
      subscribe: vi.fn(),
    },
  );
  return { useSettingsStore: store };
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseToggleNotifications = vi.mocked(useToggleNotifications);

describe('SettingsScreen', () => {
  let mockHandleToggleNotifications: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseSettingsStoreState.temperatureUnit = 'celsius';
    mockUseSettingsStoreState.windSpeedUnit = 'kmh';
    mockUseSettingsStoreState.language = 'system';
    mockUseSettingsStoreState.hapticsEnabled = true;

    mockHandleToggleNotifications = vi.fn();
    mockSignOut = vi.fn();

    mockUseToggleNotifications.mockReturnValue({
      notificationsEnabled: false,
      isUpdatingNotifications: false,
      handleToggleNotifications: mockHandleToggleNotifications,
    } as never);

    mockUseAuth.mockReturnValue({
      user: { isAnonymous: true, uid: 'guest-123' },
      signOut: mockSignOut,
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders header and navigates back on back button press', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('settings-title')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();

    fireEvent.click(screen.getByTestId('settings-back-button'));
    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it('renders temperature unit options and handles unit changes', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Temperature Unit')).toBeTruthy();
    expect(screen.getByText('Celsius (°C)')).toBeTruthy();

    fireEvent.click(screen.getByTestId('temp-toggle-fahrenheit'));
    expect(mockSetTemperatureUnit).toHaveBeenCalledWith('fahrenheit');

    fireEvent.click(screen.getByTestId('temp-toggle-celsius'));
    expect(mockSetTemperatureUnit).toHaveBeenCalledWith('celsius');
  });

  it('renders wind speed unit options and handles unit changes', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Wind Speed Unit')).toBeTruthy();
    expect(screen.getByText('Kilometers per hour')).toBeTruthy();

    fireEvent.click(screen.getByTestId('wind-toggle-mph'));
    expect(mockSetWindSpeedUnit).toHaveBeenCalledWith('mph');

    fireEvent.click(screen.getByTestId('wind-toggle-kmh'));
    expect(mockSetWindSpeedUnit).toHaveBeenCalledWith('kmh');
  });

  it('renders language options and handles language changes', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('App Language')).toBeTruthy();
    expect(screen.getByText('System Default')).toBeTruthy();

    fireEvent.click(screen.getByTestId('language-toggle-en'));
    expect(mockSetLanguage).toHaveBeenCalledWith('en');

    fireEvent.click(screen.getByTestId('language-toggle-ja'));
    expect(mockSetLanguage).toHaveBeenCalledWith('ja');

    fireEvent.click(screen.getByTestId('language-toggle-system'));
    expect(mockSetLanguage).toHaveBeenCalledWith('system');
  });

  it('handles weather alert notification toggling', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Weather Alerts')).toBeTruthy();

    const alertsSwitchWrapper = screen.getByTestId('weather-alerts-switch');
    const alertsSwitchInput = alertsSwitchWrapper.querySelector('input')!;
    expect(alertsSwitchInput).toBeTruthy();

    fireEvent.click(alertsSwitchInput);
    expect(mockHandleToggleNotifications).toHaveBeenCalledWith(true);
  });

  it('renders haptics row and toggling updates the store', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Haptic Feedback')).toBeTruthy();

    const hapticsSwitchWrapper = screen.getByTestId('haptics-switch');
    const hapticsSwitchInput = hapticsSwitchWrapper.querySelector('input')!;
    expect(hapticsSwitchInput).toBeTruthy();

    fireEvent.click(hapticsSwitchInput);
    expect(mockSetHapticsEnabled).toHaveBeenCalledWith(false);
    expect(mockSelection).toHaveBeenCalled();
  });

  it('fires a selection haptic on unit changes', () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByTestId('temp-toggle-fahrenheit'));
    expect(mockSelection).toHaveBeenCalled();
  });

  it('displays loading state when updating notifications', () => {
    mockUseToggleNotifications.mockReturnValue({
      notificationsEnabled: false,
      isUpdatingNotifications: true,
      handleToggleNotifications: mockHandleToggleNotifications,
    } as never);

    render(<SettingsScreen />);

    expect(screen.queryByTestId('weather-alerts-switch')).toBeNull();
  });

  it('renders guest account information and handles sign out', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByTestId('account-value').textContent).toBe('Guest');

    fireEvent.click(screen.getByTestId('sign-out-button'));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders authenticated user email when signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { isAnonymous: false, email: 'test@example.com', uid: 'user-123' },
      signOut: mockSignOut,
    } as never);

    render(<SettingsScreen />);

    expect(screen.getByTestId('account-value').textContent).toBe('test@example.com');
  });
});
