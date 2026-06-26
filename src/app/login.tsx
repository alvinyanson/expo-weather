import { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/hooks';

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.hero}>
        <SymbolView
          name={{ ios: 'cloud.sun.fill', android: 'wb_sunny' }}
          size={96}
          tintColor="white"
          type="monochrome"
        />
        <Text style={styles.title}>Expo Weather</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.actions}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
          onPress={handleGoogle}
          disabled={busy}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        >
          {pending === 'google' ? (
            <ActivityIndicator size="small" color="#1A237E" />
          ) : (
            <>
              <SymbolView
                name={{ ios: 'g.circle.fill', android: 'account_circle' }}
                size={22}
                tintColor="#1A237E"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
          onPress={handleGuest}
          disabled={busy}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.15)' }}
        >
          {pending === 'guest' ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E',
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
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  actions: {
    gap: 14,
  },
  errorText: {
    color: '#FFCDD2',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 6,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    height: 52,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
