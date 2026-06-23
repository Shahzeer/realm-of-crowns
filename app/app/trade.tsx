import React, { useCallback, useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, ArrowRightLeft, Clock, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { TRADE_TEMPLATES } from "@/mocks/gameData";

export default function TradeScreen() {
  console.log("[RealmOfCrowns] Trade render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, proposeTrade } = useGame();
  const [selectedKingdom, setSelectedKingdom] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const tradeableKingdoms = state.kingdoms.filter(k => k.attitude !== 'war' && k.relation > -20);

  const handleTrade = useCallback((give: Record<string, number>, receive: Record<string, number>) => {
    if (!selectedKingdom) {
      Alert.alert("Select Kingdom", "Choose a kingdom to trade with first.");
      return;
    }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    proposeTrade(selectedKingdom, give, receive, 5);
  }, [selectedKingdom, proposeTrade]);

  const kingdom = selectedKingdom ? state.kingdoms.find(k => k.id === selectedKingdom) : null;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a1812', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <ArrowRightLeft size={22} color={Colors.gold.bright} />
          <Text style={s.title}>Trade</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-trade">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {state.activeTrades.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Active Trade Deals</Text>
              {state.activeTrades.map(trade => (
                <View key={trade.id} style={s.activeTradeCard}>
                  <View style={s.activeTradeHeader}>
                    <CheckCircle size={16} color={Colors.status.success} />
                    <Text style={s.activeTradeName}>{trade.kingdomName}</Text>
                    <View style={s.tradeDuration}>
                      <Clock size={12} color={Colors.text.dim} />
                      <Text style={s.tradeDurationText}>{trade.turnsRemaining}t left</Text>
                    </View>
                  </View>
                  <View style={s.tradeFlow}>
                    <View style={s.tradeFlowSide}>
                      <Text style={s.tradeFlowLabel}>You Give</Text>
                      {Object.entries(trade.give).map(([k, v]) => (
                        <Text key={k} style={s.tradeFlowCost}>-{v} {k}/turn</Text>
                      ))}
                    </View>
                    <ArrowRightLeft size={16} color={Colors.gold.dim} />
                    <View style={s.tradeFlowSide}>
                      <Text style={s.tradeFlowLabel}>You Receive</Text>
                      {Object.entries(trade.receive).map(([k, v]) => (
                        <Text key={k} style={s.tradeFlowGain}>+{v} {k}/turn</Text>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          <Text style={s.sectionTitle}>Select Trading Partner</Text>
          {tradeableKingdoms.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🚫</Text>
              <Text style={s.emptyTitle}>No Available Partners</Text>
              <Text style={s.emptyDesc}>Improve relations or end wars to enable trade.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kingdomScroll}>
              {tradeableKingdoms.map(k => {
                const isSelected = selectedKingdom === k.id;
                return (
                  <TouchableOpacity
                    key={k.id}
                    style={[s.kingdomChip, isSelected && { borderColor: k.color, backgroundColor: k.color + '20' }]}
                    onPress={() => {
                      if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
                      setSelectedKingdom(k.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[s.kingdomDot, { backgroundColor: k.color }]} />
                    <Text style={[s.kingdomChipText, isSelected && { color: Colors.text.primary }]}>{k.name}</Text>
                    <Text style={s.kingdomRelation}>{k.relation > 0 ? '+' : ''}{k.relation}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {kingdom && (
            <View style={s.partnerInfo}>
              <Text style={s.partnerName}>Trading with {kingdom.name}</Text>
              <Text style={s.partnerDetail}>
                Relations: {kingdom.relation > 0 ? '+' : ''}{kingdom.relation} • {kingdom.attitude}
              </Text>
              <Text style={s.acceptHint}>
                Accept chance: ~{Math.min(95, Math.max(5, 40 + kingdom.relation + (kingdom.attitude === 'allied' ? 20 : kingdom.attitude === 'friendly' ? 10 : 0)))}%
              </Text>
            </View>
          )}

          <Text style={s.sectionTitle}>Trade Offers (5 turns each)</Text>
          <View style={s.tradeGrid}>
            {TRADE_TEMPLATES.map((template, idx) => {
              const giveKey = Object.keys(template.give)[0];
              const giveVal = Object.values(template.give)[0];
              const receiveKey = Object.keys(template.receive)[0];
              const receiveVal = Object.values(template.receive)[0];
              const canAfford = (state.resources as unknown as Record<string, number>)[giveKey] >= giveVal;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.tradeOption, !canAfford && s.tradeOptionDisabled, !selectedKingdom && s.tradeOptionDisabled]}
                  onPress={() => handleTrade(template.give as unknown as Record<string, number>, template.receive as unknown as Record<string, number>)}
                  disabled={!canAfford || !selectedKingdom}
                  activeOpacity={0.7}
                >
                  <Text style={s.tradeLabel}>{template.label}</Text>
                  <View style={s.tradeDetails}>
                    <Text style={s.tradeGive}>-{giveVal} {giveKey}/turn</Text>
                    <ArrowRightLeft size={12} color={Colors.gold.dim} />
                    <Text style={s.tradeReceive}>+{receiveVal} {receiveKey}/turn</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  activeTradeCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.status.success + '30' },
  activeTradeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeTradeName: { flex: 1, fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  tradeDuration: { flexDirection: "row", alignItems: "center", gap: 4 },
  tradeDurationText: { fontSize: 11, color: Colors.text.dim },
  tradeFlow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 },
  tradeFlowSide: { flex: 1, alignItems: "center", gap: 4 },
  tradeFlowLabel: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 0.5 },
  tradeFlowCost: { fontSize: 12, color: Colors.crimson.bright },
  tradeFlowGain: { fontSize: 12, color: Colors.status.success },
  kingdomScroll: { paddingHorizontal: 16, gap: 8 },
  kingdomChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary },
  kingdomDot: { width: 8, height: 8, borderRadius: 4 },
  kingdomChipText: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.secondary },
  kingdomRelation: { fontSize: 11, fontWeight: "700" as const, color: Colors.text.dim },
  partnerInfo: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.bg.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.gold.dim + '30', gap: 4 },
  partnerName: { fontSize: 15, fontWeight: "700" as const, color: Colors.gold.bright },
  partnerDetail: { fontSize: 12, color: Colors.text.secondary },
  acceptHint: { fontSize: 11, color: Colors.status.info },
  tradeGrid: { paddingHorizontal: 16, gap: 8 },
  tradeOption: { backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  tradeOptionDisabled: { opacity: 0.4 },
  tradeLabel: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary, marginBottom: 6 },
  tradeDetails: { flexDirection: "row", alignItems: "center", gap: 10 },
  tradeGive: { fontSize: 12, color: Colors.crimson.bright },
  tradeReceive: { fontSize: 12, color: Colors.status.success },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, color: Colors.text.secondary, textAlign: "center" as const },
});
