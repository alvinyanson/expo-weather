import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
