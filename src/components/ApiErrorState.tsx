import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { theme } from '@/theme';
import { t } from '@/services/i18n';
import { getApiErrorDetails, MAX_QUERY_RETRIES } from '@/utils/apiError';

export interface ApiErrorStateProps {
  error: Error | unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  failureCount?: number;
  maxRetries?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const ApiErrorState: React.FC<ApiErrorStateProps> = ({
  error,
  onRetry,
  isRetrying = false,
  failureCount = 0,
  maxRetries = MAX_QUERY_RETRIES,
  containerStyle,
}) => {
  const details = getApiErrorDetails(error);
  // failureCount counts failures so far, so the attempt in flight is the next one.
  const attempt = Math.min(failureCount + 1, maxRetries);

  return (
    <View style={[styles.container, containerStyle]} testID="api-error-state">
      <SymbolView name={details.iconName} size={48} tintColor={theme.colors.white} />
      <Text style={styles.title}>{details.title}</Text>
      <Text style={styles.message}>{details.message}</Text>

      {isRetrying ? (
        <View style={styles.retryingContainer} testID="api-error-retrying">
          <ActivityIndicator size="small" color={theme.colors.white} style={styles.spinner} />
          <Text style={styles.retryingText}>{t('retryingText', { attempt, max: maxRetries })}</Text>
        </View>
      ) : (
        onRetry &&
        details.isRetryable && (
          <Pressable
            testID="api-error-retry-button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={onRetry}
            android_ripple={{ color: theme.colors.ripple }}
          >
            <Text style={styles.retryButtonText}>{t('retryText')}</Text>
          </Pressable>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  message: {
    color: theme.colors.textHint,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  retryingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
  },
  spinner: {
    marginRight: theme.spacing.sm,
  },
  retryingText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
});
