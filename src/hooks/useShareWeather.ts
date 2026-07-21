import { Share } from 'react-native';
import Toast from 'react-native-toast-message';
import type { WeatherResponse } from '@/interfaces';
import { reportError } from '@/services/crash.service';
import { t } from '@/services/i18n';
import { buildWeatherShareMessage } from '@/utils/shareWeather';
import { useHaptics } from '@/hooks/useHaptics';

interface ShareWeatherArgs {
  city: string;
  weather: WeatherResponse;
  tempUnit: string;
}

// Opens the share sheet with a localized weather summary. Never rethrows.
export const useShareWeather = () => {
  const haptics = useHaptics();

  const share = async (args: ShareWeatherArgs): Promise<void> => {
    try {
      const message = buildWeatherShareMessage(args);
      const result = await Share.share(
        { message, title: t('shareDialogTitle') },
        { dialogTitle: t('shareDialogTitle') },
      );

      if (result.action === Share.sharedAction) {
        haptics.success();
      }
      // dismissedAction is a silent no-op.
    } catch (e) {
      reportError(e, { where: 'useShareWeather.share' });
      Toast.show({
        type: 'error',
        text1: t('shareFailedTitle'),
        text2: t('shareFailedBody'),
      });
    }
  };

  return { share };
};
