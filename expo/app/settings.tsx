import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Settings, RotateCcw, Crown, Shield, Swords, BookOpen, MapPin, Calendar, Flame } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

const DIFFICULTY_META: Record<string, { label: string; color: string; desc: string }> = {
  easy: { label: 'EASY', color: Colors.status.success, desc: 'More resources, weaker AI opponents' },
  normal: { label: 'NORMAL', color: Colors.status.warning, desc: 'Balanced experience for all players' },
  hard: { label: 'HARD', color: Colors.crimson.bright, desc: 'Fewer resources, aggressive AI opponents' },
};

const VICTORY_CONDITIONS = [
  { icon: '🗺️', title: 'Conquest Victory', desc: 'Conquer all provinces on the map' },
  { icon: '🏰', title: 'Domination Victory', desc: 'Control 70%+ of provinces after 50 turns' },
  { icon: '📚', title: 'Cultural Victory', desc: 'Research all technologies and survive 50+ turns' },
  { icon: '🙏', title: 'Faith Victory', desc: 'Accumulate 1,000+ faith points' },
];

const GAME_TIPS = [
  { icon: '🗺️', tip: 'Tap provinces on the map to manage buildings and recruit' },
  { icon: '⚔️', tip: 'Move armies to enemy provinces to begin sieges' },
  { icon: '🛡️', tip: 'Reinforce garrisons to protect against AI attacks' },
  { icon: '📚', tip: 'Research technologies for permanent bonuses' },
  { icon: '🤝', tip: 'Trade with friendly kingdoms for extra income' },
  { icon: '🕵️', tip: 'Use espionage to sabotage enemies or steal gold' },
  { icon: '🙏', tip: 'Faith actions provide powerful temporary boosts' },
  { icon: '⚖️', tip: 'Combat tactics change your battle win probability' },
  { icon: '👑', tip: 'Keep your ruler healthy — succession can be risky' },
  { icon: '📈', tip: 'Upgrade ruler and council stats for permanent bonuses' },
];

export default function SettingsScreen() {
  console.log("[RealmOfCrowns] Settings render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, resetGame, playerProvinces } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const diff = DIFFICULTY_META[state.difficulty] || DIFFICULTY_META.normal;
  const totalTroops = state.armies.reduce((s, a) => s + a.troops, 0);
  const totalBattles = state.battles.length;
  const techResearched = state.technologies.filter(t => t.researched).length;
  const totalTech = state.technologies.length;
  const unlockedAch = state.achievements.filter(a => a.unlocked).length;

  const handleNewGame = useCallback(() => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    Alert.alert(
      "Start New Game",
      "This will erase your current save and return to kingdom selection. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "New Game",
          style: "destructive",
          onPress: async () => {
            await resetGame();
            router.replace("/kingdom-select");
          },
        },
      ]
    );
  }, [resetGame, router]);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0d1117', '#12181f', '#0d1117']} style={StyleSheet.absoluteFill} />

      <View style={st.header}>
        <View style={st.headerLeft}>
          <Settings size={22} color={Colors.gold.bright} />
          <Text style={st.title}>Settings & Info</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={st.closeBtn} testID="close-settings">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={st.infoCard}>
            <LinearGradient colors={[Colors.gold.dim + '12', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={st.infoHeader}>
              <Crown size={20} color={Colors.gold.bright} />
              <Text style={st.infoTitle}>Current Game</Text>
            </View>
            <View style={st.infoGrid}>
              <View style={st.infoItem}>
                <Text style={st.infoEmoji}>👤</Text>
                <Text style={st.infoValue}>{state.ruler.name}</Text>
                <Text style={st.infoLabel}>{state.ruler.dynasty}</Text>
              </View>
              <View style={st.infoItem}>
                <Calendar size={14} color={Colors.text.dim} />
                <Text style={st.infoValue}>{state.year} AD</Text>
                <Text style={st.infoLabel}>Turn {state.turn}</Text>
              </View>
              <View style={st.infoItem}>
                <View style={[st.diffDot, { backgroundColor: diff.color }]} />
                <Text style={[st.infoValue, { color: diff.color }]}>{diff.label}</Text>
                <Text style={st.infoLabel}>Difficulty</Text>
              </View>
            </View>
          </View>

          <Text style={st.sectionTitle}>Game Stats</Text>
          <View style={st.statsCard}>
            <View style={st.statRow}>
              <View style={st.statIcon}><MapPin size={14} color={Colors.status.info} /></View>
              <Text style={st.statName}>Provinces</Text>
              <Text style={st.statVal}>{playerProvinces.length}</Text>
            </View>
            <View style={st.statRow}>
              <View style={st.statIcon}><Swords size={14} color={Colors.crimson.bright} /></View>
              <Text style={st.statName}>Total Troops</Text>
              <Text style={st.statVal}>{totalTroops.toLocaleString()}</Text>
            </View>
            <View style={st.statRow}>
              <View style={st.statIcon}><Shield size={14} color={Colors.military.steel} /></View>
              <Text style={st.statName}>Battles Fought</Text>
              <Text style={st.statVal}>{totalBattles}</Text>
            </View>
            <View style={st.statRow}>
              <View style={st.statIcon}><BookOpen size={14} color={Colors.status.info} /></View>
              <Text style={st.statName}>Tech Researched</Text>
              <Text style={st.statVal}>{techResearched}/{totalTech}</Text>
            </View>
            <View style={st.statRow}>
              <View style={st.statIcon}><Flame size={14} color={Colors.gold.bright} /></View>
              <Text style={st.statName}>Achievements</Text>
              <Text style={st.statVal}>{unlockedAch}/{state.achievements.length}</Text>
            </View>
          </View>

          <Text style={st.sectionTitle}>Victory Conditions</Text>
          <View style={st.conditionsCard}>
            {VICTORY_CONDITIONS.map((vc, i) => (
              <View key={i} style={[st.condRow, i < VICTORY_CONDITIONS.length - 1 && st.condRowBorder]}>
                <Text style={st.condIcon}>{vc.icon}</Text>
                <View style={st.condInfo}>
                  <Text style={st.condTitle}>{vc.title}</Text>
                  <Text style={st.condDesc}>{vc.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={st.sectionTitle}>Game Tips</Text>
          <View style={st.tipsCard}>
            {GAME_TIPS.map((tip, i) => (
              <View key={i} style={[st.tipRow, i < GAME_TIPS.length - 1 && st.tipRowBorder]}>
                <Text style={st.tipIcon}>{tip.icon}</Text>
                <Text style={st.tipText}>{tip.tip}</Text>
              </View>
            ))}
          </View>

          <View style={st.dangerZone}>
            <TouchableOpacity style={st.newGameBtn} onPress={handleNewGame} activeOpacity={0.7} testID="new-game-btn">
              <RotateCcw size={18} color={Colors.crimson.bright} />
              <Text style={st.newGameText}>Start New Game</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  infoCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.gold.dim + '40', overflow: "hidden" },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  infoTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.gold.bright },
  infoGrid: { flexDirection: "row", gap: 12 },
  infoItem: { flex: 1, alignItems: "center", gap: 4, backgroundColor: Colors.bg.tertiary, borderRadius: 10, paddingVertical: 10 },
  infoEmoji: { fontSize: 16 },
  infoValue: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  infoLabel: { fontSize: 9, color: Colors.text.dim, textTransform: "uppercase" as const },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  statsCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border.primary },
  statRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  statIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.bg.tertiary, alignItems: "center", justifyContent: "center" },
  statName: { flex: 1, fontSize: 14, color: Colors.text.secondary },
  statVal: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  conditionsCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border.primary },
  condRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  condRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  condIcon: { fontSize: 20, width: 28, textAlign: "center" as const },
  condInfo: { flex: 1, gap: 2 },
  condTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  condDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 15 },
  tipsCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border.primary },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  tipIcon: { fontSize: 16, width: 24, textAlign: "center" as const },
  tipText: { flex: 1, fontSize: 12, color: Colors.text.secondary, lineHeight: 17 },
  dangerZone: { marginHorizontal: 16, marginTop: 30 },
  newGameBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.crimson.bright + '50', backgroundColor: Colors.crimson.bright + '10' },
  newGameText: { fontSize: 15, fontWeight: "700" as const, color: Colors.crimson.bright },
});
