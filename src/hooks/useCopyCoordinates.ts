import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { reportError } from '@/services/crash.service';
import { t } from '@/services/i18n';
import { formatCoordinates } from '@/utils/formatters';
import { useHaptics } from '@/hooks/useHaptics';

// Copies "lat, lon" to the clipboard with a success haptic + toast. Never rethrows.
export const useCopyCoordinates = () => {
  const haptics = useHaptics();

  const copy = async (lat: number, lon: number): Promise<void> => {
    const text = formatCoordinates(lat, lon);
    try {
      await Clipboard.setStringAsync(text);
      haptics.success();
      Toast.show({
        type: 'success',
        text1: t('coordinatesCopiedTitle'),
        text2: text,
      });
    } catch (e) {
      haptics.error();
      reportError(e, { where: 'useCopyCoordinates.copy' });
      Toast.show({
        type: 'error',
        text1: t('copyFailedTitle'),
        text2: t('copyFailedBody'),
      });
    }
  };

  return { copy };
};
