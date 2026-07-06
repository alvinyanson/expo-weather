import { SymbolView } from 'expo-symbols';
import { ComponentProps } from 'react';
import { theme } from '@/theme';

export type SymbolName = ComponentProps<typeof SymbolView>['name'];

export const getIconTintColor = (code: number | undefined): string => {
  if (code === undefined) return 'white';

  switch (code) {
    case 0:
    case 1:
    case 2:
      return theme.colors.iconSun;
    default:
      return 'white';
  }
};

export const weatherCodeToSymbol = (code: number): SymbolName => {
  // WMO Weather interpretation codes (WW)
  switch (code) {
    case 0:
      return { ios: 'sun.max.fill', android: 'sunny' };
    case 1:
    case 2:
      return { ios: 'cloud.sun.fill', android: 'partly_cloudy_day' };
    case 3:
      return { ios: 'cloud.fill', android: 'cloud' };
    case 45:
    case 48:
      return { ios: 'cloud.fog.fill', android: 'foggy' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { ios: 'cloud.drizzle.fill', android: 'rainy' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return { ios: 'cloud.rain.fill', android: 'rainy' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { ios: 'cloud.snow.fill', android: 'ac_unit' };
    case 80:
    case 81:
    case 82:
      return { ios: 'cloud.heavyrain.fill', android: 'rainy' };
    case 95:
    case 96:
    case 99:
      return { ios: 'cloud.bolt.rain.fill', android: 'thunderstorm' };
    default:
      return { ios: 'cloud.fill', android: 'cloud' };
  }
};

export const weatherCodeToCondition = (code: number): string => {
  switch (code) {
    case 0:
      return 'Clear Sky';
    case 1:
    case 2:
    case 3:
      return 'Partly Cloudy';
    case 45:
    case 48:
      return 'Fog';
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return 'Drizzle';
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return 'Rain';
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return 'Snow';
    case 80:
    case 81:
    case 82:
      return 'Showers';
    case 95:
    case 96:
    case 99:
      return 'Thunderstorm';
    default:
      return 'Cloudy';
  }
};
