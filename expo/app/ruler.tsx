import React, { useRef, useEffect, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Platform, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Heart, RotateCcw, Baby, Crown, Clock, ArrowUpCircle, Gem, HeartHandshake } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { MARRIAGE_CANDIDATES } from "@/mocks/gameData";

export default function RulerScreen() {
  console.log("[RealmOfCrowns] Ruler render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, resetGame, startRulerUpgrade, arrangeMarriage } = useGame();
  const [showMarriage, setShowMarriage] = useState(false);
  const ruler = state.ruler;
  const heir = state.heir;
  const healthColor = ruler.health > 70 ? Colors.status.success : ruler.health > 40 ? Colors.status.warning : Colors.status.danger;
  const healthPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (ruler.health < 40) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(healthPulse, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(healthPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [ruler.health]);

  const stats = [
    { label: "Diplomacy", key: "diplomacy" as const, value: ruler.diplomacy, icon: "🗣️", color: Colors.gold.primary },
    { label: "Martial", key: "martial" as const, value: ruler.martial, icon: "⚔️", color: Colors.crimson.bright },
    { label: "Stewardship", key: "stewardship" as const, value: ruler.stewardship, icon: "💰", color: Colors.food.light },
    { label: "Intrigue", key: "intrigue" as const, value: ruler.intrigue, icon: "🗡️", color: Colors.faith.light },
    { label: "Learning", key: "learning" as const, value: ruler.learning, icon: "📖", color: Colors.status.info },
  ];

  const handleReset = () => {
    Alert.alert("Reset Game", "Are you sure? All progress will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: async () => { await resetGame(); router.replace('/kingdom-select'); } },
    ]);
  };

  const handleMarriage = useCallback((index: number) => {
    if (state.resources.gold < 300) {
      Alert.alert("Insufficient Gold", "Need 300 gold for the marriage ceremony.");
      return;
    }
    const candidate = MARRIAGE_CANDIDATES[index];
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    Alert.alert(
      "Arrange Marriage",
      `Marry ${candidate.name}?\n\n${candidate.description}\n\nCost: 300 gold\n+20 relations with ${candidate.kingdom}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Marry!", onPress: () => { arrangeMarriage(index); setShowMarriage(false); } },
      ]
    );
  }, [state.resources.gold, arrangeMarriage]);

  const handleUpgradeStat = useCallback((stat: 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning') => {
    if (ruler.activeUpgrade) {
      Alert.alert("Already Training", `Currently training ${ruler.activeUpgrade.stat}. Wait ${ruler.activeUpgrade.turnsRemaining} turns.`);
      return;
    }
    if (state.resources.gold < 150) {
      Alert.alert("Insufficient Gold", "Need 150 gold to begin training.");
      return;
    }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    startRulerUpgrade(stat);
  }, [ruler.activeUpgrade, state.resources.gold, startRulerUpgrade]);

  const activeUpgrade = ruler.activeUpgrade;

  return (
    <View style={[r.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#141018', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={r.header}>
        <View style={r.headerLeft}><Crown size={22} color={Colors.gold.bright} /><Text style={r.title}>Ruler Profile</Text></View>
        <TouchableOpacity onPress={() => router.back()} style={r.closeBtn} testID="close-ruler"><X size={22} color={Colors.text.secondary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={r.profileSection}>
            <LinearGradient colors={[Colors.gold.dim + '30', Colors.bg.card]} style={r.profileBg}>
              <View style={r.avatarContainer}><Text style={r.avatarText}>👑</Text></View>
              <Text style={r.rulerName}>{ruler.name}</Text>
              <Text style={r.dynasty}>{ruler.dynasty}</Text>
              <Text style={r.age}>Age {ruler.age} {ruler.age > 60 ? '(Elderly)' : ruler.age > 45 ? '(Middle-aged)' : ''}</Text>
            </LinearGradient>
          </View>

          <Animated.View style={{ transform: [{ scale: healthPulse }] }}>
            <View style={[r.healthSection, ruler.health < 30 && r.healthCritical]}>
              <View style={r.healthHeader}>
                <Heart size={16} color={healthColor} />
                <Text style={r.healthLabel}>Health</Text>
                <Text style={[r.healthValue, { color: healthColor }]}>{ruler.health}/{ruler.maxHealth}</Text>
              </View>
              <View style={r.healthBarBg}>
                <View style={[r.healthBarFill, { width: `${(ruler.health / ruler.maxHealth) * 100}%`, backgroundColor: healthColor }]} />
              </View>
              {ruler.health < 40 && <Text style={r.healthWarning}>⚠️ Your ruler's health is declining!</Text>}
              {ruler.age > 55 && <Text style={r.ageWarning}>Old age takes its toll. Ensure succession is secured.</Text>}
            </View>
          </Animated.View>

          {activeUpgrade && (
            <View style={r.upgradeActive}>
              <View style={r.upgradeActiveHeader}>
                <Clock size={14} color={Colors.gold.bright} />
                <Text style={r.upgradeActiveTitle}>Training: {activeUpgrade.stat.charAt(0).toUpperCase() + activeUpgrade.stat.slice(1)}</Text>
              </View>
              <View style={r.upgradeBarBg}>
                <View style={[r.upgradeBarFill, { width: `${((activeUpgrade.totalTurns - activeUpgrade.turnsRemaining) / activeUpgrade.totalTurns) * 100}%` }]} />
              </View>
              <Text style={r.upgradeProgress}>{activeUpgrade.turnsRemaining} turn{activeUpgrade.turnsRemaining !== 1 ? 's' : ''} remaining • +2 {activeUpgrade.stat} on completion</Text>
            </View>
          )}

          <Text style={r.sectionTitle}>Attributes</Text>
          <Text style={r.upgradeHint}>Tap a stat to begin training (+2, costs 150g, 5 turns)</Text>
          <View style={r.statsGrid}>
            {stats.map(stat => {
              const isTraining = activeUpgrade?.stat === stat.key;
              return (
                <TouchableOpacity
                  key={stat.label}
                  style={[r.statCard, isTraining && { borderColor: stat.color + '60' }]}
                  onPress={() => handleUpgradeStat(stat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={r.statIcon}>{stat.icon}</Text>
                  <Text style={[r.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={r.statLabel}>{stat.label}</Text>
                  <View style={r.statBarBg}>
                    <View style={[r.statBarFill, { width: `${Math.min(100, stat.value * 5)}%`, backgroundColor: stat.color + '60' }]} />
                  </View>
                  {isTraining ? (
                    <View style={[r.trainBadge, { backgroundColor: stat.color + '20' }]}>
                      <Clock size={10} color={stat.color} />
                      <Text style={[r.trainBadgeText, { color: stat.color }]}>{activeUpgrade.turnsRemaining}t</Text>
                    </View>
                  ) : !activeUpgrade ? (
                    <View style={r.upgradeIcon}>
                      <ArrowUpCircle size={14} color={Colors.text.dim} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={r.sectionTitle}>Character Traits</Text>
          <View style={r.traitsContainer}>
            {ruler.traits.map(trait => (
              <View key={trait.id} style={r.traitCard}>
                <Text style={r.traitIcon}>{trait.icon}</Text>
                <View style={r.traitInfo}>
                  <Text style={r.traitName}>{trait.name}</Text>
                  <Text style={r.traitEffect}>{trait.effect}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={r.sectionTitle}>Marriage</Text>
          {ruler.spouse ? (
            <View style={r.spouseCard}>
              <View style={r.spouseHeader}>
                <View style={r.spouseAvatar}><HeartHandshake size={20} color={Colors.crimson.bright} /></View>
                <View style={r.spouseInfo}>
                  <Text style={r.spouseName}>{ruler.spouse}</Text>
                  <Text style={r.spouseLabel}>Royal Consort</Text>
                </View>
                <Gem size={16} color={Colors.gold.dim} />
              </View>
              {ruler.spouseBonuses && (
                <View style={r.spouseBonuses}>
                  {Object.entries(ruler.spouseBonuses).filter(([, v]) => v !== 0).map(([key, val]) => (
                    <View key={key} style={r.spouseBonusItem}>
                      <Text style={r.spouseBonusText}>+{val} {key.replace('PerTurn', '/turn')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={r.marriageBtn} onPress={() => setShowMarriage(true)} activeOpacity={0.7}>
              <HeartHandshake size={16} color={Colors.crimson.bright} />
              <Text style={r.marriageBtnText}>Arrange Royal Marriage (300g)</Text>
            </TouchableOpacity>
          )}

          <Modal visible={showMarriage} transparent animationType="fade">
            <View style={r.marriageOverlay}>
              <View style={r.marriageModal}>
                <LinearGradient colors={['#1a1215', '#0d1117']} style={StyleSheet.absoluteFill} />
                <View style={r.marriageModalHeader}>
                  <Text style={r.marriageModalTitle}>💍 Marriage Candidates</Text>
                  <TouchableOpacity onPress={() => setShowMarriage(false)} style={r.marriageCloseBtn}>
                    <X size={18} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {MARRIAGE_CANDIDATES.map((candidate, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={r.candidateCard}
                      onPress={() => handleMarriage(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={r.candidateName}>{candidate.name}</Text>
                      <Text style={r.candidateDesc}>{candidate.description}</Text>
                      <View style={r.candidateBonuses}>
                        {candidate.diplomacyBonus ? <Text style={r.candidateBonus}>+{candidate.diplomacyBonus} Diplomacy</Text> : null}
                        {candidate.martialBonus ? <Text style={r.candidateBonus}>+{candidate.martialBonus} Martial</Text> : null}
                        {candidate.stewardshipBonus ? <Text style={r.candidateBonus}>+{candidate.stewardshipBonus} Stewardship</Text> : null}
                        {candidate.intrigueBonus ? <Text style={r.candidateBonus}>+{candidate.intrigueBonus} Intrigue</Text> : null}
                        {candidate.learningBonus ? <Text style={r.candidateBonus}>+{candidate.learningBonus} Learning</Text> : null}
                        {candidate.goldBonus ? <Text style={r.candidateBonus}>+{candidate.goldBonus} Gold/turn</Text> : null}
                        {candidate.militaryBonus ? <Text style={r.candidateBonus}>+{candidate.militaryBonus} Military/turn</Text> : null}
                        {candidate.faithBonus ? <Text style={r.candidateBonus}>+{candidate.faithBonus} Faith/turn</Text> : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Text style={r.sectionTitle}>
            <Text>👶 </Text>Succession
          </Text>
          {heir ? (
            <View style={r.heirCard}>
              <View style={r.heirHeader}>
                <View style={r.heirAvatar}><Baby size={20} color={Colors.gold.primary} /></View>
                <View style={r.heirInfo}>
                  <Text style={r.heirName}>{heir.name}</Text>
                  <Text style={r.heirAge}>Age {heir.age} {heir.age < 16 ? '(Minor — cannot rule yet)' : '(Ready to rule)'}</Text>
                </View>
              </View>
              <View style={r.heirClaimRow}>
                <Text style={r.heirClaimLabel}>Claim Strength</Text>
                <View style={r.heirClaimBarBg}>
                  <View style={[r.heirClaimBarFill, { width: `${heir.claimStrength}%` }]} />
                </View>
                <Text style={r.heirClaimValue}>{heir.claimStrength}%</Text>
              </View>
              <View style={r.heirStatsRow}>
                <View style={r.heirStatItem}><Text style={r.heirStatLabel}>🗣️</Text><Text style={r.heirStatValue}>{heir.diplomacy}</Text></View>
                <View style={r.heirStatItem}><Text style={r.heirStatLabel}>⚔️</Text><Text style={r.heirStatValue}>{heir.martial}</Text></View>
                <View style={r.heirStatItem}><Text style={r.heirStatLabel}>💰</Text><Text style={r.heirStatValue}>{heir.stewardship}</Text></View>
                <View style={r.heirStatItem}><Text style={r.heirStatLabel}>🗡️</Text><Text style={r.heirStatValue}>{heir.intrigue}</Text></View>
                <View style={r.heirStatItem}><Text style={r.heirStatLabel}>📖</Text><Text style={r.heirStatValue}>{heir.learning}</Text></View>
              </View>
              {heir.traits.length > 0 && (
                <View style={r.heirTraits}>
                  {heir.traits.map(t => (
                    <View key={t.id} style={r.heirTraitBadge}>
                      <Text style={r.heirTraitText}>{t.icon} {t.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={r.noHeirCard}>
              <Text style={r.noHeirIcon}>⚠️</Text>
              <Text style={r.noHeirTitle}>No Heir!</Text>
              <Text style={r.noHeirDesc}>If your ruler dies, the dynasty ends. An heir may be born in time.</Text>
            </View>
          )}

          <Text style={r.sectionTitle}>Realm Summary</Text>
          <View style={r.realmSummary}>
            <View style={r.realmRow}><Text style={r.realmLabel}>Year</Text><Text style={r.realmValue}>{state.year} AD</Text></View>
            <View style={r.realmRow}><Text style={r.realmLabel}>Season</Text><Text style={r.realmValue}>{state.season}</Text></View>
            <View style={r.realmRow}><Text style={r.realmLabel}>Turn</Text><Text style={r.realmValue}>{state.turn}</Text></View>
            <View style={r.realmRow}><Text style={r.realmLabel}>Provinces</Text><Text style={r.realmValue}>{state.provinces.filter(p => p.owner === 'player').length}/{state.provinces.length}</Text></View>
            <View style={r.realmRow}><Text style={r.realmLabel}>Active Wars</Text><Text style={[r.realmValue, state.kingdoms.some(k => k.attitude === 'war') ? { color: Colors.crimson.bright } : {}]}>{state.kingdoms.filter(k => k.attitude === 'war').length}</Text></View>
            <View style={r.realmRow}><Text style={r.realmLabel}>Battles Fought</Text><Text style={r.realmValue}>{state.battles.length}</Text></View>
            <View style={r.realmRow}><Text style={r.realmLabel}>Technologies</Text><Text style={r.realmValue}>{state.technologies.filter(t => t.researched).length}/{state.technologies.length}</Text></View>
          </View>

          <TouchableOpacity style={r.resetBtn} onPress={handleReset} activeOpacity={0.7} testID="reset-game">
            <RotateCcw size={16} color={Colors.crimson.bright} /><Text style={r.resetText}>Reset Game</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const r = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  profileSection: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: "hidden" },
  profileBg: { alignItems: "center", paddingVertical: 28, gap: 6 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bg.primary, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: Colors.gold.primary, marginBottom: 8 },
  avatarText: { fontSize: 36 },
  rulerName: { fontSize: 22, fontWeight: "800" as const, color: Colors.text.primary },
  dynasty: { fontSize: 14, color: Colors.gold.dim, fontWeight: "600" as const },
  age: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  healthSection: { marginHorizontal: 16, marginTop: 16, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  healthCritical: { borderColor: Colors.crimson.bright + '60' },
  healthHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  healthLabel: { flex: 1, fontSize: 14, fontWeight: "600" as const, color: Colors.text.primary },
  healthValue: { fontSize: 14, fontWeight: "700" as const },
  healthBarBg: { height: 8, borderRadius: 4, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  healthBarFill: { height: "100%", borderRadius: 4 },
  healthWarning: { fontSize: 11, color: Colors.crimson.bright, marginTop: 8, fontWeight: "600" as const },
  ageWarning: { fontSize: 11, color: Colors.status.warning, marginTop: 4 },
  upgradeActive: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.gold.dim + '15', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.gold.dim + '40' },
  upgradeActiveHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  upgradeActiveTitle: { fontSize: 14, fontWeight: "700" as const, color: Colors.gold.bright },
  upgradeBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  upgradeBarFill: { height: "100%", borderRadius: 3, backgroundColor: Colors.gold.bright },
  upgradeProgress: { fontSize: 11, color: Colors.text.secondary, marginTop: 6 },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  upgradeHint: { fontSize: 11, color: Colors.text.dim, paddingHorizontal: 16, marginBottom: 8, marginTop: -4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  statCard: { width: "30%" as any, flexGrow: 1, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 12, alignItems: "center", gap: 4, borderWidth: 1, borderColor: Colors.border.primary, position: "relative" as const },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: "800" as const },
  statLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const },
  statBarBg: { height: 3, width: "100%", borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden", marginTop: 4 },
  statBarFill: { height: "100%", borderRadius: 2 },
  trainBadge: { position: "absolute", top: 4, right: 4, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  trainBadgeText: { fontSize: 9, fontWeight: "700" as const },
  upgradeIcon: { position: "absolute", top: 4, right: 4 },
  traitsContainer: { paddingHorizontal: 16, gap: 8 },
  traitCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.bg.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.primary },
  traitIcon: { fontSize: 24 },
  traitInfo: { flex: 1, gap: 2 },
  traitName: { fontSize: 14, fontWeight: "600" as const, color: Colors.text.primary },
  traitEffect: { fontSize: 12, color: Colors.text.secondary },
  heirCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.gold.dim + '40' },
  heirHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heirAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold.dim + '20', alignItems: "center", justifyContent: "center" },
  heirInfo: { flex: 1, gap: 2 },
  heirName: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  heirAge: { fontSize: 12, color: Colors.text.secondary },
  heirClaimRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  heirClaimLabel: { fontSize: 11, color: Colors.text.dim },
  heirClaimBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  heirClaimBarFill: { height: "100%", borderRadius: 2, backgroundColor: Colors.gold.primary },
  heirClaimValue: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.primary },
  heirStatsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  heirStatItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: Colors.bg.tertiary, borderRadius: 6, paddingVertical: 6 },
  heirStatLabel: { fontSize: 12 },
  heirStatValue: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  heirTraits: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  heirTraitBadge: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  heirTraitText: { fontSize: 11, color: Colors.text.secondary },
  noHeirCard: { marginHorizontal: 16, backgroundColor: Colors.crimson.dark + '20', borderRadius: 14, padding: 20, alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.crimson.dark + '40' },
  noHeirIcon: { fontSize: 32 },
  noHeirTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.crimson.bright },
  noHeirDesc: { fontSize: 12, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 17 },
  realmSummary: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary, gap: 10 },
  realmRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  realmLabel: { fontSize: 13, color: Colors.text.secondary },
  realmValue: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.crimson.dark, backgroundColor: Colors.crimson.dark + '15' },
  resetText: { fontSize: 14, fontWeight: "600" as const, color: Colors.crimson.bright },
  spouseCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.crimson.bright + '30' },
  spouseHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  spouseAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.crimson.bright + '20', alignItems: "center" as const, justifyContent: "center" as const },
  spouseInfo: { flex: 1, gap: 2 },
  spouseName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  spouseLabel: { fontSize: 11, color: Colors.text.secondary },
  spouseBonuses: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  spouseBonusItem: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  spouseBonusText: { fontSize: 11, fontWeight: "600" as const, color: Colors.status.success },
  marriageBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.crimson.bright + '40', borderStyle: "dashed" as const, backgroundColor: Colors.crimson.bright + '08' },
  marriageBtnText: { fontSize: 13, fontWeight: "600" as const, color: Colors.crimson.bright },
  marriageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: "center" as const, justifyContent: "center" as const, padding: 20 },
  marriageModal: { width: "100%" as const, maxWidth: 380, maxHeight: "80%" as const, borderRadius: 20, padding: 20, overflow: "hidden" as const, borderWidth: 1, borderColor: Colors.crimson.bright + '40' },
  marriageModalHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 14 },
  marriageModalTitle: { fontSize: 18, fontWeight: "800" as const, color: Colors.crimson.bright },
  marriageCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg.tertiary, alignItems: "center" as const, justifyContent: "center" as const },
  candidateCard: { backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border.primary },
  candidateName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary, marginBottom: 4 },
  candidateDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 16, marginBottom: 8 },
  candidateBonuses: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6 },
  candidateBonus: { fontSize: 10, fontWeight: "600" as const, color: Colors.status.success, backgroundColor: Colors.status.success + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" as const },
});
