import { WeatherResponse } from '@/interfaces';
import { weatherCodeToCondition, weatherCodeToSymbol } from '@/utils/weatherMapper';
import { formatDateFull, formatRound } from '@/utils/formatters';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

interface CurrentWeatherProps {
  city?: string;
  weather: WeatherResponse;
  tempUnit: string;
  onPress: () => void;
}

export const CurrentWeather = ({ city, weather, tempUnit, onPress }: CurrentWeatherProps) => {
  return (
    <>
      <View style={styles.locationHeader}>
        <Text style={styles.cityName}>{city}</Text>
        <Text style={styles.dateText}>Today, {formatDateFull()}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.heroContainer, pressed && styles.heroPressed]}
        onPress={onPress}
        android_ripple={{ color: theme.colors.ripple, borderless: false }}
      >
        <SymbolView
          name={weatherCodeToSymbol(weather.current.weather_code)}
          size={120}
          tintColor="white"
          type="monochrome"
          style={styles.heroIcon}
        />
        <Text style={styles.temperatureText}>
          {formatRound(weather.current.temperature_2m)}
          {tempUnit}
        </Text>
        <Text style={styles.conditionText}>
          {weatherCodeToCondition(weather.current.weather_code)}
        </Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  locationHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  cityName: {
    fontSize: 34,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginTop: 5,
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    marginVertical: 40,
    borderRadius: 24,
  },
  heroPressed: {
    opacity: 0.8,
  },
  heroIcon: {
    marginBottom: 20,
  },
  temperatureText: {
    fontSize: 80,
    fontWeight: '200',
    color: 'white',
  },
  conditionText: {
    fontSize: 24,
    fontWeight: '400',
    color: theme.colors.text,
    marginTop: 10,
  },
});
