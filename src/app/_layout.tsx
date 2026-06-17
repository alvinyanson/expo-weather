import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A237E' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
