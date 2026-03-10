import React, { useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, AlertTriangle, Skull, Crown, Wheat, Building2, ChevronRight, ShieldAlert, HeartPulse } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { NobleDispute } from "@/types/game";

function PressureGauge({ value, color, label, icon }: { value: number; color: string; label: string; icon: React.ReactNode }) {
  const animWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animWidth, { toValue: value, duration: 800, useNativeDriver: false }).start();
  }, [value]);

  const barColor = value > 60 ? Colors.crimson.bright : value > 30 ? Colors.status.warning : color;
  const severity = value > 60 ? 'Critical' : value > 30 ? 'Concerning' : value > 10 ? 'Low' : 'Stable';
  const severityColor = value > 60 ? Colors.crimson.bright : value > 30 ? Colors.status.warning : value > 10 ? Colors.text.secondary : Colors.status.success;

  return (
    <View style={s.gaugeCard}>
      <View style={s.gaugeHeader}>
        <View style={[s.gaugeIconWrap, { backgroundColor: barColor + '20' }]}>
          {icon}
        </View>
        <View style={s.gaugeInfo}>
          <Text style={s.gaugeLabel}>{label}</Text>
          <Text style={[s.gaugeSeverity, { color: severityColor }]}>{severity}</Text>
        </View>
        <Text style={[s.gaugeValue, { color: barColor }]}>{Math.round(value)}%</Text>
      </View>
      <View style={s.gaugeBarBg}>
        <Animated.View style={[s.gaugeBarFill, {
          backgroundColor: barColor,
          width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </View>
  );
}

function NobleDisputeCard({ dispute, provinceName, onGrant, onRefuse, onImprison }: {
  dispute: NobleDispute;
  provinceName: string;
  onGrant: () => void;
  onRefuse: () => void;
  onImprison: () => void;
}) {
  const turnsActive = dispute.resolved ? 0 : 1;
  return (
    <View style={[s.disputeCard, dispute.resolved && s.disputeResolved]}>
      <View style={s.disputeHeader}>
        <Crown size={16} color={Colors.gold.bright} />
        <Text style={s.disputeName}>{dispute.nobleName}</Text>
        {dispute.resolved && <Text style={s.disputeResolvedBadge}>Resolved</Text>}
      </View>
      <Text style={s.disputeProvince}>{provinceName}</Text>
      <Text style={s.disputeDemand}>{dispute.nobleName} {dispute.demand}</Text>
      <Text style={s.disputePenalty}>Loyalty penalty: -{dispute.loyaltyPenalty}%</Text>
      {!dispute.resolved && (
        <View style={s.disputeActions}>
          <TouchableOpacity style={[s.disputeBtn, s.disputeBtnGrant]} onPress={onGrant} activeOpacity={0.7}>
            <Text style={s.disputeBtnGrantText}>Grant (150g)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.disputeBtn, s.disputeBtnRefuse]} onPress={onRefuse} activeOpacity={0.7}>
            <Text style={s.disputeBtnRefuseText}>Refuse</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.disputeBtn, s.disputeBtnImprison]} onPress={onImprison} activeOpacity={0.7}>
            <Text style={s.disputeBtnImprisonText}>Arrest</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function PressuresScreen() {
  console.log("[RealmOfCrowns] Pressures render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, reduceCorruption, resolveNobleDispute, containPlague, playerProvinces } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const { pressures } = state;
  const provCount = playerProvinces.length;

  const handleReduceCorruption = useCallback((method: 'gold' | 'faith') => {
    if (method === 'gold' && state.resources.gold < 200) {
      Alert.alert("Insufficient Gold", "Need 200 gold for anti-corruption measures.");
      return;
    }
    if (method === 'faith' && state.resources.faith < 40) {
      Alert.alert("Insufficient Faith", "Need 40 faith for religious purification.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reduceCorruption(method);
  }, [state.resources, reduceCorruption]);

  const handleResolveDispute = useCallback((disputeId: string, action: 'grant' | 'refuse' | 'imprison') => {
    if (action === 'grant' && state.resources.gold < 150) {
      Alert.alert("Insufficient Gold", "Need 150 gold to grant demands.");
      return;
    }
    if (action === 'imprison' && state.resources.military < 30) {
      Alert.alert("Insufficient Military", "Need 30 military to arrest the noble.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    resolveNobleDispute(disputeId, action);
  }, [state.resources, resolveNobleDispute]);

  const handleContainPlague = useCallback(() => {
    if (state.resources.gold < 150) {
      Alert.alert("Insufficient Gold", "Need 150 gold for quarantine measures.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    containPlague();
  }, [state.resources, containPlague]);

  const getProvinceName = useCallback((id: string) => {
    return state.provinces.find(p => p.id === id)?.name ?? 'Unknown';
  }, [state.provinces]);

  const activeDisputes = pressures.nobleDisputes.filter(d => !d.resolved);
  const overallPressure = Math.round((pressures.corruption + pressures.overstretch + pressures.famine + (pressures.plague.active ? pressures.plague.severity : 0)) / 4);
  const overallColor = overallPressure > 50 ? Colors.crimson.bright : overallPressure > 25 ? Colors.status.warning : Colors.status.success;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a1210', Colors.bg.primary]} style={StyleSheet.absoluteFill} />

      <View style={s.header}>
        <View style={s.headerLeft}>
          <ShieldAlert size={22} color={Colors.status.warning} />
          <Text style={s.title}>Kingdom Pressures</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-pressures">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={s.overviewCard}>
            <LinearGradient colors={['#1e1510', '#0d1117']} style={StyleSheet.absoluteFill} />
            <View style={s.overviewRow}>
              <View style={s.overviewLeft}>
                <Text style={s.overviewLabel}>Realm Stability</Text>
                <Text style={[s.overviewValue, { color: overallColor }]}>{100 - overallPressure}%</Text>
              </View>
              <View style={s.overviewRight}>
                <Text style={s.overviewStat}>{provCount} provinces</Text>
                <Text style={s.overviewStat}>{activeDisputes.length} disputes</Text>
                {pressures.plague.active && <Text style={[s.overviewStat, { color: Colors.crimson.bright }]}>Plague active</Text>}
              </View>
            </View>
            <View style={s.overviewBarBg}>
              <View style={[s.overviewBarFill, { width: `${100 - overallPressure}%`, backgroundColor: overallColor }]} />
            </View>
          </View>

          <Text style={s.sectionTitle}>Pressure Gauges</Text>

          <PressureGauge
            value={pressures.corruption}
            color={Colors.status.warning}
            label="Corruption"
            icon={<Building2 size={18} color={Colors.status.warning} />}
          />
          <PressureGauge
            value={pressures.overstretch}
            color={Colors.status.info}
            label="Empire Overstretch"
            icon={<AlertTriangle size={18} color={Colors.status.info} />}
          />
          <PressureGauge
            value={pressures.famine}
            color={Colors.food.green}
            label="Famine"
            icon={<Wheat size={18} color={Colors.food.green} />}
          />
          {pressures.plague.active && (
            <PressureGauge
              value={pressures.plague.severity}
              color={Colors.crimson.bright}
              label="Plague"
              icon={<Skull size={18} color={Colors.crimson.bright} />}
            />
          )}

          <Text style={s.sectionTitle}>Actions</Text>

          <View style={s.actionsGrid}>
            <TouchableOpacity style={s.actionCard} onPress={() => handleReduceCorruption('gold')} activeOpacity={0.7}>
              <LinearGradient colors={['#1a1812', '#0d1117']} style={StyleSheet.absoluteFill} />
              <Building2 size={20} color={Colors.gold.bright} />
              <Text style={s.actionTitle}>Fight Corruption</Text>
              <Text style={s.actionCost}>💰 200 gold</Text>
              <Text style={s.actionDesc}>Enact reforms to reduce corruption</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionCard} onPress={() => handleReduceCorruption('faith')} activeOpacity={0.7}>
              <LinearGradient colors={['#1a0f1e', '#0d1117']} style={StyleSheet.absoluteFill} />
              <HeartPulse size={20} color={Colors.faith.light} />
              <Text style={s.actionTitle}>Religious Purification</Text>
              <Text style={s.actionCost}>✨ 40 faith</Text>
              <Text style={s.actionDesc}>Temple scholars root out corruption</Text>
            </TouchableOpacity>

            {pressures.plague.active && (
              <TouchableOpacity style={s.actionCard} onPress={handleContainPlague} activeOpacity={0.7}>
                <LinearGradient colors={['#1a1015', '#0d1117']} style={StyleSheet.absoluteFill} />
                <Skull size={20} color={Colors.crimson.bright} />
                <Text style={s.actionTitle}>Quarantine</Text>
                <Text style={s.actionCost}>💰 150 gold</Text>
                <Text style={s.actionDesc}>Enforce quarantine to contain plague</Text>
              </TouchableOpacity>
            )}
          </View>

          {pressures.overstretch > 0 && (
            <View style={s.infoCard}>
              <AlertTriangle size={16} color={Colors.status.warning} />
              <View style={s.infoContent}>
                <Text style={s.infoTitle}>Empire Overstretch</Text>
                <Text style={s.infoDesc}>
                  Controlling {provCount} provinces (over 10) increases upkeep by {(provCount - 10) * 15}g/turn and reduces loyalty in outlying provinces. Release provinces or improve governance to reduce overstretch.
                </Text>
              </View>
            </View>
          )}

          {pressures.famine > 20 && (
            <View style={s.infoCard}>
              <Wheat size={16} color={Colors.food.green} />
              <View style={s.infoContent}>
                <Text style={s.infoTitle}>Food Shortage</Text>
                <Text style={s.infoDesc}>
                  Low food reserves cause unrest across all provinces. Build farms, establish trade routes for food, or reduce army sizes to lower consumption.
                </Text>
              </View>
            </View>
          )}

          {pressures.plague.active && (
            <>
              <Text style={s.sectionTitle}>Plague Status</Text>
              <View style={s.plagueCard}>
                <LinearGradient colors={['#1a0f0f', '#0d1117']} style={StyleSheet.absoluteFill} />
                <View style={s.plagueHeader}>
                  <Skull size={20} color={Colors.crimson.bright} />
                  <Text style={s.plagueTitle}>Active Plague</Text>
                  <View style={[s.plagueBadge, pressures.plague.contained ? s.plagueBadgeContained : s.plagueBadgeSpreading]}>
                    <Text style={s.plagueBadgeText}>{pressures.plague.contained ? 'Contained' : 'Spreading'}</Text>
                  </View>
                </View>
                <Text style={s.plagueSeverity}>Severity: {pressures.plague.severity}%</Text>
                <Text style={s.plagueProvinces}>Infected provinces:</Text>
                {pressures.plague.infectedProvinces.map(pid => (
                  <View key={pid} style={s.plagueProvinceRow}>
                    <View style={s.plagueDot} />
                    <Text style={s.plagueProvinceName}>{getProvinceName(pid)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeDisputes.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Noble Disputes ({activeDisputes.length})</Text>
              {activeDisputes.map(dispute => (
                <NobleDisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  provinceName={getProvinceName(dispute.province)}
                  onGrant={() => handleResolveDispute(dispute.id, 'grant')}
                  onRefuse={() => handleResolveDispute(dispute.id, 'refuse')}
                  onImprison={() => handleResolveDispute(dispute.id, 'imprison')}
                />
              ))}
            </>
          )}

          {activeDisputes.length === 0 && !pressures.plague.active && pressures.corruption < 10 && pressures.overstretch === 0 && pressures.famine < 10 && (
            <View style={s.stableCard}>
              <Text style={s.stableEmoji}>🏛️</Text>
              <Text style={s.stableTitle}>Kingdom Stable</Text>
              <Text style={s.stableDesc}>Your realm faces no significant internal pressures. Continue to govern wisely.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border.primary },
  scroll: { flex: 1 },
  overviewCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border.gold },
  overviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  overviewLeft: { gap: 2 },
  overviewRight: { alignItems: "flex-end", gap: 3 },
  overviewLabel: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.secondary, textTransform: "uppercase" as const, letterSpacing: 1 },
  overviewValue: { fontSize: 32, fontWeight: "900" as const },
  overviewStat: { fontSize: 11, color: Colors.text.secondary },
  overviewBarBg: { height: 4, borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  overviewBarFill: { height: "100%", borderRadius: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  gaugeCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  gaugeHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  gaugeIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  gaugeInfo: { flex: 1, gap: 2 },
  gaugeLabel: { fontSize: 14, fontWeight: "600" as const, color: Colors.text.primary },
  gaugeSeverity: { fontSize: 11, fontWeight: "500" as const },
  gaugeValue: { fontSize: 18, fontWeight: "800" as const },
  gaugeBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  gaugeBarFill: { height: "100%", borderRadius: 3 },
  actionsGrid: { paddingHorizontal: 16, gap: 10 },
  actionCard: { borderRadius: 12, padding: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.border.primary, gap: 4 },
  actionTitle: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary, marginTop: 4 },
  actionCost: { fontSize: 12, fontWeight: "600" as const, color: Colors.gold.bright },
  actionDesc: { fontSize: 11, color: Colors.text.secondary },
  infoCard: { marginHorizontal: 16, marginTop: 12, flexDirection: "row", gap: 10, padding: 12, backgroundColor: Colors.bg.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.status.warning + '30' },
  infoContent: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  infoDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 16 },
  plagueCard: { marginHorizontal: 16, borderRadius: 14, padding: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.crimson.dark + '60' },
  plagueHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  plagueTitle: { fontSize: 16, fontWeight: "800" as const, color: Colors.crimson.bright, flex: 1 },
  plagueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  plagueBadgeContained: { backgroundColor: Colors.status.success + '25' },
  plagueBadgeSpreading: { backgroundColor: Colors.crimson.bright + '25' },
  plagueBadgeText: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.primary },
  plagueSeverity: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.primary, marginBottom: 8 },
  plagueProvinces: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.secondary, marginBottom: 6 },
  plagueProvinceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  plagueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.crimson.bright },
  plagueProvinceName: { fontSize: 12, color: Colors.text.primary },
  disputeCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  disputeResolved: { opacity: 0.5 },
  disputeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  disputeName: { fontSize: 14, fontWeight: "700" as const, color: Colors.gold.bright, flex: 1 },
  disputeResolvedBadge: { fontSize: 10, fontWeight: "600" as const, color: Colors.status.success, backgroundColor: Colors.status.success + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  disputeProvince: { fontSize: 11, color: Colors.text.secondary, marginBottom: 4 },
  disputeDemand: { fontSize: 12, color: Colors.text.primary, lineHeight: 18, marginBottom: 6 },
  disputePenalty: { fontSize: 11, color: Colors.crimson.bright, marginBottom: 10 },
  disputeActions: { flexDirection: "row", gap: 8 },
  disputeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  disputeBtnGrant: { backgroundColor: Colors.gold.dim + '30', borderWidth: 1, borderColor: Colors.gold.dim + '50' },
  disputeBtnGrantText: { fontSize: 12, fontWeight: "600" as const, color: Colors.gold.bright },
  disputeBtnRefuse: { backgroundColor: Colors.bg.tertiary, borderWidth: 1, borderColor: Colors.border.primary },
  disputeBtnRefuseText: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.secondary },
  disputeBtnImprison: { backgroundColor: Colors.crimson.dark + '30', borderWidth: 1, borderColor: Colors.crimson.dark + '50' },
  disputeBtnImprisonText: { fontSize: 12, fontWeight: "600" as const, color: Colors.crimson.bright },
  stableCard: { marginHorizontal: 16, marginTop: 20, alignItems: "center", padding: 24, backgroundColor: Colors.bg.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.status.success + '30' },
  stableEmoji: { fontSize: 40, marginBottom: 12 },
  stableTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.status.success, marginBottom: 6 },
  stableDesc: { fontSize: 12, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 18 },
});
