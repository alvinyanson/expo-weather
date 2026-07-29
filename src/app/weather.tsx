import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { t } from '@/services/i18n';
import { validateDeepLinkParams } from '@/utils/deepLink';

export default function WeatherRouteHandler() {
  const params = useLocalSearchParams<{ lat?: string; lon?: string; city?: string }>();
  const validated = validateDeepLinkParams(params);

  useEffect(() => {
    if (!validated) {
      Toast.show({
        type: 'error',
        text1: t('invalidDeepLinkTitle'),
        text2: t('invalidDeepLinkBody'),
      });
    }
  }, [validated]);

  if (!validated) {
    return <Redirect href="/" />;
  }

  return (
    <Redirect
      href={{
        pathname: '/details',
        params: {
          lat: String(validated.latitude),
          lon: String(validated.longitude),
          city: validated.city,
        },
      }}
    />
  );
}
