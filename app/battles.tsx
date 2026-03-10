import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Swords, Trophy, Skull, Shield, Crown, ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { BattleResult } from "@/types/game";

const TITLE_COLORS: Record<string, string> = {
  'Glorious Victory': '#ffd700',
  'Against All Odds': '#ff9500',
  'Decisive Victory': Colors.status.success,
  'Hard-Won Victory': '#7bc96a',
  'Pyrrhic Victory': '#d29922',
  'Devastating Rout': Colors.crimson.bright,
  'Crushing Defeat': '#cc3333',
  'Narrow Defeat': '#d4774a',
  'Tactical Retreat': Colors.text.secondary,
};

const TITLE_ICONS: Record<string, string> = {
  'Glorious Victory': '🏆',
  'Against All Odds': '⚡',
  'Decisive Victory': '🗡️',
  'Hard-Won Victory': '⚔️',
  'Pyrrhic Victory': '💀',
  'Devastating Rout': '🔥',
  'Crushing Defeat': '💔',
  'Narrow Defeat': '🛡️',
  'Tactical Retreat': '🏳️',
};

function BattleCard({ battle, index }: { battle: BattleResult; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [expanded, setExpanded] = useState(index === 0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const isVictory = battle.winner === 'attacker';
  const borderColor = isVictory ? Colors.status.success : Colors.crimson.bright;
  const titleColor = battle.victoryTitle ? TITLE_COLORS[battle.victoryTitle] || Colors.text.primary : (isVictory ? Colors.status.success : Colors.crimson.bright);
  const titleIcon = battle.victoryTitle ? TITLE_ICONS[battle.victoryTitle] || '⚔️' : '⚔️';
  const ratio = battle.attackerTroops / Math.max(battle.defenderTroops, 1);
  const isHeroic = isVictory && ratio <= 0.75;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[bt.battleCard, { borderColor: borderColor + '40' }, isHeroic && bt.heroicCard]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
        testID={`battle-card-${battle.id}`}
      >
        {isHeroic && <LinearGradient colors={['#3a2a0a20', '#0d111700']} style={StyleSheet.absoluteFill} />}

        <View style={bt.battleHeader}>
          <View style={bt.titleRow}>
            <Text style={bt.titleIcon}>{titleIcon}</Text>
            <View style={bt.titleGroup}>
              {battle.victoryTitle && (
                <Text style={[bt.victoryTitle, { color: titleColor }]}>{battle.victoryTitle}</Text>
              )}
              <Text style={bt.locationText}>Battle of {battle.provinceName}</Text>
            </View>
          </View>
          <View style={bt.headerRight}>
            <Text style={bt.turnText}>Turn {battle.turn}</Text>
            {expanded ? <ChevronUp size={14} color={Colors.text.dim} /> : <ChevronDown size={14} color={Colors.text.dim} />}
          </View>
        </View>

        <View style={bt.sidesRow}>
          <View style={[bt.sideCard, isVictory && bt.winningSide]}>
            <Swords size={14} color={Colors.gold.bright} />
            <Text style={bt.sideName} numberOfLines={1}>{battle.attackerName}</Text>
            <Text style={bt.sideTroops}>{battle.attackerTroops.toLocaleString()}</Text>
            <Text style={bt.sideLosses}>-{battle.attackerLosses.toLocaleString()}</Text>
          </View>
          <View style={bt.vsBox}>
            <Text style={bt.vsText}>VS</Text>
          </View>
          <View style={[bt.sideCard, !isVictory && bt.winningSide]}>
            <Shield size={14} color={Colors.status.info} />
            <Text style={bt.sideName} numberOfLines={1}>{battle.defenderName}</Text>
            <Text style={bt.sideTroops}>{battle.defenderTroops.toLocaleString()}</Text>
            <Text style={bt.sideLosses}>-{battle.defenderLosses.toLocaleString()}</Text>
          </View>
        </View>

        {expanded && (
          <View style={bt.expandedSection}>
            {battle.narrative && (
              <View style={bt.narrativeBox}>
                <Text style={bt.narrativeQuote}>"</Text>
                <Text style={bt.narrativeText}>{battle.narrative}</Text>
              </View>
            )}

            <View style={bt.battleStatsRow}>
              <View style={bt.battleStatItem}>
                <Text style={bt.battleStatLabel}>Total Engaged</Text>
                <Text style={bt.battleStatValue}>{(battle.attackerTroops + battle.defenderTroops).toLocaleString()}</Text>
              </View>
              <View style={bt.battleStatItem}>
                <Text style={bt.battleStatLabel}>Total Fallen</Text>
                <Text style={[bt.battleStatValue, { color: Colors.crimson.bright }]}>{(battle.attackerLosses + battle.defenderLosses).toLocaleString()}</Text>
              </View>
              <View style={bt.battleStatItem}>
                <Text style={bt.battleStatLabel}>Casualty Rate</Text>
                <Text style={bt.battleStatValue}>{Math.round(((battle.attackerLosses + battle.defenderLosses) / Math.max(battle.attackerTroops + battle.defenderTroops, 1)) * 100)}%</Text>
              </View>
            </View>

            {(battle.attackerCommander || battle.defenderCommander) && (
              <View style={bt.commandersSection}>
                <Text style={bt.commandersTitle}>NOTABLE COMMANDERS</Text>
                {battle.attackerCommander && (
                  <View style={bt.commanderRow}>
                    <View style={bt.commanderIconBox}>
                      <Crown size={12} color={Colors.gold.bright} />
                    </View>
                    <View style={bt.commanderInfo}>
                      <Text style={bt.commanderName}>{battle.attackerCommander.name}</Text>
                      <Text style={bt.commanderRole}>{battle.attackerCommander.role} • {battle.attackerName}</Text>
                      {battle.attackerCommander.contribution ? (
                        <Text style={bt.commanderContribution}>"{battle.attackerCommander.contribution}"</Text>
                      ) : null}
                    </View>
                  </View>
                )}
                {battle.defenderCommander && (
                  <View style={bt.commanderRow}>
                    <View style={[bt.commanderIconBox, { backgroundColor: Colors.status.info + '15' }]}>
                      <Shield size={12} color={Colors.status.info} />
                    </View>
                    <View style={bt.commanderInfo}>
                      <Text style={bt.commanderName}>{battle.defenderCommander.name}</Text>
                      <Text style={bt.commanderRole}>{battle.defenderCommander.role} • {battle.defenderName}</Text>
                      {battle.defenderCommander.contribution ? (
                        <Text style={bt.commanderContribution}>"{battle.defenderCommander.contribution}"</Text>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            )}

            {battle.tacticUsed && (
              <View style={bt.tacticRow}>
                <Text style={bt.tacticLabel}>Tactic Used:</Text>
                <Text style={bt.tacticValue}>{battle.tacticUsed.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>
        )}

        {battle.conquered && (
          <View style={bt.conqueredBanner}>
            <Text style={bt.conqueredText}>🏴 Province Conquered!</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BattlesScreen() {
  console.log("[RealmOfCrowns] Battles render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();

  const battles = [...state.battles].reverse();
  const victories = battles.filter(b => b.winner === 'attacker').length;
  const defeats = battles.filter(b => b.winner === 'defender').length;
  const heroicVictories = battles.filter(b => b.winner === 'attacker' && (b.attackerTroops / Math.max(b.defenderTroops, 1)) <= 0.75).length;

  return (
    <View style={[bt.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a0f0f', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={bt.header}>
        <View style={bt.headerLeft}>
          <Swords size={22} color={Colors.crimson.bright} />
          <Text style={bt.title}>War Chronicle</Text>
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
        {heroicVictories > 0 && (
          <View style={[bt.summaryCard, { borderColor: '#ffd70030' }]}>
            <Text style={[bt.summaryValue, { color: '#ffd700' }]}>{heroicVictories}</Text>
            <Text style={bt.summaryLabel}>Heroic</Text>
          </View>
        )}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {battles.length === 0 ? (
          <View style={bt.emptyState}>
            <Text style={bt.emptyIcon}>⚔️</Text>
            <Text style={bt.emptyTitle}>No Battles Yet</Text>
            <Text style={bt.emptyDesc}>Declare war or wait for enemies to attack. History will be written in blood.</Text>
          </View>
        ) : (
          battles.map((battle, i) => (
            <BattleCard key={battle.id} battle={battle} index={i} />
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
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 18, fontWeight: "800" as const, color: Colors.text.primary },
  summaryLabel: { fontSize: 9, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2, letterSpacing: 0.5 },
  battleCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bg.card, borderRadius: 16, padding: 16, borderWidth: 1, overflow: "hidden" as const },
  heroicCard: { borderColor: '#ffd70040' },
  battleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  titleIcon: { fontSize: 24 },
  titleGroup: { flex: 1, gap: 2 },
  victoryTitle: { fontSize: 14, fontWeight: "800" as const, letterSpacing: 0.8 },
  locationText: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.secondary },
  headerRight: { alignItems: "flex-end", gap: 4 },
  turnText: { fontSize: 11, color: Colors.text.dim },
  sidesRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sideCard: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 10, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "transparent" },
  winningSide: { borderColor: Colors.gold.dim + '40' },
  sideName: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.primary, textAlign: "center" as const },
  sideTroops: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  sideLosses: { fontSize: 11, color: Colors.crimson.bright, fontWeight: "600" as const },
  vsBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg.primary, alignItems: "center", justifyContent: "center" },
  vsText: { fontSize: 9, fontWeight: "800" as const, color: Colors.gold.dim },
  expandedSection: { marginTop: 14, gap: 12 },
  narrativeBox: { backgroundColor: '#1a1812', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.gold.dim, position: 'relative' as const },
  narrativeQuote: { fontSize: 32, fontWeight: '800' as const, color: Colors.gold.dim + '40', position: 'absolute' as const, top: 4, left: 8, lineHeight: 36 },
  narrativeText: { fontSize: 13, color: Colors.parchment.dark, lineHeight: 21, fontStyle: "italic" as const, paddingLeft: 14 },
  battleStatsRow: { flexDirection: 'row' as const, gap: 8 },
  battleStatItem: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' as const },
  battleStatLabel: { fontSize: 8, fontWeight: '700' as const, color: Colors.text.dim, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 2 },
  battleStatValue: { fontSize: 13, fontWeight: '800' as const, color: Colors.text.primary },
  commandersSection: { gap: 8 },
  commandersTitle: { fontSize: 10, fontWeight: "800" as const, color: Colors.gold.dim, letterSpacing: 1.5, marginBottom: 2 },
  commanderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingLeft: 4 },
  commanderIconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gold.dim + '15', alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 2 },
  commanderInfo: { flex: 1, gap: 1 },
  commanderName: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  commanderRole: { fontSize: 10, fontWeight: "600" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  commanderContribution: { fontSize: 11, color: Colors.text.secondary, lineHeight: 16, marginTop: 2 },
  tacticRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tacticLabel: { fontSize: 11, color: Colors.text.dim },
  tacticValue: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.primary, textTransform: "capitalize" as const },
  conqueredBanner: { marginTop: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.status.success + '15', alignItems: "center" },
  conqueredText: { fontSize: 13, fontWeight: "700" as const, color: Colors.status.success },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, maxWidth: 280, lineHeight: 20 },
});
