import { SymbolView } from 'expo-symbols';
import { ComponentProps } from 'react';

export type SymbolName = ComponentProps<typeof SymbolView>['name'];

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  icon: SymbolName;
  forecast: ForecastDay[];
}

export interface ForecastDay {
  day: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: SymbolName;
}

export const MOCK_WEATHER: WeatherData = {
  city: 'Cebu City',
  temperature: 24,
  condition: 'Partly Cloudy',
  icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day' },
  forecast: [
    {
      day: 'Monday',
      maxTemp: 26,
      minTemp: 18,
      condition: 'Sunny',
      icon: { ios: 'sun.max.fill', android: 'sunny' },
    },
    {
      day: 'Tuesday',
      maxTemp: 24,
      minTemp: 17,
      condition: 'Partly Cloudy',
      icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day' },
    },
    {
      day: 'Wednesday',
      maxTemp: 22,
      minTemp: 16,
      condition: 'Cloudy',
      icon: { ios: 'cloud.fill', android: 'cloud' },
    },
    {
      day: 'Thursday',
      maxTemp: 20,
      minTemp: 15,
      condition: 'Rain',
      icon: { ios: 'cloud.rain.fill', android: 'rainy' },
    },
    {
      day: 'Friday',
      maxTemp: 23,
      minTemp: 16,
      condition: 'Partly Cloudy',
      icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day' },
    },
    {
      day: 'Saturday',
      maxTemp: 25,
      minTemp: 18,
      condition: 'Sunny',
      icon: { ios: 'sun.max.fill', android: 'sunny' },
    },
    {
      day: 'Sunday',
      maxTemp: 27,
      minTemp: 19,
      condition: 'Clear',
      icon: { ios: 'sun.max.fill', android: 'sunny' },
    },
    {
      day: 'Monday',
      maxTemp: 26,
      minTemp: 18,
      condition: 'Sunny',
      icon: { ios: 'sun.max.fill', android: 'sunny' },
    },
  ],
};
