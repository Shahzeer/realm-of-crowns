import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown, MapPin, Shield, ChevronRight, TrendingUp, Heart, Plus, UserMinus, UserPlus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Province, Lord } from "@/types/game";

const PROVINCE_ICONS: Record<string, string> = {
  capital: '👑', city: '🏙️', castle: '🏰', temple: '⛪', farmland: '🌾', forest: '🌲', mountain: '⛰️',
};
const PROVINCE_TYPE_LABEL: Record<string, string> = {
  capital: 'Capital', city: 'City', castle: 'Castle', temple: 'Temple',
  farmland: 'Farmland', forest: 'Forest', mountain: 'Mountain',
};

function GrantSheet({ province, lords, gold, onClose, onGrantExisting, onAppointNew }: {
  province: Province;
  lords: Lord[];
  gold: number;
  onClose: () => void;
  onGrantExisting: (lordId: string) => void;
  onAppointNew: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start(onClose);
  };

  return (
    <Modal transparent animationType="none" onRequestClose={close}>
      <TouchableOpacity style={gs.backdrop} activeOpacity={1} onPress={close} />
      <Animated.View style={[gs.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] }]}>
        <View style={gs.sheetHandle} />
        <View style={gs.sheetHeader}>
          <Text style={gs.sheetTitle}>Grant {PROVINCE_ICONS[province.type]} {province.name}</Text>
          <TouchableOpacity onPress={close} style={gs.sheetClose}><X size={18} color={Colors.text.secondary} /></TouchableOpacity>
        </View>
        <Text style={gs.sheetSub}>Assign this province to a lord to reduce crown overstretch</Text>

        {lords.length > 0 && (
          <>
            <Text style={gs.sheetSection}>Add to existing lord (free)</Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {lords.map(lord => {
                const loyaltyColor = lord.loyalty > 70 ? Colors.status.success : lord.loyalty > 40 ? Colors.status.warning : Colors.status.danger;
                return (
                  <TouchableOpacity key={lord.id} style={gs.lordOption} onPress={() => onGrantExisting(lord.id)} activeOpacity={0.75}>
                    <View style={gs.lordOptionAvatar}>
                      <Crown size={14} color={Colors.gold.bright} />
                    </View>
                    <View style={gs.lordOptionBody}>
                      <Text style={gs.lordOptionName}>{lord.name}</Text>
                      <Text style={gs.lordOptionMeta}>Skill {lord.skill} · Tax {Math.round(lord.taxRate * 100)}% · {lord.provinceIds.length} prov</Text>
                    </View>
                    <View style={[gs.loyPill, { backgroundColor: loyaltyColor + '25' }]}>
                      <Heart size={9} color={loyaltyColor} />
                      <Text style={[gs.loyPillText, { color: loyaltyColor }]}>{lord.loyalty}%</Text>
                    </View>
                    <ChevronRight size={14} color={Colors.text.dim} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        <Text style={gs.sheetSection}>Appoint new lord</Text>
        <TouchableOpacity
          style={[gs.appointBtn, gold < 50 && gs.appointBtnDisabled]}
          onPress={onAppointNew}
          disabled={gold < 50}
          activeOpacity={0.8}
        >
          <UserPlus size={16} color={gold >= 50 ? Colors.gold.bright : Colors.text.dim} />
          <View style={{ flex: 1 }}>
            <Text style={[gs.appointBtnText, gold < 50 && { color: Colors.text.dim }]}>Appoint Lord (50g)</Text>
            <Text style={gs.appointBtnSub}>A new noble takes governance of {province.name}</Text>
          </View>
          {gold < 50 && <Text style={gs.appointInsuffText}>Need 50g</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={gs.peasantBtn} onPress={() => {
          Alert.alert('Appoint Peasant Overseer', `Install a low-skill overseer for ${province.name} at no cost. Less effective than a proper lord.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Appoint', onPress: onAppointNew },
          ]);
        }} activeOpacity={0.8}>
          <Text style={gs.peasantBtnText}>Appoint Peasant Overseer (free, low skill)</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

function DirectProvinceRow({ province, onGrant }: { province: Province; onGrant: () => void }) {
  const loyaltyColor = (province.loyalty ?? 80) > 70 ? Colors.status.success
    : (province.loyalty ?? 80) > 40 ? Colors.status.warning : Colors.status.danger;
  return (
    <View style={dom.provRow}>
      <Text style={dom.provIcon}>{PROVINCE_ICONS[province.type] ?? '🏛️'}</Text>
      <View style={dom.provBody}>
        <Text style={dom.provName}>{province.name}</Text>
        <Text style={dom.provType}>{PROVINCE_TYPE_LABEL[province.type]}</Text>
      </View>
      <View style={dom.provStats}>
        <View style={dom.provStat}>
          <TrendingUp size={10} color={Colors.gold.dim} />
          <Text style={dom.provStatText}>{province.development}</Text>
        </View>
        <View style={dom.provStat}>
          <Shield size={10} color={Colors.crimson.bright} />
          <Text style={dom.provStatText}>{province.garrison}</Text>
        </View>
        <View style={[dom.loyDot, { backgroundColor: loyaltyColor }]} />
      </View>
      {province.type !== 'capital' && (
        <TouchableOpacity style={dom.grantBtn} onPress={onGrant} activeOpacity={0.75}>
          <Plus size={13} color={Colors.gold.bright} />
          <Text style={dom.grantBtnText}>Grant</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function LordProvinceRow({ province, onRevoke }: { province: Province; onRevoke: () => void }) {
  const loyaltyColor = (province.loyalty ?? 80) > 70 ? Colors.status.success
    : (province.loyalty ?? 80) > 40 ? Colors.status.warning : Colors.status.danger;
  return (
    <View style={dom.provRow}>
      <Text style={dom.provIcon}>{PROVINCE_ICONS[province.type] ?? '🏛️'}</Text>
      <View style={dom.provBody}>
        <Text style={dom.provName}>{province.name}</Text>
        <Text style={dom.provType}>{PROVINCE_TYPE_LABEL[province.type]}</Text>
      </View>
      <View style={dom.provStats}>
        <View style={dom.provStat}>
          <TrendingUp size={10} color={Colors.gold.dim} />
          <Text style={dom.provStatText}>{province.development}</Text>
        </View>
        <View style={dom.provStat}>
          <Shield size={10} color={Colors.crimson.bright} />
          <Text style={dom.provStatText}>{province.garrison}</Text>
        </View>
        <View style={[dom.loyDot, { backgroundColor: loyaltyColor }]} />
      </View>
      <TouchableOpacity style={dom.revokeBtn} onPress={onRevoke} activeOpacity={0.75}>
        <UserMinus size={13} color={Colors.crimson.bright} />
        <Text style={dom.revokeBtnText}>Revoke</Text>
      </TouchableOpacity>
    </View>
  );
}

function LordCard({ lord, provinces, onRevoke, onGrant }: {
  lord: Lord;
  provinces: Province[];
  onRevoke: (provinceId: string) => void;
  onGrant: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const loyaltyColor = lord.loyalty > 70 ? Colors.status.success : lord.loyalty > 40 ? Colors.status.warning : Colors.status.danger;
  const rotAnim = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(rotAnim, { toValue: next ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  };

  const rot = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={dom.lordCard}>
      <TouchableOpacity style={dom.lordHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[dom.lordAvatar, { backgroundColor: Colors.gold.bright + '20' }]}>
          <Crown size={18} color={Colors.gold.bright} />
        </View>
        <View style={dom.lordInfo}>
          <Text style={dom.lordName}>{lord.name}</Text>
          <Text style={dom.lordMeta}>Skill {lord.skill} · Tax {Math.round(lord.taxRate * 100)}%</Text>
        </View>
        <View style={dom.lordBadges}>
          <View style={[dom.lordLoyBadge, { backgroundColor: loyaltyColor + '25' }]}>
            <Heart size={10} color={loyaltyColor} />
            <Text style={[dom.lordLoyText, { color: loyaltyColor }]}>{lord.loyalty}%</Text>
          </View>
          <Text style={dom.lordProvCount}>{provinces.length} prov</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rot }] }}>
          <ChevronRight size={16} color={Colors.text.dim} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={dom.lordProvinces}>
          {provinces.length === 0 ? (
            <Text style={dom.emptyHint}>No provinces assigned</Text>
          ) : (
            provinces.map((p, idx) => (
              <View key={p.id}>
                {idx > 0 && <View style={dom.divider} />}
                <LordProvinceRow province={p} onRevoke={() => onRevoke(p.id)} />
              </View>
            ))
          )}
          <TouchableOpacity style={dom.addToLordBtn} onPress={onGrant} activeOpacity={0.75}>
            <Plus size={13} color={Colors.gold.bright} />
            <Text style={dom.addToLordText}>Grant another province to {lord.name}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function DomainsScreen() {
  console.log("[RealmOfCrowns] Domains render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, assignLord, dismissLord } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [grantingProvince, setGrantingProvince] = useState<Province | null>(null);
  const [grantingLordId, setGrantingLordId] = useState<string | undefined>(undefined);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const playerProvinces = state.provinces.filter(p => p.owner === 'player');
  const lords = state.lords ?? [];
  const stewardshipCap = Math.floor(state.ruler.stewardship / 2) + 3;

  const lordProvinceMap: Map<string, Province[]> = new Map();
  lords.forEach(l => {
    lordProvinceMap.set(l.id, l.provinceIds.map(pid => playerProvinces.find(p => p.id === pid)).filter(Boolean) as Province[]);
  });

  const lordProvSet = new Set(lords.flatMap(l => l.provinceIds));
  const directProvinces = playerProvinces.filter(p => !lordProvSet.has(p.id));
  const crownCount = directProvinces.length;

  const openGrant = (province: Province, prefillLordId?: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGrantingLordId(prefillLordId);
    setGrantingProvince(province);
  };

  const handleGrantExisting = (lordId: string) => {
    if (!grantingProvince) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    assignLord(grantingProvince.id, lordId);
    setGrantingProvince(null);
  };

  const handleAppointNew = () => {
    if (!grantingProvince) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    assignLord(grantingProvince.id, undefined, 'lord');
    setGrantingProvince(null);
  };

  const handleRevoke = (provinceId: string) => {
    const lord = lords.find(l => l.provinceIds.includes(provinceId));
    const province = playerProvinces.find(p => p.id === provinceId);
    if (!lord || !province) return;
    Alert.alert(
      'Revoke Province',
      `Remove ${province.name} from ${lord.name}'s domain? This causes +20 unrest in the province.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke', style: 'destructive', onPress: () => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            dismissLord(provinceId);
          },
        },
      ]
    );
  };

  return (
    <View style={[dom.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#10130e', Colors.bg.primary]} style={StyleSheet.absoluteFill} />

      <View style={dom.header}>
        <View style={dom.headerLeft}>
          <MapPin size={22} color={Colors.gold.bright} />
          <Text style={dom.title}>Domains</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={dom.closeBtn}>
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={dom.summaryRow}>
        <View style={dom.summaryCard}>
          <Text style={dom.summaryValue}>{playerProvinces.length}</Text>
          <Text style={dom.summaryLabel}>Provinces</Text>
        </View>
        <View style={[dom.summaryCard, crownCount > stewardshipCap && dom.summaryCardWarn]}>
          <Text style={[dom.summaryValue, crownCount > stewardshipCap ? { color: Colors.status.danger } : {}]}>
            {crownCount}/{stewardshipCap}
          </Text>
          <Text style={dom.summaryLabel}>Direct</Text>
          {crownCount > stewardshipCap && <Text style={dom.overCapHint}>⚠️ Overstretch</Text>}
        </View>
        <View style={dom.summaryCard}>
          <Text style={dom.summaryValue}>{lords.length}</Text>
          <Text style={dom.summaryLabel}>Lords</Text>
        </View>
        <View style={dom.summaryCard}>
          <Text style={dom.summaryValue}>{state.ruler.stewardship}</Text>
          <Text style={dom.summaryLabel}>Stewardship</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, flex: 1 }}
        contentContainerStyle={[dom.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {lords.length > 0 && (
          <>
            <Text style={dom.sectionLabel}>Lords &amp; Their Holdings</Text>
            {lords.map(lord => (
              <LordCard
                key={lord.id}
                lord={lord}
                provinces={lordProvinceMap.get(lord.id) ?? []}
                onRevoke={handleRevoke}
                onGrant={() => {
                  const firstDirect = directProvinces[0];
                  if (firstDirect) openGrant(firstDirect, lord.id);
                  else Alert.alert('No Direct Provinces', 'All provinces are already under lords.');
                }}
              />
            ))}
          </>
        )}

        <Text style={dom.sectionLabel}>
          Crown Direct · {crownCount}/{stewardshipCap}
          {crownCount > stewardshipCap ? ' ⚠️' : ''}
        </Text>

        {crownCount > stewardshipCap && (
          <View style={dom.overstretchBanner}>
            <Text style={dom.overstretchText}>
              You're holding {crownCount - stewardshipCap} province{crownCount - stewardshipCap > 1 ? 's' : ''} over your stewardship cap. Grant them to lords to stop corruption penalties.
            </Text>
          </View>
        )}

        {directProvinces.length === 0 ? (
          <View style={dom.emptyCard}>
            <Text style={dom.emptyText}>All provinces are under lord administration.</Text>
          </View>
        ) : (
          <View style={dom.directCard}>
            {directProvinces.map((p, idx) => (
              <View key={p.id}>
                {idx > 0 && <View style={dom.divider} />}
                <DirectProvinceRow province={p} onGrant={() => openGrant(p)} />
              </View>
            ))}
          </View>
        )}

        <View style={dom.legendRow}>
          <View style={dom.legendItem}><TrendingUp size={11} color={Colors.gold.dim} /><Text style={dom.legendText}>Dev</Text></View>
          <View style={dom.legendItem}><Shield size={11} color={Colors.crimson.bright} /><Text style={dom.legendText}>Garrison</Text></View>
          <View style={[dom.loyDot, { backgroundColor: Colors.status.success }]} /><Text style={dom.legendText}>Loyal</Text>
          <View style={[dom.loyDot, { backgroundColor: Colors.status.warning, marginLeft: 8 }]} /><Text style={dom.legendText}>Restless</Text>
          <View style={[dom.loyDot, { backgroundColor: Colors.status.danger, marginLeft: 8 }]} /><Text style={dom.legendText}>Disloyal</Text>
        </View>
      </Animated.ScrollView>

      {grantingProvince && (
        <GrantSheet
          province={grantingProvince}
          lords={lords}
          gold={state.resources.gold}
          onClose={() => setGrantingProvince(null)}
          onGrantExisting={handleGrantExisting}
          onAppointNew={handleAppointNew}
        />
      )}
    </View>
  );
}

const dom = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryCardWarn: { borderColor: Colors.status.danger + '60' },
  summaryValue: { fontSize: 18, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  overCapHint: { fontSize: 9, color: Colors.status.danger, fontWeight: "700" as const, marginTop: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, marginTop: 6 },
  overstretchBanner: { backgroundColor: Colors.status.danger + '15', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.status.danger + '40' },
  overstretchText: { fontSize: 12, color: Colors.status.danger, lineHeight: 18 },
  lordCard: { backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.primary, overflow: "hidden" },
  lordHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  lordAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lordInfo: { flex: 1 },
  lordName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  lordMeta: { fontSize: 11, color: Colors.text.secondary, marginTop: 1 },
  lordBadges: { alignItems: "flex-end", gap: 4 },
  lordLoyBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  lordLoyText: { fontSize: 11, fontWeight: "700" as const },
  lordProvCount: { fontSize: 10, color: Colors.text.dim },
  lordProvinces: { borderTopWidth: 1, borderTopColor: Colors.border.primary, paddingBottom: 8 },
  addToLordBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 12, marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.gold.dim + '40', backgroundColor: Colors.gold.dim + '10' },
  addToLordText: { fontSize: 12, color: Colors.gold.bright, fontWeight: "600" as const },
  directCard: { backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.primary, overflow: "hidden" },
  provRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 12 },
  provIcon: { fontSize: 20, width: 28, textAlign: "center" as const },
  provBody: { flex: 1 },
  provName: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  provType: { fontSize: 10, color: Colors.text.secondary, marginTop: 1 },
  provStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  provStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  provStatText: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.secondary },
  loyDot: { width: 8, height: 8, borderRadius: 4 },
  grantBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, backgroundColor: Colors.gold.bright + '18', borderWidth: 1, borderColor: Colors.gold.bright + '40' },
  grantBtnText: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.bright },
  revokeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, backgroundColor: Colors.crimson.bright + '15', borderWidth: 1, borderColor: Colors.crimson.bright + '40' },
  revokeBtnText: { fontSize: 11, fontWeight: "700" as const, color: Colors.crimson.bright },
  divider: { height: 1, backgroundColor: Colors.border.primary, marginHorizontal: 12 },
  emptyCard: { backgroundColor: Colors.bg.card, borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  emptyText: { fontSize: 13, color: Colors.text.dim, textAlign: "center" as const },
  emptyHint: { fontSize: 12, color: Colors.text.dim, padding: 12, textAlign: "center" as const },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" as const, paddingTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 10, color: Colors.text.dim },
});

const gs = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg.secondary ?? '#1a1d14', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border.primary, alignSelf: "center", marginBottom: 14 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: "800" as const, color: Colors.text.primary, flex: 1 },
  sheetClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  sheetSub: { fontSize: 12, color: Colors.text.secondary, marginBottom: 14 },
  sheetSection: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  lordOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: Colors.bg.card, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: Colors.border.primary },
  lordOptionAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.gold.bright + '20', alignItems: "center", justifyContent: "center" },
  lordOptionBody: { flex: 1 },
  lordOptionName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  lordOptionMeta: { fontSize: 11, color: Colors.text.secondary, marginTop: 1 },
  loyPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  loyPillText: { fontSize: 10, fontWeight: "700" as const },
  appointBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: Colors.gold.bright + '12', borderRadius: 12, borderWidth: 1, borderColor: Colors.gold.bright + '40', marginBottom: 8 },
  appointBtnDisabled: { opacity: 0.5 },
  appointBtnText: { fontSize: 14, fontWeight: "700" as const, color: Colors.gold.bright },
  appointBtnSub: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },
  appointInsuffText: { fontSize: 11, color: Colors.status.danger, fontWeight: "600" as const },
  peasantBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.primary, alignItems: "center", marginBottom: 6 },
  peasantBtnText: { fontSize: 12, color: Colors.text.secondary },
});
