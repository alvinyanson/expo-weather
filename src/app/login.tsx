import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

type Pending = 'google' | 'guest' | null;

export default function LoginScreen() {
  const { signInWithGoogle, signInAnonymously } = useAuth();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  // On success the auth listener flips the store and the root layout swaps to
  // the app routes — no manual navigation needed here.
  const handleGoogle = async () => {
    setError(null);
    setPending('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
      setPending(null);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setPending('guest');
    try {
      await signInAnonymously();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Guest sign-in failed');
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.hero}>
        <SymbolView
          name={{ ios: 'cloud.sun.fill', android: 'wb_sunny' }}
          size={96}
          tintColor={theme.colors.iconSun}
          type="monochrome"
        />
        <Text style={styles.title}>Expo Weather</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.actions}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.googleButtonWrapper}>
          <Pressable
            style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
            onPress={handleGoogle}
            disabled={busy}
            android_ripple={{ color: theme.colors.rippleDark }}
          >
            {pending === 'google' ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'g.circle.fill', android: 'account_circle' }}
                  size={22}
                  tintColor={theme.colors.primary}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.guestButtonWrapper}>
          <Pressable
            style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
            onPress={handleGuest}
            disabled={busy}
            android_ripple={{ color: theme.colors.surface }}
          >
            {pending === 'guest' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 120,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  actions: {
    gap: 14,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 6,
  },
  googleButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    height: 52,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  guestButtonWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  pressed: {
    opacity: 0.7,
  },
});
