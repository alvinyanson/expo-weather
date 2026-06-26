import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundaryProps, Stack } from 'expo-router';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { useAuthListener } from '@/hooks/useAuthListener';
import { useAuth } from '@/hooks/useAuth';
import { OfflineIndicator } from '@/components/OfflineIndicator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

function RootApp() {
  useNetworkMonitor();
  useAuthListener();
  const { isAuthenticated, initializing } = useAuth();

  // Hold on a loader until Firebase reports the initial auth state, otherwise
  // the login screen would flash before a persisted session is restored.
  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A237E', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A237E' }}>
      <OfflineIndicator />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {/* Authenticated app routes. When the user signs out, these are removed
            and expo-router redirects to the only remaining screen (login). */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="index" />
          <Stack.Screen name="details" />
          <Stack.Screen name="settings" />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <SafeAreaProvider>
        <RootApp />
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#1A237E',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        We ran into a problem.
      </Text>
      <Text
        style={{
          color: 'white',
          fontSize: 16,
          textAlign: 'center',
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        We're sorry, but the application encountered an unexpected error.
      </Text>
      <Text
        style={{
          color: '#FFCDD2',
          fontSize: 14,
          textAlign: 'center',
          paddingHorizontal: 20,
          marginBottom: 30,
        }}
      >
        {error.message}
      </Text>
      <Button title="Try Again" onPress={retry} color="#5C6BC0" />
    </SafeAreaView>
  );
}
