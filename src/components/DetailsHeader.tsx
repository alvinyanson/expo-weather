import { weatherCodeToCondition } from '@/utils/weatherMapper';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeatherResponse } from '@/interfaces';

interface DetailsHeaderProps {
  city: string;
  weather: WeatherResponse;
  lastUpdated: string;
  onBack: () => void;
}

export const DetailsHeader = ({ city, weather, lastUpdated, onBack }: DetailsHeaderProps) => {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true, radius: 24 }}
      >
        <SymbolView
          name={{ ios: 'chevron.left', android: 'chevron_left' }}
          size={24}
          tintColor="white"
        />
      </Pressable>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerCity}>{city}</Text>
        <Text style={styles.headerCondition}>
          {weatherCodeToCondition(weather.current.weather_code)}
        </Text>
        {lastUpdated ? <Text style={styles.lastUpdatedText}>Updated {lastUpdated}</Text> : null}
      </View>
      <View style={{ width: 48 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 60,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerCity: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  headerCondition: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
});
