import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Swords, Trophy, Skull, Shield } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { BattleResult } from "@/types/game";

function BattleCard({ battle, index }: { battle: BattleResult; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true }),
    ]).start();

    if (index === 0) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, delay: 300, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  const isVictory = battle.conquered;
  const borderColor = isVictory ? Colors.status.success : Colors.crimson.bright;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }}>
      <View style={[bt.battleCard, { borderColor: borderColor + '40' }]}>
        <View style={bt.battleHeader}>
          <View style={[bt.resultBadge, { backgroundColor: isVictory ? Colors.status.success + '20' : Colors.crimson.bright + '20' }]}>
            {isVictory ? <Trophy size={16} color={Colors.status.success} /> : <Skull size={16} color={Colors.crimson.bright} />}
            <Text style={[bt.resultText, { color: isVictory ? Colors.status.success : Colors.crimson.bright }]}>
              {isVictory ? 'VICTORY' : 'DEFEAT'}
            </Text>
          </View>
          <Text style={bt.turnText}>Turn {battle.turn}</Text>
        </View>
        <Text style={bt.locationText}>⚔️ Battle of {battle.provinceName}</Text>
        <View style={bt.sidesRow}>
          <View style={bt.sideCard}>
            <Swords size={14} color={Colors.gold.bright} />
            <Text style={bt.sideName} numberOfLines={1}>{battle.attackerName}</Text>
            <Text style={bt.sideTroops}>{battle.attackerTroops} troops</Text>
            <Text style={bt.sideLosses}>-{battle.attackerLosses} lost</Text>
          </View>
          <View style={bt.vsBox}>
            <Text style={bt.vsText}>VS</Text>
          </View>
          <View style={bt.sideCard}>
            <Shield size={14} color={Colors.status.info} />
            <Text style={bt.sideName} numberOfLines={1}>{battle.defenderName}</Text>
            <Text style={bt.sideTroops}>{battle.defenderTroops} troops</Text>
            <Text style={bt.sideLosses}>-{battle.defenderLosses} lost</Text>
          </View>
        </View>
        {battle.conquered && (
          <View style={bt.conqueredBanner}>
            <Text style={bt.conqueredText}>🏴 Province Conquered!</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function BattlesScreen() {
  console.log("[RealmOfCrowns] Battles render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();

  const battles = [...state.battles].reverse();
  const victories = battles.filter(b => b.conquered).length;
  const defeats = battles.filter(b => !b.conquered).length;

  return (
    <View style={[bt.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a0f0f', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={bt.header}>
        <View style={bt.headerLeft}>
          <Swords size={22} color={Colors.crimson.bright} />
          <Text style={bt.title}>Battle History</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={bt.closeBtn} testID="close-battles">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      <View style={bt.summaryRow}>
        <View style={bt.summaryCard}>
          <Text style={bt.summaryValue}>{battles.length}</Text>
          <Text style={bt.summaryLabel}>Battles</Text>
        </View>
        <View style={bt.summaryCard}>
          <Text style={[bt.summaryValue, { color: Colors.status.success }]}>{victories}</Text>
          <Text style={bt.summaryLabel}>Victories</Text>
        </View>
        <View style={bt.summaryCard}>
          <Text style={[bt.summaryValue, { color: Colors.crimson.bright }]}>{defeats}</Text>
          <Text style={bt.summaryLabel}>Defeats</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {battles.length === 0 ? (
          <View style={bt.emptyState}>
            <Text style={bt.emptyIcon}>⚔️</Text>
            <Text style={bt.emptyTitle}>No Battles Yet</Text>
            <Text style={bt.emptyDesc}>Declare war or wait for enemies to attack. History will be written in blood.</Text>
          </View>
        ) : (
          battles.map((battle, idx) => (
            <BattleCard key={battle.id} battle={battle} index={idx} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const bt = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  battleCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1 },
  battleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  resultText: { fontSize: 12, fontWeight: "800" as const, letterSpacing: 1 },
  turnText: { fontSize: 11, color: Colors.text.dim },
  locationText: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary, marginBottom: 12 },
  sidesRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sideCard: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 10, alignItems: "center", gap: 4 },
  sideName: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.primary, textAlign: "center" as const },
  sideTroops: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  sideLosses: { fontSize: 11, color: Colors.crimson.bright },
  vsBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.primary, alignItems: "center", justifyContent: "center" },
  vsText: { fontSize: 10, fontWeight: "800" as const, color: Colors.gold.dim },
  conqueredBanner: { marginTop: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.status.success + '15', alignItems: "center" },
  conqueredText: { fontSize: 13, fontWeight: "700" as const, color: Colors.status.success },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, maxWidth: 280, lineHeight: 20 },
});
