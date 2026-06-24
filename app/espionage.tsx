import React, { useCallback, useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Eye, Clock, Target, MapPin } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { SPY_MISSIONS } from "@/mocks/gameData";

export default function EspionageScreen() {
  console.log("[RealmOfCrowns] Espionage render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { provinceId, kingdomId, mode } = useLocalSearchParams<{ provinceId?: string; kingdomId?: string; mode?: string }>();
  const { state, startSpyMission, visibilityMap } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<'kingdom' | 'undiscovered'>('kingdom');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (provinceId && mode === 'undiscovered') {
      setTargetMode('undiscovered');
      setSelectedTarget(provinceId);
    } else if (kingdomId) {
      setTargetMode('kingdom');
      setSelectedTarget(kingdomId);
    }
  }, [provinceId, kingdomId, mode]);

  const spymaster = state.council.find(c => c.role === 'spymaster');
  const intrigueBonus = Math.max(0, (state.ruler.intrigue - 10) + ((spymaster?.skill ?? 0) - 10));

  const handleMission = useCallback((missionId: string) => {
    const mission = SPY_MISSIONS.find(m => m.id === missionId);
    if (!mission) return;

    if (state.activeSpyMission) {
      Alert.alert("Mission Active", `A spy mission is already in progress. Wait ${state.activeSpyMission.turnsRemaining} turns.`);
      return;
    }
    if (state.resources.gold < mission.cost) {
      Alert.alert("Insufficient Gold", `Need ${mission.cost} gold.`);
      return;
    }

    let targetId = selectedTarget;
    if (!targetId) {
      Alert.alert("Select Target", "Choose a target first.");
      return;
    }

    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    const isUndiscovered = targetMode === 'undiscovered';
    startSpyMission(missionId, targetId, isUndiscovered);
  }, [state.activeSpyMission, state.resources.gold, selectedTarget, startSpyMission, targetMode]);

  const targetKingdoms = state.kingdoms.filter(k => k.attitude !== 'allied');
  const undiscoveredProvinces = state.provinces.filter(p => {
    const isVisible = visibilityMap[p.id];
    return !isVisible && p.owner !== 'player';
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#0f0f1a', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Eye size={22} color="#8b5cf6" />
          <Text style={s.title}>Espionage</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-espionage">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{state.ruler.intrigue}</Text>
          <Text style={s.summaryLabel}>Intrigue</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{spymaster?.skill ?? 0}</Text>
          <Text style={s.summaryLabel}>Spymaster</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, { color: '#8b5cf6' }]}>+{Math.floor(intrigueBonus)}%</Text>
          <Text style={s.summaryLabel}>Bonus</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {state.activeSpyMission && (
            <View style={s.activeMission}>
              <View style={s.activeMissionHeader}>
                <Clock size={16} color="#8b5cf6" />
                <Text style={s.activeMissionTitle}>Mission In Progress</Text>
              </View>
              <Text style={s.activeMissionName}>
                {SPY_MISSIONS.find(m => m.id === state.activeSpyMission?.missionId)?.name ?? 'Unknown'}
              </Text>
              <View style={s.activeMissionBarBg}>
                <View style={[s.activeMissionBarFill, {
                  width: `${((state.activeSpyMission.totalTurns - state.activeSpyMission.turnsRemaining) / state.activeSpyMission.totalTurns) * 100}%`
                }]} />
              </View>
              <Text style={s.activeMissionProgress}>{state.activeSpyMission.turnsRemaining} turns remaining</Text>
            </View>
          )}

          <Text style={s.sectionTitle}>Select Target</Text>
          <View style={s.targetModeRow}>
            <TouchableOpacity
              style={[s.targetModeBtn, targetMode === 'kingdom' && s.targetModeBtnActive]}
              onPress={() => { setTargetMode('kingdom'); setSelectedTarget(null); }}
              activeOpacity={0.7}
            >
              <Eye size={14} color={targetMode === 'kingdom' ? '#8b5cf6' : Colors.text.dim} />
              <Text style={[s.targetModeBtnText, targetMode === 'kingdom' && s.targetModeBtnTextActive]}>Kingdoms</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.targetModeBtn, targetMode === 'undiscovered' && s.targetModeBtnActive]}
              onPress={() => { setTargetMode('undiscovered'); setSelectedTarget(null); }}
              activeOpacity={0.7}
            >
              <MapPin size={14} color={targetMode === 'undiscovered' ? '#8b5cf6' : Colors.text.dim} />
              <Text style={[s.targetModeBtnText, targetMode === 'undiscovered' && s.targetModeBtnTextActive]}>Undiscovered</Text>
            </TouchableOpacity>
          </View>

          {targetMode === 'kingdom' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.targetScroll}>
              {targetKingdoms.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={[s.targetChip, selectedTarget === k.id && { borderColor: k.color, backgroundColor: k.color + '20' }]}
                  onPress={() => setSelectedTarget(k.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.targetDot, { backgroundColor: k.color }]} />
                  <Text style={[s.targetChipText, selectedTarget === k.id && { color: Colors.text.primary }]}>{k.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={s.undiscoveredNote}>
                <Text style={s.undiscoveredNoteText}>Spying on undiscovered regions costs 2 extra turns</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.targetScroll}>
                {undiscoveredProvinces.length === 0 ? (
                  <View style={s.emptyTarget}>
                    <Text style={s.emptyTargetText}>All regions discovered</Text>
                  </View>
                ) : (
                  undiscoveredProvinces.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.targetChip, selectedTarget === p.id && { borderColor: '#8b5cf6', backgroundColor: '#8b5cf620' }]}
                      onPress={() => setSelectedTarget(p.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.targetDot, { backgroundColor: '#4a4d58' }]} />
                      <Text style={[s.targetChipText, selectedTarget === p.id && { color: Colors.text.primary }]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </>
          )}

          <Text style={s.sectionTitle}>Spy Missions</Text>
          {SPY_MISSIONS.map((mission, _idx) => {
            const adjustedSuccess = Math.min(95, mission.successChance + intrigueBonus);
            const adjustedTurns = Math.max(1, mission.turnsToComplete - Math.floor(intrigueBonus / 5));
            const canAfford = state.resources.gold >= mission.cost;
            const isActive = !!state.activeSpyMission;

            const displayTurns = targetMode === 'undiscovered' ? adjustedTurns + 2 : adjustedTurns;
            const displaySuccess = targetMode === 'undiscovered' ? Math.max(10, adjustedSuccess - 10) : adjustedSuccess;

            return (
              <Animated.View key={mission.id} style={{ opacity: fadeAnim }}>
                <View style={[s.missionCard, isActive && s.missionCardDisabled]}>
                  <View style={s.missionHeader}>
                    <View style={s.missionIconBox}>
                      <Text style={s.missionIcon}>{mission.icon}</Text>
                    </View>
                    <View style={s.missionInfo}>
                      <Text style={s.missionName}>{mission.name}</Text>
                      <Text style={s.missionDesc}>{mission.description}</Text>
                    </View>
                  </View>
                  <View style={s.missionStats}>
                    <View style={s.missionStat}>
                      <Text style={s.missionStatLabel}>Cost</Text>
                      <Text style={[s.missionStatValue, !canAfford && { color: Colors.crimson.bright }]}>{mission.cost}g</Text>
                    </View>
                    <View style={s.missionStat}>
                      <Text style={s.missionStatLabel}>Time</Text>
                      <Text style={s.missionStatValue}>{displayTurns}t</Text>
                      {targetMode === 'undiscovered' && <Text style={s.missionStatPenalty}>+2</Text>}
                    </View>
                    <View style={s.missionStat}>
                      <Text style={s.missionStatLabel}>Success</Text>
                      <Text style={[s.missionStatValue, {
                        color: displaySuccess > 60 ? Colors.status.success : displaySuccess > 40 ? Colors.status.warning : Colors.crimson.bright
                      }]}>{Math.round(displaySuccess)}%</Text>
                    </View>
                  </View>
                  <Text style={s.missionEffect}>{mission.effects}</Text>
                  {targetMode === 'undiscovered' && (
                    <View style={s.undiscoveredPenaltyBadge}>
                      <Text style={s.undiscoveredPenaltyText}>Undiscovered target: +2 turns, -10% success</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.launchBtn, (!canAfford || isActive || !selectedTarget) && s.launchBtnDisabled]}
                    onPress={() => handleMission(mission.id)}
                    disabled={!canAfford || isActive || !selectedTarget}
                    activeOpacity={0.7}
                  >
                    <Target size={14} color={!canAfford || isActive || !selectedTarget ? Colors.text.dim : '#8b5cf6'} />
                    <Text style={[s.launchBtnText, (!canAfford || isActive || !selectedTarget) && { color: Colors.text.dim }]}>
                      Launch Mission
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
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
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: '#8b5cf6', textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  activeMission: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#8b5cf610', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#8b5cf630' },
  activeMissionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  activeMissionTitle: { fontSize: 12, fontWeight: "700" as const, color: '#8b5cf6', letterSpacing: 0.5 },
  activeMissionName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary, marginBottom: 8 },
  activeMissionBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  activeMissionBarFill: { height: "100%", borderRadius: 3, backgroundColor: '#8b5cf6' },
  activeMissionProgress: { fontSize: 11, color: Colors.text.secondary, marginTop: 4, textAlign: "right" as const },
  targetScroll: { paddingHorizontal: 16, gap: 8 },
  targetChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary },
  targetDot: { width: 8, height: 8, borderRadius: 4 },
  targetChipText: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.secondary },
  missionCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  missionCardDisabled: { opacity: 0.5 },
  missionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  missionIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#8b5cf615', alignItems: "center", justifyContent: "center" },
  missionIcon: { fontSize: 22 },
  missionInfo: { flex: 1, gap: 2 },
  missionName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  missionDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 15 },
  missionStats: { flexDirection: "row", marginTop: 10, gap: 8 },
  missionStat: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 8, padding: 8, alignItems: "center", gap: 2 },
  missionStatLabel: { fontSize: 9, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 0.5 },
  missionStatValue: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  missionEffect: { fontSize: 11, color: '#8b5cf6', marginTop: 8, fontWeight: "600" as const },
  launchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#8b5cf640', backgroundColor: '#8b5cf610' },
  launchBtnDisabled: { borderColor: Colors.border.primary, backgroundColor: Colors.bg.tertiary },
  launchBtnText: { fontSize: 13, fontWeight: "600" as const, color: '#8b5cf6' },
  targetModeRow: { flexDirection: "row" as const, paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  targetModeBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary },
  targetModeBtnActive: { borderColor: '#8b5cf640', backgroundColor: '#8b5cf610' },
  targetModeBtnText: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.dim },
  targetModeBtnTextActive: { color: '#8b5cf6' },
  undiscoveredNote: { marginHorizontal: 16, marginBottom: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#8b5cf610', borderWidth: 1, borderColor: '#8b5cf620' },
  undiscoveredNoteText: { fontSize: 11, fontWeight: "600" as const, color: '#8b5cf6', textAlign: "center" as const },
  undiscoveredPenaltyBadge: { marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#8b5cf610' },
  undiscoveredPenaltyText: { fontSize: 10, fontWeight: "600" as const, color: '#8b5cf6', textAlign: "center" as const },
  missionStatPenalty: { fontSize: 9, fontWeight: "800" as const, color: Colors.crimson.bright, position: "absolute" as const, top: -2, right: 2 },
  emptyTarget: { paddingVertical: 12, paddingHorizontal: 20 },
  emptyTargetText: { fontSize: 12, color: Colors.text.dim, fontStyle: "italic" as const },
});
