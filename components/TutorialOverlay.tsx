import React, { useRef, useEffect } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  ChevronRight,
  Map,
  Shield,
  Sparkles,
  Swords,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";

type Highlight = "crown" | "resources" | "map" | "command" | "turn";

type TutorialStep = {
  title: string;
  body: string;
  icon: React.ReactNode;
  highlight: Highlight;
  scrollY?: number;
};

const TOOLTIP_W = 272;
const TOOLTIP_EST_H = 138;
const BEAK_HALF = 9;
const BEAK_H = 11;
const TOOLTIP_BG = "#1c1710";
const BORDER_COLOR = "#a07a4a";

const steps: TutorialStep[] = [
  {
    title: "Your Ruler",
    body: "Tap the crown to manage traits, heirs, marriages, and legacy upgrades.",
    icon: <Sparkles size={18} color={Colors.gold.bright} />,
    highlight: "crown",
    scrollY: 0,
  },
  {
    title: "Resources",
    body: "Gold builds, food maintains loyalty, military powers armies, faith unlocks blessings.",
    icon: <Shield size={18} color={Colors.status.info} />,
    highlight: "resources",
    scrollY: 0,
  },
  {
    title: "Your Realm",
    body: "Tap any province on the map to build, recruit troops, or plan your next conquest.",
    icon: <Map size={18} color={Colors.food.light} />,
    highlight: "map",
    scrollY: 320,
  },
  {
    title: "Command Panel",
    body: "Access armies, diplomacy, espionage, council, faith, and events from here.",
    icon: <Swords size={18} color={Colors.crimson.bright} />,
    highlight: "command",
    scrollY: 720,
  },
  {
    title: "End Turn",
    body: "When your orders are ready, End Turn advances the season and resolves all actions.",
    icon: <ChevronRight size={18} color={Colors.gold.primary} />,
    highlight: "turn",
    scrollY: 0,
  },
];

function getAnchor(h: Highlight, sw: number, sh: number): { x: number; y: number } {
  switch (h) {
    case "crown":     return { x: sw * 0.28, y: 87 };
    case "resources": return { x: sw / 2,    y: 142 };
    case "map":       return { x: sw / 2,    y: Math.min(370, sh * 0.44) };
    case "command":   return { x: sw / 2,    y: sh * 0.73 };
    case "turn":      return { x: sw / 2,    y: sh - 48 };
  }
}

type GlowRect = { top?: number; bottom?: number; left: number; right?: number; width?: number; height: number };

function getGlow(h: Highlight, sw: number, sh: number): GlowRect {
  switch (h) {
    case "crown":     return { top: 58,        left: 14,  width: 210,      height: 58  };
    case "resources": return { top: 108,        left: 8,   right: 8,        height: 54  };
    case "map":       return { top: 228,        left: 14,  right: 14,       height: 222 };
    case "command":   return { bottom: 88,      left: 14,  right: 14,       height: 172 };
    case "turn":      return { bottom: 12,      left: 14,  right: 14,       height: 66  };
  }
}

export default function TutorialOverlay({
  visible,
  onFinish,
  onScrollTo,
}: {
  visible: boolean;
  onFinish: () => void;
  onScrollTo?: (y: number) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;
  const { width: sw, height: sh } = useWindowDimensions();

  const step = steps[index];
  const anchor = getAnchor(step.highlight, sw, sh);
  const glow = getGlow(step.highlight, sw, sh);
  const isBottomHalf = anchor.y > sh / 2;

  const rawLeft = anchor.x - TOOLTIP_W / 2;
  const tooltipLeft = Math.max(12, Math.min(sw - TOOLTIP_W - 12, rawLeft));
  const beakLeft = Math.max(
    BEAK_HALF + 6,
    Math.min(TOOLTIP_W - BEAK_HALF - 6, anchor.x - tooltipLeft - BEAK_HALF)
  );

  let tooltipTop: number;
  if (isBottomHalf) {
    tooltipTop = anchor.y - TOOLTIP_EST_H - BEAK_H - 18;
  } else {
    tooltipTop = anchor.y + BEAK_H + 18;
  }
  tooltipTop = Math.max(12, Math.min(sh - TOOLTIP_EST_H - 12, tooltipTop));

  useEffect(() => {
    if (visible) {
      setIndex(0);
      if (steps[0].scrollY !== undefined && onScrollTo) {
        onScrollTo(steps[0].scrollY);
      }
      fadeAnim.setValue(0);
      slideAnim.setValue(6);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
      ]).start();
    }
  }, [visible]);

  const animateStep = () => {
    slideAnim.setValue(6);
    fadeAnim.setValue(0.5);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 260 }),
    ]).start();
  };

  const tap = () => { if (Platform.OS !== "web") void Haptics.selectionAsync(); };

  const next = () => {
    tap();
    if (index >= steps.length - 1) {
      onFinish();
    } else {
      const nextIdx = index + 1;
      const nextStep = steps[nextIdx];
      if (nextStep.scrollY !== undefined && onScrollTo) {
        onScrollTo(nextStep.scrollY);
      }
      setIndex(nextIdx);
      animateStep();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.scrim} pointerEvents="none" />

      <View
        style={[
          styles.glow,
          {
            top: glow.top,
            bottom: glow.bottom,
            left: glow.left,
            right: glow.right,
            width: glow.width,
            height: glow.height,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.tooltip,
          {
            top: tooltipTop,
            left: tooltipLeft,
            width: TOOLTIP_W,
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 6],
                  outputRange: [0, isBottomHalf ? 5 : -5],
                }),
              },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        {!isBottomHalf && (
          <>
            <View style={[styles.beakUpBorder, { left: beakLeft - 1 }]} pointerEvents="none" />
            <View style={[styles.beakUpFill,   { left: beakLeft     }]} pointerEvents="none" />
          </>
        )}

        <View style={styles.bubble}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>{step.icon}</View>
            <Text style={styles.title} numberOfLines={1}>{step.title}</Text>
            <TouchableOpacity
              onPress={onFinish}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="skip-tutorial-btn"
            >
              <X size={13} color={Colors.text.dim} />
            </TouchableOpacity>
          </View>

          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
            <TouchableOpacity onPress={next} style={styles.nextBtn} testID="tutorial-next-btn">
              <Text style={styles.nextText}>
                {index === steps.length - 1 ? "Got it!" : "Next →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isBottomHalf && (
          <>
            <View style={[styles.beakDownBorder, { left: beakLeft - 1 }]} pointerEvents="none" />
            <View style={[styles.beakDownFill,   { left: beakLeft     }]} pointerEvents="none" />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  glow: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gold.dim + "90",
    backgroundColor: Colors.gold.bright + "0a",
    shadowColor: Colors.gold.bright,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  tooltip: {
    position: "absolute",
    zIndex: 1000,
  },
  bubble: {
    backgroundColor: TOOLTIP_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.gold.bright,
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.parchment.primary,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.bg.tertiary,
  },
  dotActive: {
    backgroundColor: Colors.gold.primary,
    width: 14,
    borderRadius: 3,
  },
  nextBtn: {
    backgroundColor: Colors.gold.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  nextText: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.bg.primary,
    letterSpacing: 0.2,
  },
  beakUpBorder: {
    position: "absolute",
    top: -(BEAK_H + 1),
    width: 0,
    height: 0,
    borderLeftWidth: BEAK_HALF + 1,
    borderRightWidth: BEAK_HALF + 1,
    borderBottomWidth: BEAK_H + 1,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: BORDER_COLOR,
  },
  beakUpFill: {
    position: "absolute",
    top: -BEAK_H,
    width: 0,
    height: 0,
    borderLeftWidth: BEAK_HALF,
    borderRightWidth: BEAK_HALF,
    borderBottomWidth: BEAK_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: TOOLTIP_BG,
  },
  beakDownBorder: {
    position: "absolute",
    bottom: -(BEAK_H + 1),
    width: 0,
    height: 0,
    borderLeftWidth: BEAK_HALF + 1,
    borderRightWidth: BEAK_HALF + 1,
    borderTopWidth: BEAK_H + 1,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: BORDER_COLOR,
  },
  beakDownFill: {
    position: "absolute",
    bottom: -BEAK_H,
    width: 0,
    height: 0,
    borderLeftWidth: BEAK_HALF,
    borderRightWidth: BEAK_HALF,
    borderTopWidth: BEAK_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: TOOLTIP_BG,
  },
});
