import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "@/providers/GameProvider";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const realmQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg.primary }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ headerShown: false, animation: "none" }} />
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
  useEffect(() => { SplashScreen.hideAsync(); }, []);
  return (
    <QueryClientProvider client={realmQueryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
        <GameProvider>
          <StatusBar style="light" backgroundColor={Colors.bg.primary} />
          <RootLayoutNav />
        </GameProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
