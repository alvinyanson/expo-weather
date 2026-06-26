export const theme = {
  colors: {
    // Solid colors
    primary: '#1A237E', // Main navy blue
    secondary: '#5C6BC0', // Accents and buttons
    accent: '#81D4FA', // Light blue highlights
    error: '#FFCDD2', // Light pink for error messages on dark backgrounds
    danger: '#E53935', // Red for offline indicator
    background: '#1A237E', // App background
    text: '#FFFFFF', // Default white text
    textDark: '#1A237E', // Dark text for buttons/inputs

    // Translucent surfaces (Cards, Overlays)
    surface: 'rgba(255, 255, 255, 0.15)', // Default card background
    surfaceHighlight: 'rgba(255, 255, 255, 0.25)', // Active/hover cards
    surfaceSubtle: 'rgba(255, 255, 255, 0.05)', // Very faint backgrounds
    overlay: 'rgba(25, 35, 126, 0.95)', // Modal/search overlay

    // Translucent borders
    border: 'rgba(255, 255, 255, 0.2)', // Default border
    borderLight: 'rgba(255, 255, 255, 0.1)', // Faint border (dividers)
    borderError: 'rgba(255, 205, 210, 0.5)',

    // Touch feedback
    ripple: 'rgba(255, 255, 255, 0.2)',
    rippleDark: 'rgba(0, 0, 0, 0.1)',

    // Translucent text
    textMuted: 'rgba(255, 255, 255, 0.7)', // Secondary text
    textHint: 'rgba(255, 255, 255, 0.5)', // Placeholders and tertiary text
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
      hero: 72,
    },
  },
};
