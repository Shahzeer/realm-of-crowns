import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Trophy } from "lucide-react-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const glowAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1600, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handleForge = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/kingdom-select");
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <LinearGradient
      colors={["#050810", Colors.bg.primary, "#0d1520"]}
      style={[s.container, { paddingTop: topPad, paddingBottom: botPad }]}
    >
      <View style={s.starField} pointerEvents="none">
        {[...Array(22)].map((_, i) => (
          <View
            key={i}
            style={[
              s.star,
              {
                top: `${(i * 37 + 5) % 90}%` as any,
                left: `${(i * 53 + 8) % 95}%` as any,
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                opacity: 0.25 + (i % 4) * 0.12,
              },
            ]}
          />
        ))}
      </View>

      <View style={s.content}>
        <Animated.Text style={[s.crownEmoji, { opacity: glowAnim }]}>👑</Animated.Text>

        <Text style={s.welcome}>WELCOME TO</Text>
        <Text style={s.title}>REALM OF{"\n"}CROWNS</Text>

        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerIcon}>⚔</Text>
          <View style={s.dividerLine} />
        </View>

        <Text style={s.subtitle}>
          Build your dynasty. Conquer your rivals.{"\n"}Leave a legacy that echoes through ages.
        </Text>

        <TouchableOpacity style={s.forgeBtn} onPress={handleForge} activeOpacity={0.82}>
          <LinearGradient
            colors={[Colors.gold.bright, Colors.gold.primary, Colors.gold.dim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.forgeBtnInner}
          >
            <Text style={s.forgeBtnText}>⚒  FORGE YOUR KINGDOM</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.hofBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            router.push('/hall-of-fame' as any);
          }}
          activeOpacity={0.7}
        >
          <Trophy size={14} color={Colors.gold.dim} />
          <Text style={s.hofBtnText}>Dynasty Chronicles</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>A medieval grand strategy game</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  starField: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    borderRadius: 99,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  crownEmoji: {
    fontSize: 72,
    textAlign: "center",
    marginBottom: 20,
  },
  welcome: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gold.dim,
    letterSpacing: 6,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 46,
    fontWeight: "800",
    color: Colors.gold.bright,
    letterSpacing: 3,
    textAlign: "center",
    lineHeight: 52,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 18,
    width: "70%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.gold,
    opacity: 0.5,
  },
  dividerIcon: {
    fontSize: 14,
    color: Colors.gold.dim,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 52,
  },
  forgeBtn: {
    width: "85%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.gold.bright,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  forgeBtnInner: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  forgeBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.bg.primary,
    letterSpacing: 2,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.text.dim,
    letterSpacing: 3,
    paddingBottom: 16,
  },
  hofBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.gold,
    backgroundColor: Colors.gold.dim + '12',
  },
  hofBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.gold.dim,
    letterSpacing: 0.5,
  },
});
