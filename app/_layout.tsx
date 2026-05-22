import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { GameProvider } from "@/providers/GameProvider";
import Colors from "@/constants/colors";

void SplashScreen.preventAutoHideAsync();

const realmQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } },
});

class GameErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[GameErrorBoundary] Caught error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.icon}>⚠️</Text>
          <Text style={errStyles.title}>Something went wrong</Text>
          <Text style={errStyles.message}>{this.state.error?.message ?? 'Unknown error'}</Text>
          <TouchableOpacity
            style={errStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800' as const, color: Colors.gold.bright, marginBottom: 8 },
  message: { fontSize: 13, color: Colors.text.secondary, textAlign: 'center' as const, marginBottom: 24, lineHeight: 20 },
  button: { backgroundColor: Colors.gold.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  buttonText: { fontSize: 15, fontWeight: '700' as const, color: Colors.bg.primary },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg.primary }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ headerShown: false, animation: "none" }} />

      <Stack.Screen name="welcome" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="kingdom-select" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="province/[id]" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="armies" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="diplomacy" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="events" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="ruler" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="technology" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="council" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="battles" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="trade" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="espionage" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="chronicle" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="achievements" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="faith" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="rankings" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="pressures" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
      <Stack.Screen name="reign-summary" options={{ presentation: "modal", animation: "slide_from_bottom", headerShown: false }} />
    </Stack>
  );
}



export default function RootLayout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return (
    <QueryClientProvider client={realmQueryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
        <GameErrorBoundary>
          <GameProvider>
            <StatusBar style="light" backgroundColor={Colors.bg.primary} />
            <RootLayoutNav />
          </GameProvider>
        </GameErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
