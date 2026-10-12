import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, initializing } = useAuth();

  // Oturum durumu belli olana kadar splash ekranı açık kalır.
  if (initializing) return null;

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="location-detail" />
          <Stack.Screen name="user/[id]" />
        </Stack.Protected>

        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
