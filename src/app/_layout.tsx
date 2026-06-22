import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A237E' }}>
      <OfflineIndicator />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
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
