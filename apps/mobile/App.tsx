import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.primaryDark,
    secondaryContainer: colors.primaryLight,
    tertiary: colors.primary,
    tertiaryContainer: colors.primaryLight,
    surface: colors.background,
    surfaceVariant: colors.backgroundSecondary,
    background: colors.background,
    error: colors.error,
    errorContainer: colors.error,
    onPrimary: colors.text,
    onPrimaryContainer: colors.text,
    onSecondary: colors.text,
    onSecondaryContainer: colors.text,
    onTertiary: colors.text,
    onTertiaryContainer: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onBackground: colors.text,
    onError: colors.text,
    onErrorContainer: colors.text,
    outline: colors.border,
    outlineVariant: colors.borderLight,
    shadow: colors.shadow,
    scrim: colors.overlay,
    inverseSurface: colors.backgroundSecondary,
    inverseOnSurface: colors.text,
    inversePrimary: colors.primary,
    elevation: {
      level0: 'transparent',
      level1: colors.backgroundSecondary,
      level2: colors.backgroundSecondary,
      level3: colors.backgroundSecondary,
      level4: colors.backgroundSecondary,
      level5: colors.backgroundSecondary,
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
