import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Users, Heart, Briefcase, Clock, ArrowUpCircle, AlertTriangle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Councilor } from "@/types/game";

const ROLE_COLORS: Record<string, string> = {
  marshal: Colors.crimson.bright,
  steward: Colors.gold.bright,
  spymaster: '#8b5cf6',
  chaplain: Colors.faith.light,
  chancellor: Colors.status.info,
};

const ROLE_LABELS: Record<string, string> = {
  marshal: 'Marshal',
  steward: 'Steward',
  spymaster: 'Spymaster',
  chaplain: 'Chaplain',
  chancellor: 'Chancellor',
};

const TASK_KEYS: Record<string, string[]> = {
  marshal: ['Train armies', 'Patrol borders', 'Lead troops'],
  steward: ['Collect taxes', 'Develop province', 'Manage supplies'],
  spymaster: ['Spy on rival kingdom', 'Counter espionage', 'Scheme'],
  chaplain: ['Preach to masses', 'Bless armies', 'Tend to sick'],
  chancellor: ['Improve relations', 'Negotiate trade', 'Forge alliances', 'Fabricate Claim'],
};

function getTaskLabel(role: string, task: string, skill: number, loyalty: number): string {
  const loyaltyMod = loyalty > 70 ? 1.0 : loyalty > 50 ? 0.75 : 0.5;
  const taskBonus = Math.max(2, Math.floor(skill / 3));
  const passive = Math.max(1, Math.floor(skill / 6));
  switch (role) {
    case 'marshal':
      if (task === 'Train armies') return `Train armies  (+${Math.floor(taskBonus * loyaltyMod)} military/turn)`;
      if (task === 'Patrol borders') return `Patrol borders  (+${Math.max(8, Math.floor(skill * 2 * loyaltyMod))} garrison/turn)`;
      if (task === 'Lead troops') return `Lead troops  (+${Math.max(3, Math.floor(skill * 0.5 * loyaltyMod))} morale/turn)`;
      break;
    case 'steward':
      if (task === 'Collect taxes') return `Collect taxes  (+${Math.floor(taskBonus * 2 * loyaltyMod)} gold/turn)`;
      if (task === 'Develop province') return `Develop province  (+2 dev/turn)`;
      if (task === 'Manage supplies') return `Manage supplies  (+${Math.floor(taskBonus * 1.5 * loyaltyMod)} food/turn)`;
      break;
    case 'spymaster':
      if (task === 'Spy on rival kingdom') return `Spy on rival kingdom  (intel reports)`;
      if (task === 'Counter espionage') return `Counter espionage  (+${Math.floor(passive * loyaltyMod)} gold, blocks spies)`;
      if (task === 'Scheme') return `Scheme  (+${Math.floor(taskBonus * loyaltyMod)} gold/turn)`;
      break;
    case 'chaplain':
      if (task === 'Preach to masses') return `Preach to masses  (+${Math.floor(taskBonus * loyaltyMod)} faith/turn)`;
      if (task === 'Bless armies') return `Bless armies  (+${Math.max(2, Math.floor(skill * 0.4 * loyaltyMod))} morale/turn)`;
      if (task === 'Tend to sick') return `Tend to sick  (+${Math.floor(passive * 1.5 * loyaltyMod)} food/turn)`;
      break;
    case 'chancellor':
      if (task === 'Improve relations') return `Improve relations  (+${Math.max(2, Math.floor(skill * 0.5 * loyaltyMod))} relations/turn)`;
      if (task === 'Negotiate trade') return `Negotiate trade  (+${Math.floor(taskBonus * 1.5 * loyaltyMod)} gold/turn)`;
      if (task === 'Forge alliances') return `Forge alliances  (chance to deepen ties)`;
      if (task === 'Fabricate Claim') return `Fabricate Claim  (5 turns → Casus Belli on border province)`;
      break;
  }
  return task;
}

function CouncilorCard({ councilor, onAssignTask, onUpgrade, canUpgrade, index }: {
  councilor: Councilor;
  onAssignTask: (task: string) => void;
  onUpgrade: () => void;
  canUpgrade: boolean;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const roleColor = ROLE_COLORS[councilor.role] || Colors.text.secondary;
  const loyaltyColor = councilor.loyalty > 70 ? Colors.status.success : councilor.loyalty > 40 ? Colors.status.warning : Colors.status.danger;
  const betrayalRisk = councilor.loyalty < 20;
  const taskKeys = TASK_KEYS[councilor.role] || [];
  const isTraining = !!councilor.activeUpgrade;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={cc.card}>
        <View style={cc.cardHeader}>
          <View style={[cc.avatarBox, { backgroundColor: roleColor + '20' }]}>
            <Text style={cc.avatarText}>{councilor.avatar}</Text>
          </View>
          <View style={cc.cardInfo}>
            <Text style={cc.cardName}>{councilor.name}</Text>
            <Text style={[cc.cardRole, { color: roleColor }]}>{ROLE_LABELS[councilor.role]}</Text>
          </View>
          <View style={cc.statsCol}>
            <View style={cc.miniStat}>
              <Briefcase size={12} color={Colors.gold.dim} />
              <Text style={cc.miniStatText}>{councilor.skill}</Text>
            </View>
            <View style={cc.miniStat}>
              <Heart size={12} color={loyaltyColor} />
              <Text style={[cc.miniStatText, { color: loyaltyColor }]}>{councilor.loyalty}%</Text>
            </View>
          </View>
        </View>

        <View style={cc.traitRow}>
          <Text style={cc.traitIcon}>{councilor.trait.icon}</Text>
          <Text style={cc.traitName}>{councilor.trait.name}</Text>
          <Text style={cc.traitEffect}>{councilor.trait.effect}</Text>
        </View>

        <View style={cc.loyaltyBarBg}>
          <View style={[cc.loyaltyBarFill, { width: `${councilor.loyalty}%`, backgroundColor: loyaltyColor }]} />
        </View>

        {betrayalRisk && (
          <View style={cc.betrayalWarning}>
            <AlertTriangle size={12} color={Colors.crimson.bright} />
            <Text style={cc.betrayalText}>Betrayal risk! Loyalty dangerously low.</Text>
          </View>
        )}

        {isTraining && councilor.activeUpgrade && (
          <View style={[cc.trainingBar, { borderColor: roleColor + '40' }]}>
            <View style={cc.trainingHeader}>
              <Clock size={12} color={roleColor} />
              <Text style={[cc.trainingTitle, { color: roleColor }]}>Skill Training</Text>
              <Text style={cc.trainingTurns}>{councilor.activeUpgrade.turnsRemaining}t left</Text>
            </View>
            <View style={cc.trainingBarBg}>
              <View style={[cc.trainingBarFill, {
                width: `${((councilor.activeUpgrade.totalTurns - councilor.activeUpgrade.turnsRemaining) / councilor.activeUpgrade.totalTurns) * 100}%`,
                backgroundColor: roleColor
              }]} />
            </View>
            <Text style={cc.trainingDesc}>+2 skill on completion</Text>
          </View>
        )}

        {!isTraining && (
          <TouchableOpacity
            style={[cc.upgradeBtn, !canUpgrade && cc.upgradeBtnDisabled]}
            onPress={onUpgrade}
            disabled={!canUpgrade}
            activeOpacity={0.7}
          >
            <ArrowUpCircle size={14} color={canUpgrade ? roleColor : Colors.text.dim} />
            <Text style={[cc.upgradeBtnText, { color: canUpgrade ? roleColor : Colors.text.dim }]}>
              Train Skill (+2, 100g, 3 turns)
            </Text>
          </TouchableOpacity>
        )}

        {councilor.task && (
          <View style={[cc.currentTask, { borderColor: roleColor + '40' }]}>
            <Text style={cc.currentTaskLabel}>Active Task</Text>
            <Text style={[cc.currentTaskText, { color: roleColor }]}>
              {getTaskLabel(councilor.role, councilor.task, councilor.skill, councilor.loyalty)}
            </Text>
          </View>
        )}

        <View style={cc.tasksArea}>
          <Text style={cc.tasksLabel}>Assign Task</Text>
          {taskKeys.map((taskKey, idx) => {
            const isActive = !!councilor.task && (councilor.task === taskKey || councilor.task.startsWith(taskKey));
            const label = getTaskLabel(councilor.role, taskKey, councilor.skill, councilor.loyalty);
            return (
              <TouchableOpacity
                key={idx}
                style={[cc.taskBtn, isActive && cc.taskBtnActive]}
                onPress={() => onAssignTask(taskKey)}
                activeOpacity={0.7}
              >
                <Text style={[cc.taskBtnText, isActive && { color: roleColor }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

export default function CouncilScreen() {
  console.log("[RealmOfCrowns] Council render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, assignCouncilTask, startCouncilorUpgrade } = useGame();

  const handleAssign = useCallback((councilId: string, task: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    assignCouncilTask(councilId, task);
  }, [assignCouncilTask]);

  const handleUpgrade = useCallback((councilId: string) => {
    const councilor = state.council.find(c => c.id === councilId);
    if (!councilor) return;
    if (councilor.activeUpgrade) {
      Alert.alert("Already Training", `${councilor.name} is already training.`);
      return;
    }
    if (state.resources.gold < 100) {
      Alert.alert("Insufficient Gold", "Need 100 gold to begin training.");
      return;
    }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    startCouncilorUpgrade(councilId);
  }, [state.council, state.resources.gold, startCouncilorUpgrade]);

  const avgLoyalty = state.council.length > 0
    ? Math.round(state.council.reduce((sum, c) => sum + c.loyalty, 0) / state.council.length)
    : 0;
  const avgSkill = state.council.length > 0
    ? Math.round(state.council.reduce((sum, c) => sum + c.skill, 0) / state.council.length)
    : 0;

  return (
    <View style={[cc.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#141820', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={cc.header}>
        <View style={cc.headerLeft}>
          <Users size={22} color={Colors.gold.bright} />
          <Text style={cc.title}>Royal Council</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={cc.closeBtn} testID="close-council">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      <View style={cc.summaryRow}>
        <View style={cc.summaryCard}>
          <Text style={cc.summaryValue}>{state.council.length}</Text>
          <Text style={cc.summaryLabel}>Councilors</Text>
        </View>
        <View style={cc.summaryCard}>
          <Text style={cc.summaryValue}>{avgSkill}</Text>
          <Text style={cc.summaryLabel}>Avg Skill</Text>
        </View>
        <View style={cc.summaryCard}>
          <Text style={[cc.summaryValue, { color: avgLoyalty > 70 ? Colors.status.success : Colors.status.warning }]}>{avgLoyalty}%</Text>
          <Text style={cc.summaryLabel}>Avg Loyalty</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {state.council.map((councilor, idx) => (
          <CouncilorCard
            key={councilor.id}
            councilor={councilor}
            index={idx}
            canUpgrade={state.resources.gold >= 100 && !councilor.activeUpgrade}
            onAssignTask={(task) => handleAssign(councilor.id, task)}
            onUpgrade={() => handleUpgrade(councilor.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const cc = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border.primary },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24 },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  cardRole: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.5 },
  statsCol: { gap: 4 },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  miniStatText: { fontSize: 12, fontWeight: "700" as const, color: Colors.text.primary },
  traitRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  traitIcon: { fontSize: 16 },
  traitName: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.primary },
  traitEffect: { fontSize: 10, color: Colors.text.secondary, flex: 1 },
  loyaltyBarBg: { height: 3, borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden", marginTop: 8 },
  loyaltyBarFill: { height: "100%", borderRadius: 2 },
  trainingBar: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1, backgroundColor: Colors.bg.tertiary },
  trainingHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  trainingTitle: { fontSize: 12, fontWeight: "700" as const, flex: 1 },
  trainingTurns: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.dim },
  trainingBarBg: { height: 4, borderRadius: 2, backgroundColor: Colors.bg.primary, overflow: "hidden" },
  trainingBarFill: { height: "100%", borderRadius: 2 },
  trainingDesc: { fontSize: 10, color: Colors.text.dim, marginTop: 4 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border.primary, backgroundColor: Colors.bg.tertiary },
  upgradeBtnDisabled: { opacity: 0.5 },
  upgradeBtnText: { fontSize: 12, fontWeight: "600" as const },
  currentTask: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1, backgroundColor: Colors.bg.tertiary },
  currentTaskLabel: { fontSize: 9, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 1, marginBottom: 2 },
  currentTaskText: { fontSize: 13, fontWeight: "600" as const },
  tasksArea: { marginTop: 12 },
  tasksLabel: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" as const },
  taskBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.bg.tertiary, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: Colors.border.primary },
  taskBtnActive: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + '10' },
  taskBtnText: { fontSize: 12, color: Colors.text.secondary },
  betrayalWarning: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: Colors.crimson.dark + '25', borderWidth: 1, borderColor: Colors.crimson.bright + '40' },
  betrayalText: { fontSize: 11, fontWeight: "600" as const, color: Colors.crimson.bright, flex: 1 },
});
