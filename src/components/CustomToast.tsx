import { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { theme } from '@/theme';

export const CustomToast = ({
  text1,
  text2,
  type,
}: {
  text1?: string;
  text2?: string;
  type: 'success' | 'error' | 'info';
}) => {
  let iconName: ComponentProps<typeof SymbolView>['name'];
  let iconColor: string;

  if (type === 'success') {
    iconName = { ios: 'checkmark.circle.fill', android: 'check_circle' };
    iconColor = theme.colors.success;
  } else if (type === 'error') {
    iconName = { ios: 'exclamationmark.triangle.fill', android: 'warning' };
    iconColor = theme.colors.error;
  } else {
    iconName = { ios: 'info.circle.fill', android: 'info' };
    iconColor = theme.colors.background; // Reusing the closest color (background sky blue)
  }

  return (
    <View style={toastStyles.toastContainer}>
      <SymbolView name={iconName} size={24} tintColor={iconColor} />
      <View style={toastStyles.toastTextContainer}>
        {text1 && <Text style={toastStyles.toastTitle}>{text1}</Text>}
        {text2 && <Text style={toastStyles.toastSubtitle}>{text2}</Text>}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: (props: any) => <CustomToast text1={props.text1} text2={props.text2} type="success" />,
  error: (props: any) => <CustomToast text1={props.text1} text2={props.text2} type="error" />,
  info: (props: any) => <CustomToast text1={props.text1} text2={props.text2} type="info" />,
};

const toastStyles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: theme.spacing.xl,
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm + 4,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
  toastSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    marginTop: 2,
  },
});
