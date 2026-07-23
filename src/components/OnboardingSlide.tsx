import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SymbolName } from '@/utils/weatherMapper';
import { theme } from '@/theme';

export interface OnboardingSlideProps {
  icon: SymbolName;
  title: string;
  description: string;
  width: number;
  testID?: string;
}

export function OnboardingSlide({ icon, title, description, width, testID }: OnboardingSlideProps) {
  return (
    <View style={[styles.container, { width }]} testID={testID}>
      <SymbolView name={icon} size={96} tintColor={theme.colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
