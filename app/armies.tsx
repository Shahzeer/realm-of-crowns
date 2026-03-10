import React, { useRef, useEffect, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Shield, MapPin, Navigation, Swords, ChevronRight, Target, Plus, Trash2, Merge } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Army, Province, CombatTactic } from "@/types/game";
import { COMBAT_TACTICS } from "@/mocks/gameData";

function TacticCard({ tactic, isActive, onSelect }: { tactic: CombatTactic; isActive: boolean; onSelect: () => void }) {
  const getModColor = (val: number) => val > 0 ? Colors.status.success : val < 0 ? Colors.crimson.bright : Colors.text.dim;

  return (
    <TouchableOpacity
      style={[s.tacticCard, isActive && s.tacticCardActive]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={s.tacticHeader}>
        <Text style={s.tacticIcon}>{tactic.icon}</Text>
        <View style={s.tacticInfo}>
          <Text style={[s.tacticName, isActive && { color: Colors.gold.bright }]}>{tactic.name}</Text>
          <Text style={s.tacticDesc}>{tactic.description}</Text>
        </View>
        {isActive && <View style={s.activeDot} />}
      </View>
      <View style={s.modRow}>
        <View style={s.modItem}>
          <Text style={s.modLabel}>ATK</Text>
          <Text style={[s.modValue, { color: getModColor(tactic.attackModifier) }]}>
            {tactic.attackModifier > 0 ? '+' : ''}{tactic.attackModifier}%
          </Text>
        </View>
        <View style={s.modItem}>
          <Text style={s.modLabel}>DEF</Text>
          <Text style={[s.modValue, { color: getModColor(tactic.defenseModifier) }]}>
            {tactic.defenseModifier > 0 ? '+' : ''}{tactic.defenseModifier}%
          </Text>
        </View>
        <View style={s.modItem}>
          <Text style={s.modLabel}>MRL</Text>
          <Text style={[s.modValue, { color: getModColor(tactic.moraleModifier) }]}>
            {tactic.moraleModifier > 0 ? '+' : ''}{tactic.moraleModifier}%
          </Text>
        </View>
        <View style={s.modItem}>
          <Text style={s.modLabel}>CAS</Text>
          <Text style={[s.modValue, { color: getModColor(-tactic.casualtyModifier) }]}>
            {tactic.casualtyModifier > 0 ? '+' : ''}{tactic.casualtyModifier}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArmyCard({ army, provinces, onMove, onAttack, onReinforce, onDisband, index, resources }: {
  army: Army;
  provinces: Province[];
  onMove: (armyId: string, destId: string) => void;
  onAttack: (armyId: string, provinceId: string) => void;
  onReinforce: (armyId: string) => void;
  onDisband: (armyId: string) => void;
  index: number;
  resources: { gold: number; military: number };
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const province = provinces.find(p => p.id === army.location);
  const moraleColor = army.morale > 70 ? Colors.status.success : army.morale > 40 ? Colors.status.warning : Colors.status.danger;
  const connectedProvinces = province ? provinces.filter(p => province.connectedTo.includes(p.id)) : [];
  const isIdle = army.status === 'idle';

  const statusColors: Record<string, string> = {
    idle: Colors.status.success,
    marching: Colors.status.warning,
    sieging: Colors.crimson.bright,
    fighting: '#ff4444',
    retreating: Colors.text.dim,
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={s.armyCard}>
        <View style={s.armyHeader}>
          <View style={s.armyIconBox}><Shield size={20} color={Colors.crimson.bright} /></View>
          <View style={s.armyInfo}>
            <Text style={s.armyName}>{army.name}</Text>
            <Text style={s.armyCommander}>{army.commander}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: (statusColors[army.status] || Colors.text.dim) + '20' }]}>
            <Text style={[s.statusText, { color: statusColors[army.status] || Colors.text.dim }]}>{army.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.armyStats}>
          <View style={s.troopBar}>
            <View style={s.troopLabelRow}>
              <Text style={s.troopLabel}>Troops</Text>
              <Text style={s.troopValue}>{army.troops}/{army.maxTroops}</Text>
            </View>
            <View style={s.barBg}><View style={[s.barFill, { width: `${(army.troops / army.maxTroops) * 100}%`, backgroundColor: Colors.crimson.bright }]} /></View>
          </View>
          <View style={s.troopBar}>
            <View style={s.troopLabelRow}>
              <Text style={s.troopLabel}>Morale</Text>
              <Text style={[s.troopValue, { color: moraleColor }]}>{army.morale}%</Text>
            </View>
            <View style={s.barBg}><View style={[s.barFill, { width: `${army.morale}%`, backgroundColor: moraleColor }]} /></View>
          </View>
        </View>

        <View style={s.locationRow}>
          <MapPin size={14} color={Colors.text.dim} />
          <Text style={s.locationText}>{province?.name ?? "Unknown"}</Text>
          {army.status === 'marching' && army.destination && (
            <>
              <Navigation size={12} color={Colors.status.warning} />
              <Text style={[s.locationText, { color: Colors.status.warning }]}>
                → {provinces.find(p => p.id === army.destination)?.name ?? '?'} ({army.marchTurnsLeft}t)
              </Text>
            </>
          )}
          {army.status === 'sieging' && (
            <Text style={[s.locationText, { color: Colors.crimson.bright }]}>⚔️ Sieging...</Text>
          )}
        </View>

        {isIdle && (
          <View style={s.actionRow}>
            <TouchableOpacity style={s.moveBtn} onPress={() => setShowMoveMenu(!showMoveMenu)} activeOpacity={0.7}>
              <Navigation size={14} color={Colors.status.info} />
              <Text style={s.moveBtnText}>Move / Attack</Text>
            </TouchableOpacity>
          </View>
        )}

        {isIdle && (
          <View style={s.manageRow}>
            <TouchableOpacity
              style={[s.reinforceBtn, (army.troops >= army.maxTroops || resources.gold < 200 || resources.military < 100) && s.btnDisabled]}
              onPress={() => onReinforce(army.id)}
              disabled={army.troops >= army.maxTroops || resources.gold < 200 || resources.military < 100}
              activeOpacity={0.7}
            >
              <Plus size={14} color={army.troops >= army.maxTroops ? Colors.text.dim : Colors.status.success} />
              <Text style={[s.reinforceBtnText, (army.troops >= army.maxTroops || resources.gold < 200 || resources.military < 100) && { color: Colors.text.dim }]}>Reinforce</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.disbandBtn}
              onPress={() => onDisband(army.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color={Colors.crimson.bright} />
              <Text style={s.disbandBtnText}>Disband</Text>
            </TouchableOpacity>
          </View>
        )}

        {showMoveMenu && isIdle && connectedProvinces.length > 0 && (
          <View style={s.moveMenu}>
            <Text style={s.moveMenuTitle}>Move to:</Text>
            {connectedProvinces.map(dest => {
              const isEnemy = dest.owner !== 'player';
              return (
                <TouchableOpacity
                  key={dest.id}
                  style={[s.moveOption, isEnemy && s.moveOptionEnemy]}
                  onPress={() => {
                    if (isEnemy) {
                      onAttack(army.id, dest.id);
                    } else {
                      onMove(army.id, dest.id);
                    }
                    setShowMoveMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={s.moveOptionName}>{dest.name}</Text>
                  {isEnemy ? (
                    <View style={s.attackBadge}><Swords size={12} color={Colors.crimson.bright} /><Text style={s.attackBadgeText}>Attack</Text></View>
                  ) : (
                    <ChevronRight size={14} color={Colors.text.dim} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function ArmiesScreen() {
  console.log("[RealmOfCrowns] Armies render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, moveArmy, setActiveTactic, winProbability, reinforceArmy, disbandArmy, mergeArmies } = useGame();
  const [showTactics, setShowTactics] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const totalTroops = state.armies.reduce((sum, a) => sum + a.troops, 0);
  const avgMorale = state.armies.length > 0 ? Math.round(state.armies.reduce((s, a) => s + a.morale, 0) / state.armies.length) : 0;
  const moraleColor = avgMorale > 70 ? Colors.status.success : avgMorale > 40 ? Colors.status.warning : Colors.status.danger;

  const activeTactic = COMBAT_TACTICS.find(t => t.id === state.activeTactic) || COMBAT_TACTICS[0];
  const winColor = winProbability > 60 ? Colors.status.success : winProbability > 40 ? Colors.status.warning : Colors.crimson.bright;

  const handleMove = useCallback((armyId: string, destId: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    moveArmy(armyId, destId);
  }, [moveArmy]);

  const handleAttack = useCallback((armyId: string, provinceId: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    const province = state.provinces.find(p => p.id === provinceId);
    Alert.alert(
      "Attack Province",
      `Send army to siege ${province?.name ?? 'enemy province'}? Using tactic: ${activeTactic.name}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Attack!", style: "destructive", onPress: () => moveArmy(armyId, provinceId) },
      ]
    );
  }, [moveArmy, state.provinces, activeTactic.name]);

  const handleReinforce = useCallback((armyId: string) => {
    const army = state.armies.find(a => a.id === armyId);
    if (!army) return;
    const maxReinforce = army.maxTroops - army.troops;
    const troops = Math.min(100, maxReinforce);
    const goldCost = troops * 2;
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    Alert.alert(
      "Reinforce Army",
      `Add ${troops} troops to ${army.name}?\nCost: ${goldCost} gold, ${troops} military`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reinforce", onPress: () => reinforceArmy(armyId, troops) },
      ]
    );
  }, [state.armies, reinforceArmy]);

  const handleDisband = useCallback((armyId: string) => {
    const army = state.armies.find(a => a.id === armyId);
    if (!army) return;
    const recovered = Math.floor(army.troops * 0.3);
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    Alert.alert(
      "Disband Army",
      `Disband ${army.name}?\nYou will recover ${recovered} military points.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Disband", style: "destructive", onPress: () => disbandArmy(armyId) },
      ]
    );
  }, [state.armies, disbandArmy]);

  const handleTacticSelect = useCallback((tacticId: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    setActiveTactic(tacticId);
  }, [setActiveTactic]);

  const handleMerge = useCallback((armyId: string) => {
    if (!mergeSourceId) {
      setMergeSourceId(armyId);
      return;
    }
    if (mergeSourceId === armyId) {
      setMergeSourceId(null);
      return;
    }
    const src = state.armies.find(a => a.id === mergeSourceId);
    const tgt = state.armies.find(a => a.id === armyId);
    if (!src || !tgt || src.location !== tgt.location) {
      Alert.alert("Cannot Merge", "Both armies must be in the same province and idle.");
      setMergeSourceId(null);
      return;
    }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    Alert.alert(
      "Merge Armies",
      `Merge ${tgt.name} (${tgt.troops}) into ${src.name} (${src.troops})?\n\nTotal: ${src.troops + tgt.troops} troops`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setMergeSourceId(null) },
        { text: "Merge", onPress: () => { mergeArmies(mergeSourceId, armyId); setMergeSourceId(null); } },
      ]
    );
  }, [mergeSourceId, state.armies, mergeArmies]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a0f0f', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <View style={s.headerLeft}><Swords size={22} color={Colors.crimson.bright} /><Text style={s.title}>Your Armies</Text></View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-armies"><X size={22} color={Colors.text.secondary} /></TouchableOpacity>
      </View>
      <View style={s.summaryRow}>
        <View style={s.summaryCard}><Text style={s.summaryValue}>{state.armies.length}</Text><Text style={s.summaryLabel}>Armies</Text></View>
        <View style={s.summaryCard}><Text style={s.summaryValue}>{totalTroops}</Text><Text style={s.summaryLabel}>Total Troops</Text></View>
        <View style={s.summaryCard}><Text style={[s.summaryValue, { color: moraleColor }]}>{avgMorale}%</Text><Text style={s.summaryLabel}>Avg Morale</Text></View>
      </View>

      <TouchableOpacity
        style={s.tacticBanner}
        onPress={() => setShowTactics(!showTactics)}
        activeOpacity={0.7}
      >
        <View style={s.tacticBannerLeft}>
          <Target size={16} color={Colors.gold.bright} />
          <Text style={s.tacticBannerLabel}>Battle Tactic:</Text>
          <Text style={s.tacticBannerName}>{activeTactic.icon} {activeTactic.name}</Text>
        </View>
        <View style={s.winRateBox}>
          <Text style={[s.winRateText, { color: winColor }]}>~{winProbability}% win</Text>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {showTactics && (
          <View style={s.tacticsSection}>
            <Text style={s.tacticsSectionTitle}>⚔️ Combat Tactics</Text>
            <Text style={s.tacticsHint}>Select a tactic to change your battle strategy. This affects all battles.</Text>
            {COMBAT_TACTICS.map(tactic => (
              <TacticCard
                key={tactic.id}
                tactic={tactic}
                isActive={state.activeTactic === tactic.id}
                onSelect={() => handleTacticSelect(tactic.id)}
              />
            ))}
          </View>
        )}

        {state.armies.length >= 2 && (
          <TouchableOpacity
            style={[s.mergeBanner, mergeSourceId ? s.mergeBannerActive : null]}
            onPress={() => setMergeSourceId(mergeSourceId ? null : undefined as unknown as string)}
            activeOpacity={0.7}
          >
            <Merge size={16} color={mergeSourceId ? Colors.gold.bright : Colors.status.info} />
            <Text style={[s.mergeBannerText, mergeSourceId ? { color: Colors.gold.bright } : null]}>
              {mergeSourceId ? 'Select second army to merge (tap again to cancel)' : 'Tap to start merging armies'}
            </Text>
          </TouchableOpacity>
        )}

        {state.armies.length === 0 ? (
          <View style={s.emptyState}><Text style={s.emptyIcon}>⚔️</Text><Text style={s.emptyTitle}>No Armies</Text><Text style={s.emptyDesc}>Visit a province to recruit soldiers.</Text></View>
        ) : state.armies.map((army, idx) => (
          <TouchableOpacity
            key={army.id}
            activeOpacity={mergeSourceId ? 0.7 : 1}
            onPress={mergeSourceId ? () => handleMerge(army.id) : undefined}
            style={mergeSourceId === army.id ? s.mergeSelected : undefined}
          >
            <ArmyCard
              army={army}
              provinces={state.provinces}
              onMove={handleMove}
              onAttack={handleAttack}
              onReinforce={handleReinforce}
              onDisband={handleDisband}
              index={idx}
              resources={{ gold: state.resources.gold, military: state.resources.military }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 18, fontWeight: "800" as const, color: Colors.text.primary },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  tacticBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.gold.dim + '40' },
  tacticBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tacticBannerLabel: { fontSize: 11, color: Colors.text.dim },
  tacticBannerName: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  winRateBox: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  winRateText: { fontSize: 11, fontWeight: "700" as const },
  tacticsSection: { marginHorizontal: 16, marginBottom: 12 },
  tacticsSectionTitle: { fontSize: 14, fontWeight: "700" as const, color: Colors.gold.dim, marginBottom: 4 },
  tacticsHint: { fontSize: 11, color: Colors.text.dim, marginBottom: 10 },
  tacticCard: { backgroundColor: Colors.bg.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border.primary },
  tacticCardActive: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + '10' },
  tacticHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tacticIcon: { fontSize: 22 },
  tacticInfo: { flex: 1, gap: 2 },
  tacticName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  tacticDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 15 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold.bright },
  modRow: { flexDirection: "row", marginTop: 10, gap: 6 },
  modItem: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 6, padding: 6, alignItems: "center", gap: 2 },
  modLabel: { fontSize: 8, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 0.5 },
  modValue: { fontSize: 12, fontWeight: "700" as const },
  armyCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  armyHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  armyIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.military.blood + "30", alignItems: "center", justifyContent: "center" },
  armyInfo: { flex: 1, gap: 2 },
  armyName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  armyCommander: { fontSize: 11, color: Colors.text.secondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.5 },
  armyStats: { marginTop: 12, gap: 10 },
  troopBar: { gap: 4 },
  troopLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  troopLabel: { fontSize: 11, color: Colors.text.secondary },
  troopValue: { fontSize: 12, fontWeight: "700" as const, color: Colors.text.primary },
  barBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  locationText: { fontSize: 12, color: Colors.text.dim },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  moveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.status.info + '40', backgroundColor: Colors.status.info + '10' },
  moveBtnText: { fontSize: 13, fontWeight: "600" as const, color: Colors.status.info },
  moveMenu: { marginTop: 10, backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 10, gap: 4 },
  moveMenuTitle: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" as const },
  moveOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: Colors.bg.card },
  moveOptionEnemy: { borderWidth: 1, borderColor: Colors.crimson.dark + '40' },
  moveOptionName: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.primary },
  attackBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  attackBadgeText: { fontSize: 11, fontWeight: "700" as const, color: Colors.crimson.bright },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, maxWidth: 250 },
  manageRow: { flexDirection: "row" as const, gap: 8, marginTop: 8 },
  reinforceBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: Colors.status.success + '40', backgroundColor: Colors.status.success + '10' },
  reinforceBtnText: { fontSize: 12, fontWeight: "600" as const, color: Colors.status.success },
  disbandBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: Colors.crimson.bright + '40', backgroundColor: Colors.crimson.bright + '10' },
  disbandBtnText: { fontSize: 12, fontWeight: "600" as const, color: Colors.crimson.bright },
  btnDisabled: { opacity: 0.4 },
  mergeBanner: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginHorizontal: 16, marginBottom: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.status.info + '10', borderWidth: 1, borderColor: Colors.status.info + '30' },
  mergeBannerActive: { backgroundColor: Colors.gold.dim + '15', borderColor: Colors.gold.dim + '40' },
  mergeBannerText: { fontSize: 12, fontWeight: "600" as const, color: Colors.status.info },
  mergeSelected: { borderRadius: 14, borderWidth: 2, borderColor: Colors.gold.bright, marginHorizontal: 14, marginBottom: 2 },
});
