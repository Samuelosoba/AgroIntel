import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { AuthProvider, useAuth } from "@/lib/auth";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";
import { colors } from "@/theme";

// Keep the native splash up until our animated one is on screen.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <Root />
          </AuthProvider>
        </OnboardingProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { user, loading } = useAuth();
  const { done: onboarded } = useOnboarding();
  const [splashGone, setSplashGone] = useState(false);
  const ready = !loading && onboarded !== null;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  const hideSplash = useCallback(() => setSplashGone(true), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {ready && (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.earth50 },
            animation: "slide_from_right",
          }}
        >
          <Stack.Protected guard={!onboarded && !user}>
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          </Stack.Protected>
          <Stack.Protected guard={!!onboarded && !user}>
            <Stack.Screen name="login" options={{ animation: "fade" }} />
          </Stack.Protected>
          <Stack.Protected guard={!!user}>
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen name="scan/[id]" />
            <Stack.Screen name="weather" />
            <Stack.Screen name="alerts" />
            <Stack.Screen name="insights" />
            <Stack.Screen name="profile" />
          </Stack.Protected>
        </Stack>
      )}
      {!splashGone && <AnimatedSplash ready={ready} onDone={hideSplash} />}
    </View>
  );
}
