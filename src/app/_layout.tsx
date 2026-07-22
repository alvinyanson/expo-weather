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
import { useNotificationListeners } from '@/hooks/useNotificationListeners';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { BatterySaverIndicator } from '@/components/BatterySaverIndicator';
import { theme } from '@/theme';
import * as SplashScreen from 'expo-splash-screen';
import { ObserveRoot, useObserve } from 'expo-observe';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/CustomToast';
import { t } from '@/services/i18n';
import crashlytics from '@react-native-firebase/crashlytics';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useBatteryMonitor } from '@/hooks/useBatteryMonitor';

const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  if (defaultErrorHandler) {
    defaultErrorHandler(error, isFatal);
  }
});

SplashScreen.preventAutoHideAsync();

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
  useNotificationListeners();
  useBatteryMonitor();
  const { isAuthenticated, initializing } = useAuth();
  const { markInteractive } = useObserve();
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    if (!initializing) {
      SplashScreen.hideAsync();
      markInteractive();
    }
  }, [initializing, markInteractive]);

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
    <SafeAreaView key={language} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <OfflineIndicator />
      <BatterySaverIndicator />
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
          <Stack.Screen name="map" />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      <Toast position="bottom" config={toastConfig} />
    </SafeAreaView>
  );
}

function RootLayout() {
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

export default ObserveRoot.wrap(RootLayout);

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    crashlytics().recordError(error);
  }, [error]);

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
        {t('errorBoundaryTitle')}
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
        {t('errorBoundarySubtitle')}
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
        {t('errorBoundaryMessage')}
      </Text>
      <Button title={t('retryText')} onPress={retry} color={theme.colors.secondary} />
    </SafeAreaView>
  );
}
