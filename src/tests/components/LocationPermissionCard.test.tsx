import { fireEvent, render, screen } from '@testing-library/react';
import { Linking } from 'react-native';
import { LocationPermissionCard } from '@/components/LocationPermissionCard';
import { t } from '@/services/i18n';

vi.mock('expo-symbols', () => ({ SymbolView: () => null }));

describe('LocationPermissionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rationale UI and calls onRetry when canAskAgain is true', () => {
    const onRetryMock = vi.fn();
    render(<LocationPermissionCard canAskAgain={true} onRetry={onRetryMock} />);

    expect(screen.getByText(t('locationPermissionTitle'))).toBeTruthy();
    expect(screen.getByText(t('locationPermissionRationale'))).toBeTruthy();
    expect(screen.getByText(t('grantPermissionBtn'))).toBeTruthy();

    fireEvent.click(screen.getByText(t('grantPermissionBtn')));
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('renders blocked UI and calls Linking.openSettings when canAskAgain is false', () => {
    if (!Linking.openSettings) {
      Linking.openSettings = vi.fn();
    }
    const openSettingsSpy = vi
      .spyOn(Linking, 'openSettings')
      .mockImplementation(() => Promise.resolve());
    const onRetryMock = vi.fn();
    render(<LocationPermissionCard canAskAgain={false} onRetry={onRetryMock} />);

    expect(screen.getByText(t('locationPermissionTitle'))).toBeTruthy();
    expect(screen.getByText(t('locationPermissionBlocked'))).toBeTruthy();
    expect(screen.getByText(t('openSettingsBtn'))).toBeTruthy();

    fireEvent.click(screen.getByText(t('openSettingsBtn')));
    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    expect(onRetryMock).not.toHaveBeenCalled();
  });
});
