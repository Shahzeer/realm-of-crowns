import React, { useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Gift, AlertTriangle, Handshake, Flame, Flag, DollarSign } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Kingdom } from "@/types/game";

function KingdomCard({ kingdom, onAction, index }: {
  kingdom: Kingdom;
  onAction: (id: string, action: 'gift' | 'threaten' | 'ally' | 'declare_war' | 'peace' | 'demand_tribute') => void;
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

  const getAttitudeColor = (attitude: string) => {
    switch (attitude) {
      case "friendly": case "allied": return Colors.status.success;
      case "neutral": return Colors.status.warning;
      case "hostile": return Colors.status.danger;
      case "war": return "#ff0000";
      default: return Colors.text.dim;
    }
  };

  const attColor = getAttitudeColor(kingdom.attitude);
  const relColor = kingdom.relation > 0 ? Colors.status.success : kingdom.relation < 0 ? Colors.status.danger : Colors.text.secondary;
  const isAtWar = kingdom.attitude === 'war';
  const totalArmyStrength = kingdom.armies.reduce((sum, a) => sum + a.troops, 0);
  const warScore = kingdom.warScore ?? 0;
  const canDemandTribute = isAtWar && warScore <= -30;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[d.kingdomCard, isAtWar && d.warCard]}>
        {isAtWar && (
          <View style={d.warStrip}>
            <Flame size={12} color="#ff4444" />
            <Text style={d.warStripText}>AT WAR</Text>
            <View style={d.warScoreBadge}>
              <Text style={[d.warScoreText, { color: warScore > 0 ? Colors.crimson.bright : warScore < 0 ? Colors.status.success : Colors.text.dim }]}>
                War Score: {warScore > 0 ? '+' : ''}{warScore}
              </Text>
            </View>
          </View>
        )}
        <View style={d.kingdomHeader}>
          <View style={[d.crest, { backgroundColor: kingdom.color + '30' }]}>
            <Text style={[d.crestLetter, { color: kingdom.color }]}>{kingdom.name.charAt(0)}</Text>
          </View>
          <View style={d.kingdomInfo}>
            <Text style={d.kingdomName}>{kingdom.name}</Text>
            <Text style={d.rulerName}>{kingdom.ruler.name} - {kingdom.ruler.dynasty}</Text>
          </View>
          <View style={[d.attBadge, { backgroundColor: attColor + '20' }]}>
            <Text style={[d.attText, { color: attColor }]}>{kingdom.attitude.toUpperCase()}</Text>
          </View>
        </View>
        <View style={d.detailRow}>
          <View style={d.detailItem}>
            <Text style={d.detailLabel}>Relations</Text>
            <Text style={[d.detailValue, { color: relColor }]}>{kingdom.relation > 0 ? '+' : ''}{kingdom.relation}</Text>
          </View>
          <View style={d.detailItem}>
            <Text style={d.detailLabel}>Armies</Text>
            <Text style={d.detailValue}>{totalArmyStrength}</Text>
          </View>
          <View style={d.detailItem}>
            <Text style={d.detailLabel}>Provinces</Text>
            <Text style={d.detailValue}>{kingdom.provinces.length}</Text>
          </View>
        </View>
        {kingdom.allyOf && kingdom.allyOf.length > 0 && (
          <View style={d.allyInfo}>
            <Text style={d.allyLabel}>Allied with other kingdoms</Text>
          </View>
        )}
        <View style={d.rulerStats}>
          <Text style={d.rulerStatsLabel}>Ruler Stats:</Text>
          <View style={d.rulerStatRow}>
            <Text style={d.rulerStat}>🗣️{kingdom.ruler.diplomacy}</Text>
            <Text style={d.rulerStat}>⚔️{kingdom.ruler.martial}</Text>
            <Text style={d.rulerStat}>💰{kingdom.ruler.stewardship}</Text>
            <Text style={d.rulerStat}>🗡️{kingdom.ruler.intrigue}</Text>
          </View>
        </View>
        <View style={d.actionRow}>
          {!isAtWar ? (
            <>
              <TouchableOpacity style={[d.actionBtn, d.giftBtn]} onPress={() => onAction(kingdom.id, 'gift')} activeOpacity={0.7}>
                <Gift size={14} color={Colors.gold.bright} /><Text style={d.giftText}>Gift (100g)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[d.actionBtn, d.threatenBtn]} onPress={() => onAction(kingdom.id, 'threaten')} activeOpacity={0.7}>
                <AlertTriangle size={14} color={Colors.crimson.bright} /><Text style={d.threatenText}>Threaten</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[d.actionBtn, d.allyBtn]} onPress={() => onAction(kingdom.id, 'ally')} activeOpacity={0.7}>
                <Handshake size={14} color={Colors.status.info} /><Text style={d.allyText}>Ally (200g)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[d.actionBtn, d.peaceBtn]} onPress={() => onAction(kingdom.id, 'peace')} activeOpacity={0.7}>
                <Flag size={14} color={Colors.status.success} /><Text style={d.peaceText}>Peace (150g)</Text>
              </TouchableOpacity>
              {canDemandTribute && (
                <TouchableOpacity style={[d.actionBtn, d.tributeBtn]} onPress={() => onAction(kingdom.id, 'demand_tribute')} activeOpacity={0.7}>
                  <DollarSign size={14} color={Colors.gold.bright} /><Text style={d.tributeText}>Demand Tribute</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        {!isAtWar && kingdom.attitude !== 'allied' && (
          <TouchableOpacity style={d.warBtn} onPress={() => onAction(kingdom.id, 'declare_war')} activeOpacity={0.7}>
            <Flame size={14} color="#ff4444" /><Text style={d.warBtnText}>Declare War</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function DiplomacyScreen() {
  console.log("[RealmOfCrowns] Diplomacy render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, sendDiplomacy, activeWars } = useGame();

  const handleAction = useCallback((kingdomId: string, action: 'gift' | 'threaten' | 'ally' | 'declare_war' | 'peace' | 'demand_tribute') => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }

    if (action === 'declare_war') {
      const kingdom = state.kingdoms.find(k => k.id === kingdomId);
      Alert.alert(
        "Declare War",
        `Are you sure you want to declare war on ${kingdom?.name ?? 'this kingdom'}? This will severely damage relations.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Declare War!", style: "destructive", onPress: () => sendDiplomacy(kingdomId, action) },
        ]
      );
      return;
    }

    const costs: Record<string, number> = { gift: 100, threaten: 0, ally: 200, peace: 150, demand_tribute: 0 };
    if (state.resources.gold < (costs[action] || 0)) {
      Alert.alert("Insufficient Gold", `You need ${costs[action]} gold.`);
      return;
    }
    sendDiplomacy(kingdomId, action);
  }, [sendDiplomacy, state.resources.gold, state.kingdoms]);

  const allies = state.kingdoms.filter(k => k.attitude === 'allied');

  return (
    <View style={[d.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#161820', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={d.header}>
        <View style={d.headerLeft}>
          <GlobeIcon size={22} color={Colors.gold.bright} />
          <Text style={d.title}>Diplomacy</Text>
          {activeWars.length > 0 && (
            <View style={d.warCountBadge}><Text style={d.warCountText}>{activeWars.length} war{activeWars.length > 1 ? 's' : ''}</Text></View>
          )}
          {allies.length > 0 && (
            <View style={d.allyCountBadge}><Text style={d.allyCountText}>{allies.length} ally</Text></View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={d.closeBtn} testID="close-diplomacy"><X size={22} color={Colors.text.secondary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {state.kingdoms.map((kingdom, idx) => (
          <KingdomCard key={kingdom.id} kingdom={kingdom} onAction={handleAction} index={idx} />
        ))}
      </ScrollView>
    </View>
  );
}

function GlobeIcon({ size, color }: { size: number; color: string }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: size * 0.5, color }}>🌍</Text></View>;
}

const d = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  warCountBadge: { backgroundColor: '#ff000020', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  warCountText: { fontSize: 10, fontWeight: "700" as const, color: '#ff4444' },
  allyCountBadge: { backgroundColor: Colors.status.success + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  allyCountText: { fontSize: 10, fontWeight: "700" as const, color: Colors.status.success },
  kingdomCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border.primary },
  warCard: { borderColor: '#ff000040' },
  warStrip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4, marginBottom: 8, borderRadius: 6, backgroundColor: '#ff000015' },
  warStripText: { fontSize: 10, fontWeight: "800" as const, color: '#ff4444', letterSpacing: 2 },
  warScoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.bg.tertiary },
  warScoreText: { fontSize: 10, fontWeight: "700" as const },
  kingdomHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  crest: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  crestLetter: { fontSize: 20, fontWeight: "800" as const },
  kingdomInfo: { flex: 1, gap: 2 },
  kingdomName: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  rulerName: { fontSize: 12, color: Colors.text.secondary },
  attBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  attText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.5 },
  detailRow: { flexDirection: "row", marginTop: 14, gap: 10 },
  detailItem: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 8, padding: 8, alignItems: "center", gap: 2 },
  detailLabel: { fontSize: 10, color: Colors.text.dim, textTransform: "uppercase" as const },
  detailValue: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  allyInfo: { marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: Colors.status.success + '10' },
  allyLabel: { fontSize: 10, color: Colors.status.success, fontWeight: "600" as const },
  rulerStats: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  rulerStatsLabel: { fontSize: 10, color: Colors.text.dim, marginBottom: 4 },
  rulerStatRow: { flexDirection: "row", gap: 12 },
  rulerStat: { fontSize: 12, color: Colors.text.secondary },
  actionRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  giftBtn: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + "15" },
  giftText: { fontSize: 11, fontWeight: "600" as const, color: Colors.gold.bright },
  threatenBtn: { borderColor: Colors.crimson.dark, backgroundColor: Colors.crimson.dark + "15" },
  threatenText: { fontSize: 11, fontWeight: "600" as const, color: Colors.crimson.bright },
  allyBtn: { borderColor: Colors.status.info + "40", backgroundColor: Colors.status.info + "10" },
  allyText: { fontSize: 11, fontWeight: "600" as const, color: Colors.status.info },
  peaceBtn: { borderColor: Colors.status.success + '40', backgroundColor: Colors.status.success + '10' },
  peaceText: { fontSize: 11, fontWeight: "600" as const, color: Colors.status.success },
  tributeBtn: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + '15' },
  tributeText: { fontSize: 11, fontWeight: "600" as const, color: Colors.gold.bright },
  warBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ff000030', backgroundColor: '#ff000008' },
  warBtnText: { fontSize: 12, fontWeight: "600" as const, color: '#ff4444' },
});
