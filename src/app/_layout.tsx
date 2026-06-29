import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundaryProps, Stack } from 'expo-router';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { useAuthListener } from '@/hooks/useAuthListener';
import { useAuth } from '@/hooks/useAuth';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { theme } from '@/theme';

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
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
          <Stack.Screen name="saved" />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <SafeAreaProvider>
          <RootApp />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}
      >
        We ran into a problem.
      </Text>
      <Text
        style={{
          color: theme.colors.text,
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
          color: theme.colors.error,
          fontSize: 14,
          textAlign: 'center',
          paddingHorizontal: 20,
          marginBottom: 30,
        }}
      >
        {error.message}
      </Text>
      <Button title="Try Again" onPress={retry} color={theme.colors.secondary} />
    </SafeAreaView>
  );
}
