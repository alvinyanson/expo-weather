import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { t } from '@/services/i18n';
import { theme } from '@/theme';

export interface LocationPermissionCardProps {
  canAskAgain: boolean;
  onRetry: () => void;
}

const handleOpenSettings = () => {
  if (Linking.openSettings) {
    Linking.openSettings();
  }
};

export function LocationPermissionCard({ canAskAgain, onRetry }: LocationPermissionCardProps) {
  return (
    <View style={styles.card}>
      <SymbolView
        name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
        size={48}
        tintColor="white"
      />
      <Text style={styles.title}>{t('locationPermissionTitle')}</Text>
      <Text style={styles.description}>
        {canAskAgain ? t('locationPermissionRationale') : t('locationPermissionBlocked')}
      </Text>
      {canAskAgain ? (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onRetry}
          android_ripple={{ color: theme.colors.ripple }}
        >
          <Text style={styles.buttonText}>{t('grantPermissionBtn')}</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleOpenSettings}
          android_ripple={{ color: theme.colors.ripple }}
        >
          <Text style={styles.buttonText}>{t('openSettingsBtn')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
});
