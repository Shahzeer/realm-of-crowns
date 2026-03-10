import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Users, Heart, Briefcase, Clock, ArrowUpCircle } from "lucide-react-native";
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

const TASKS: Record<string, string[]> = {
  marshal: ['Train armies (+Military)', 'Patrol borders (+Garrison)', 'Lead troops (Army morale)'],
  steward: ['Collect taxes (+Gold)', 'Develop province (+Dev)', 'Manage supplies (+Food)'],
  spymaster: ['Spy on rival kingdom', 'Counter espionage (+Security)', 'Scheme (+Intrigue)'],
  chaplain: ['Preach to masses (+Faith)', 'Bless armies (+Morale)', 'Tend to sick (+Health)'],
  chancellor: ['Improve relations (+Diplo)', 'Negotiate trade (+Gold)', 'Forge alliances'],
};

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
  const tasks = TASKS[councilor.role] || [];
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
            <Text style={cc.currentTaskLabel}>Current Task</Text>
            <Text style={[cc.currentTaskText, { color: roleColor }]}>{councilor.task}</Text>
          </View>
        )}

        <View style={cc.tasksArea}>
          <Text style={cc.tasksLabel}>Assign Task</Text>
          {tasks.map((task, idx) => (
            <TouchableOpacity
              key={idx}
              style={[cc.taskBtn, councilor.task === task && cc.taskBtnActive]}
              onPress={() => onAssignTask(task)}
              activeOpacity={0.7}
            >
              <Text style={[cc.taskBtnText, councilor.task === task && { color: roleColor }]}>{task}</Text>
            </TouchableOpacity>
          ))}
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
});
