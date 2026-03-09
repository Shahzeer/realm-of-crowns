import React, { useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Sparkles, Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { FAITH_ACTIONS } from "@/mocks/gameData";

export default function FaithScreen() {
  console.log("[RealmOfCrowns] Faith render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, useFaithAction } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleAction = useCallback((actionId: string) => {
    const action = FAITH_ACTIONS.find(a => a.id === actionId);
    if (!action) return;
    const cooldown = state.faithCooldowns[actionId] ?? 0;
    if (cooldown > 0) {
      Alert.alert("On Cooldown", `Wait ${cooldown} more turns.`);
      return;
    }
    if (state.resources.faith < action.faithCost) {
      Alert.alert("Insufficient Faith", `Need ${action.faithCost} faith.`);
      return;
    }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    useFaithAction(actionId);
  }, [state.faithCooldowns, state.resources.faith, useFaithAction]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a0f20', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Sparkles size={22} color={Colors.faith.light} />
          <Text style={s.title}>Faith & Divine</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-faith">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={s.faithDisplay}>
        <LinearGradient colors={[Colors.faith.purple + '30', Colors.bg.card]} style={s.faithDisplayBg}>
          <Text style={s.faithIcon}>🙏</Text>
          <Text style={s.faithValue}>{state.resources.faith}</Text>
          <Text style={s.faithLabel}>Faith Points</Text>
          <Text style={s.faithPerTurn}>+{state.resources.faithPerTurn}/turn</Text>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={s.sectionTitle}>Divine Actions</Text>
          {FAITH_ACTIONS.map((action, idx) => {
            const cooldown = state.faithCooldowns[action.id] ?? 0;
            const canAfford = state.resources.faith >= action.faithCost;
            const isAvailable = cooldown === 0 && canAfford;

            return (
              <FaithCard
                key={action.id}
                action={action}
                cooldown={cooldown}
                canAfford={canAfford}
                isAvailable={isAvailable}
                onPress={() => handleAction(action.id)}
                index={idx}
              />
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function FaithCard({ action, cooldown, canAfford, isAvailable, onPress, index }: {
  action: { id: string; name: string; description: string; icon: string; faithCost: number; effects: string; cooldown: number };
  cooldown: number;
  canAfford: boolean;
  isAvailable: boolean;
  onPress: () => void;
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

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[s.actionCard, !isAvailable && s.actionCardDisabled]}>
        <View style={s.actionHeader}>
          <View style={s.actionIconBox}>
            <Text style={s.actionIcon}>{action.icon}</Text>
          </View>
          <View style={s.actionInfo}>
            <Text style={s.actionName}>{action.name}</Text>
            <Text style={s.actionDesc}>{action.description}</Text>
          </View>
          <View style={[s.costBadge, !canAfford && { borderColor: Colors.crimson.bright + '40' }]}>
            <Text style={[s.costText, !canAfford && { color: Colors.crimson.bright }]}>{action.faithCost}🙏</Text>
          </View>
        </View>
        <Text style={s.actionEffect}>{action.effects}</Text>
        {cooldown > 0 ? (
          <View style={s.cooldownBar}>
            <Clock size={12} color={Colors.text.dim} />
            <Text style={s.cooldownText}>{cooldown} turns cooldown remaining</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.activateBtn, !isAvailable && s.activateBtnDisabled]}
            onPress={onPress}
            disabled={!isAvailable}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color={isAvailable ? Colors.faith.light : Colors.text.dim} />
            <Text style={[s.activateBtnText, !isAvailable && { color: Colors.text.dim }]}>Invoke</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  faithDisplay: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, overflow: "hidden" },
  faithDisplayBg: { alignItems: "center", paddingVertical: 24, gap: 4 },
  faithIcon: { fontSize: 36, marginBottom: 4 },
  faithValue: { fontSize: 36, fontWeight: "900" as const, color: Colors.faith.light },
  faithLabel: { fontSize: 12, color: Colors.text.secondary, textTransform: "uppercase" as const, letterSpacing: 1 },
  faithPerTurn: { fontSize: 14, fontWeight: "600" as const, color: Colors.faith.purple, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.faith.light, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  actionCardDisabled: { opacity: 0.6 },
  actionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.faith.purple + '15', alignItems: "center", justifyContent: "center" },
  actionIcon: { fontSize: 22 },
  actionInfo: { flex: 1, gap: 2 },
  actionName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  actionDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 15 },
  costBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.faith.purple + '40', backgroundColor: Colors.faith.purple + '10' },
  costText: { fontSize: 12, fontWeight: "700" as const, color: Colors.faith.light },
  actionEffect: { fontSize: 12, color: Colors.faith.light, marginTop: 8, fontWeight: "600" as const },
  cooldownBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.bg.tertiary },
  cooldownText: { fontSize: 12, color: Colors.text.dim },
  activateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.faith.purple + '40', backgroundColor: Colors.faith.purple + '10' },
  activateBtnDisabled: { borderColor: Colors.border.primary, backgroundColor: Colors.bg.tertiary },
  activateBtnText: { fontSize: 13, fontWeight: "600" as const, color: Colors.faith.light },
});
