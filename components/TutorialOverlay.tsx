import React, { useMemo, useRef, useEffect } from "react";
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BookOpen, Castle, ChevronLeft, ChevronRight, Eye, Map, ScrollText, Shield, Sparkles, Swords, X } from "lucide-react-native";

import Colors from "@/constants/colors";

type TutorialStep = {
  title: string;
  eyebrow: string;
  body: string;
  icon: React.ReactNode;
  highlight: "crown" | "resources" | "map" | "command" | "turn" | "none";
};

const steps: TutorialStep[] = [
  { eyebrow: "Royal Counsel", title: "Your reign begins", body: "You inherit a young realm. Each turn is a season of choices: gather strength, build wisely, scout the unknown, and decide when to risk war.", icon: <Castle size={28} color={Colors.gold.bright} />, highlight: "none" },
  { eyebrow: "The Crown", title: "Know your ruler", body: "Your ruler and dynasty sit at the top. Tap them later to manage traits, heirs, marriages, and long-term legacy upgrades.", icon: <Sparkles size={28} color={Colors.gold.bright} />, highlight: "crown" },
  { eyebrow: "Treasury", title: "Resources fuel everything", body: "Gold builds and recruits, food keeps people loyal, military powers armies, and faith unlocks spiritual actions. Watch the per-turn income closely.", icon: <Shield size={28} color={Colors.status.info} />, highlight: "resources" },
  { eyebrow: "The Realm", title: "Read the map", body: "Your provinces are the heart of your kingdom. Tap a province to inspect buildings, recruit troops, reinforce garrisons, or plan actions.", icon: <Map size={28} color={Colors.food.light} />, highlight: "map" },
  { eyebrow: "Fog of War", title: "The unknown can be scouted", body: "Distant and undiscovered territories hide armies and intent. Send spies to reveal regions; unexplored lands cost 2 turns to scout.", icon: <Eye size={28} color="#a78bfa" />, highlight: "map" },
  { eyebrow: "Stone & Grain", title: "Build from level 1", body: "Buildings and upgrades start humbly. Improve your keep, economy, barracks, temples, and workshops to shape your realm’s identity.", icon: <Castle size={28} color={Colors.gold.primary} />, highlight: "command" },
  { eyebrow: "War Table", title: "Armies decide borders", body: "Use Armies to recruit, reinforce, merge, move, and attack. Morale, commanders, terrain, and tactics can turn a smaller force into a legend.", icon: <Swords size={28} color={Colors.crimson.bright} />, highlight: "command" },
  { eyebrow: "Silent Blades", title: "Espionage gives options", body: "The Espionage hall lets you scout, sabotage, steal, and investigate rumors. Information is often cheaper than a failed invasion.", icon: <Eye size={28} color="#a78bfa" />, highlight: "command" },
  { eyebrow: "Council Chamber", title: "Assign your advisors", body: "Councilors can fight corruption, improve loyalty, contain plague, support war, and stabilize growth. Reassign them as crises change.", icon: <ScrollText size={28} color={Colors.faith.light} />, highlight: "command" },
  { eyebrow: "Court Events", title: "Choices echo forward", body: "Events, rumors, pressure warnings, and chronicles tell the story of your reign. Some decisions trigger consequences turns later.", icon: <BookOpen size={28} color={Colors.parchment.primary} />, highlight: "command" },
  { eyebrow: "Seasons Pass", title: "End Turn advances the world", body: "When your commands are set, End Turn resolves income, research, missions, enemy moves, battles, pressure, and new events.", icon: <ChevronRight size={28} color={Colors.bg.primary} />, highlight: "turn" },
];

export default function TutorialOverlay({ visible, onFinish }: { visible: boolean; onFinish: () => void }) {
  const [index, setIndex] = React.useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const step = steps[index];
  const progress = useMemo(() => `${index + 1}/${steps.length}`, [index]);

  useEffect(() => {
    if (visible) {
      setIndex(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, fadeAnim]);

  const tap = () => { if (Platform.OS !== "web") void Haptics.selectionAsync(); };
  const next = () => { tap(); if (index >= steps.length - 1) onFinish(); else setIndex(prev => prev + 1); };
  const back = () => { tap(); setIndex(prev => Math.max(0, prev - 1)); };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
        <View style={[styles.glow, styles[`glow_${step.highlight}`]]} />
        <View style={styles.scrim} />
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <LinearGradient colors={["#241c12", "#111820", "#0d1117"]} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
              <View style={styles.iconSeal}>{step.icon}</View>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>{step.eyebrow}</Text>
                <Text style={styles.title}>{step.title}</Text>
              </View>
              <TouchableOpacity onPress={onFinish} style={styles.closeBtn} testID="skip-tutorial-btn"><X size={18} color={Colors.text.secondary} /></TouchableOpacity>
            </View>
            <Text style={styles.body}>{step.body}</Text>
            <View style={styles.progressTrack}>{steps.map((_, i) => <View key={i} style={[styles.progressDot, i <= index && styles.progressDotActive]} />)}</View>
            <View style={styles.footer}>
              <TouchableOpacity onPress={back} disabled={index === 0} style={[styles.backBtn, index === 0 && styles.disabledBtn]}>
                <ChevronLeft size={16} color={Colors.text.secondary} /><Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.count}>{progress}</Text>
              <TouchableOpacity onPress={next} style={styles.nextBtn} testID="tutorial-next-btn">
                <Text style={styles.nextText}>{index === steps.length - 1 ? "Finish" : "Next"}</Text><ChevronRight size={16} color={Colors.bg.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center" as const },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)" },
  glow: { position: "absolute", borderRadius: 22, borderWidth: 2, borderColor: Colors.gold.bright, backgroundColor: Colors.gold.bright + "18", shadowColor: Colors.gold.bright, shadowOpacity: 0.8, shadowRadius: 18, elevation: 12 },
  glow_none: { opacity: 0, width: 1, height: 1 },
  glow_crown: { top: 58, left: 14, width: 210, height: 58 },
  glow_resources: { top: 112, left: 8, right: 8, height: 54 },
  glow_map: { top: 300, left: 14, right: 14, height: 210 },
  glow_command: { bottom: 118, left: 14, right: 14, height: 150 },
  glow_turn: { bottom: 18, left: 14, right: 14, height: 68 },
  cardWrap: { paddingHorizontal: 18, justifyContent: "center" as const },
  card: { borderRadius: 24, padding: 18, overflow: "hidden" as const, borderWidth: 1, borderColor: Colors.border.gold },
  header: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, marginBottom: 14 },
  iconSeal: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.gold.dim + "22", borderWidth: 1, borderColor: Colors.gold.dim, alignItems: "center" as const, justifyContent: "center" as const },
  headerText: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 11, fontWeight: "800" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.8 },
  title: { fontSize: 24, fontWeight: "900" as const, color: Colors.gold.bright, letterSpacing: 0.2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: Colors.bg.tertiary },
  body: { fontSize: 15, lineHeight: 23, color: Colors.parchment.primary, marginBottom: 18 },
  progressTrack: { flexDirection: "row" as const, gap: 5, marginBottom: 18 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.bg.tertiary },
  progressDotActive: { backgroundColor: Colors.gold.bright },
  footer: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  backBtn: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, paddingVertical: 12, paddingHorizontal: 10 },
  disabledBtn: { opacity: 0.35 },
  backText: { color: Colors.text.secondary, fontSize: 14, fontWeight: "700" as const },
  count: { flex: 1, textAlign: "center" as const, color: Colors.gold.dim, fontSize: 12, fontWeight: "800" as const },
  nextBtn: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, backgroundColor: Colors.gold.primary, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  nextText: { color: Colors.bg.primary, fontSize: 14, fontWeight: "900" as const },
});
