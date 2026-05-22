import React, { useRef, useEffect } from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  ChevronRight,
  Map,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react-native";
import Colors from "@/constants/colors";

type Highlight = "crown" | "resources" | "map" | "command" | "turn";

type TutorialStep = {
  title: string;
  body: string;
  icon: React.ReactNode;
  highlight: Highlight;
};

const steps: TutorialStep[] = [
  {
    title: "Your Ruler",
    body: "Tap the crown in the top-left to manage traits, heirs, marriages, and legacy upgrades.",
    icon: <Sparkles size={22} color={Colors.gold.bright} />,
    highlight: "crown",
  },
  {
    title: "Resources",
    body: "Gold builds, food maintains loyalty, military powers armies, faith unlocks blessings.",
    icon: <Shield size={22} color={Colors.status.info} />,
    highlight: "resources",
  },
  {
    title: "Your Realm",
    body: "Tap any province on the map to build, recruit troops, or plan your next conquest.",
    icon: <Map size={22} color={Colors.food.light} />,
    highlight: "map",
  },
  {
    title: "Command Panel",
    body: "Access armies, diplomacy, espionage, council, faith, and events from the command grid below the map.",
    icon: <Swords size={22} color={Colors.crimson.bright} />,
    highlight: "command",
  },
  {
    title: "End Turn",
    body: "When your orders are ready, End Turn advances the season and resolves all actions.",
    icon: <ChevronRight size={22} color={Colors.gold.primary} />,
    highlight: "turn",
  },
];

const TOOLTIP_BG = "#1c1710";
const BORDER_COLOR = "#a07a4a";
const GLOW_COLOR = Colors.gold.bright;

type GlowRect = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width?: number;
  height: number;
};

function getGlow(h: Highlight, ti: number, sw: number, sh: number): GlowRect {
  switch (h) {
    case "crown":     return { top: ti + 6,        left: 8,  width: 210, height: 54 };
    case "resources": return { top: ti + 62,        left: 6,  right: 6,  height: 50 };
    case "map":       return { top: ti + 215,        left: 8,  right: 8,  height: 200 };
    case "command":   return { bottom: 90,           left: 8,  right: 8,  height: 180 };
    case "turn":      return { bottom: 6,            left: 8,  right: 8,  height: 72 };
  }
}

export default function TutorialOverlay({
  visible,
  onFinish,
}: {
  visible: boolean;
  onFinish: () => void;
  onScrollTo?: (y: number) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const { width: sw, height: sh } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const step = steps[index];
  const glow = getGlow(step.highlight, insets.top, sw, sh);

  useEffect(() => {
    if (visible) {
      setIndex(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    glowAnim.setValue(0.4);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [index]);

  const animateStep = () => {
    slideAnim.setValue(16);
    fadeAnim.setValue(0.4);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 260 }),
    ]).start();
  };

  const next = () => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (index >= steps.length - 1) {
      onFinish();
    } else {
      setIndex(index + 1);
      animateStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onFinish}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.dimFull, StyleSheet.absoluteFill]} />
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              top: glow.top,
              bottom: glow.bottom,
              left: glow.left,
              right: glow.right,
              width: glow.width,
              height: glow.height,
              opacity: glowAnim,
            },
          ]}
        />

        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={next}
        />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.iconRow}>
            <View style={styles.iconWrap}>{step.icon}</View>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
            <TouchableOpacity
              onPress={next}
              style={styles.nextBtn}
              testID="tutorial-next-btn"
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>
                {index === steps.length - 1 ? "Got it!" : "Next →"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onFinish}
            style={styles.skipBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="skip-tutorial-btn"
          >
            <Text style={styles.skipText}>Skip tutorial</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  dimFull: {
    backgroundColor: "transparent",
  },
  glow: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GLOW_COLOR,
    backgroundColor: GLOW_COLOR + "12",
    shadowColor: GLOW_COLOR,
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    backgroundColor: TOOLTIP_BG,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.border.gold,
  },
  title: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.gold.bright,
    textAlign: "center" as const,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.parchment.primary,
    textAlign: "center" as const,
    marginBottom: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  dots: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bg.tertiary,
  },
  dotActive: {
    backgroundColor: Colors.gold.primary,
    width: 18,
    borderRadius: 3,
  },
  nextBtn: {
    backgroundColor: Colors.gold.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextText: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: Colors.bg.primary,
    letterSpacing: 0.2,
  },
  skipBtn: {
    alignItems: "center" as const,
  },
  skipText: {
    fontSize: 12,
    color: Colors.text.dim,
    textDecorationLine: "underline" as const,
  },
});
