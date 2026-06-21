import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown, MapPin, Shield, ChevronDown, ChevronRight, TrendingUp, Heart } from "lucide-react-native";
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

function ProvinceRow({ province, onPress }: { province: Province; onPress: () => void }) {
  const loyaltyColor = (province.loyalty ?? 80) > 70 ? Colors.status.success
    : (province.loyalty ?? 80) > 40 ? Colors.status.warning : Colors.status.danger;
  return (
    <TouchableOpacity style={dom.provRow} onPress={onPress} activeOpacity={0.75}>
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
      <ChevronRight size={14} color={Colors.text.dim} />
    </TouchableOpacity>
  );
}

function LordCard({ lord, provinces, onProvincePress }: {
  lord: Lord;
  provinces: Province[];
  onProvincePress: (p: Province) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const loyaltyColor = lord.loyalty > 70 ? Colors.status.success : lord.loyalty > 40 ? Colors.status.warning : Colors.status.danger;
  const rotAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

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
            provinces.map(p => (
              <ProvinceRow key={p.id} province={p} onPress={() => onProvincePress(p)} />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function DomainsScreen() {
  console.log("[RealmOfCrowns] Domains render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const directScrollRef = useRef<ScrollView>(null);

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

  const lordProvincIdSet = new Set(lords.flatMap(l => l.provinceIds));
  const directProvinces = playerProvinces.filter(p => !lordProvincIdSet.has(p.id));
  const crownCount = directProvinces.length;

  const handleProvincePress = (_province: Province) => {
    router.push('/');
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
        <TouchableOpacity
          style={[dom.summaryCard, dom.summaryCardTap]}
          activeOpacity={0.75}
          onPress={() => directScrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Text style={[dom.summaryValue, crownCount > stewardshipCap ? { color: Colors.status.danger } : {}]}>
            {crownCount}/{stewardshipCap}
          </Text>
          <Text style={dom.summaryLabel}>Direct</Text>
          {crownCount > stewardshipCap && (
            <Text style={dom.overCapHint}>⚠️ Overstretch</Text>
          )}
        </TouchableOpacity>
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
        ref={directScrollRef as any}
        style={{ opacity: fadeAnim, flex: 1 }}
        contentContainerStyle={[dom.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {lords.length > 0 && (
          <>
            <Text style={dom.sectionLabel}>Lords &amp; Vassals</Text>
            {lords.map(lord => (
              <LordCard
                key={lord.id}
                lord={lord}
                provinces={lordProvinceMap.get(lord.id) ?? []}
                onProvincePress={handleProvincePress}
              />
            ))}
          </>
        )}

        <Text style={dom.sectionLabel}>
          Crown Direct · {crownCount}/{stewardshipCap}
          {crownCount > stewardshipCap ? ' ⚠️' : ''}
        </Text>

        {directProvinces.length === 0 ? (
          <View style={dom.emptyCard}>
            <Text style={dom.emptyText}>All provinces are under lord administration.</Text>
          </View>
        ) : (
          <View style={dom.directCard}>
            {directProvinces.map((p, idx) => (
              <View key={p.id}>
                {idx > 0 && <View style={dom.divider} />}
                <ProvinceRow province={p} onPress={() => handleProvincePress(p)} />
              </View>
            ))}
          </View>
        )}

        <View style={dom.legendRow}>
          <View style={dom.legendItem}><TrendingUp size={11} color={Colors.gold.dim} /><Text style={dom.legendText}>Development</Text></View>
          <View style={dom.legendItem}><Shield size={11} color={Colors.crimson.bright} /><Text style={dom.legendText}>Garrison</Text></View>
          <View style={[dom.loyDot, { backgroundColor: Colors.status.success }]} /><Text style={dom.legendText}>Loyal</Text>
          <View style={[dom.loyDot, { backgroundColor: Colors.status.warning, marginLeft: 8 }]} /><Text style={dom.legendText}>Restless</Text>
          <View style={[dom.loyDot, { backgroundColor: Colors.status.danger, marginLeft: 8 }]} /><Text style={dom.legendText}>Disloyal</Text>
        </View>
      </Animated.ScrollView>
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
  summaryCardTap: { borderColor: Colors.gold.dim + '50' },
  summaryValue: { fontSize: 18, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  overCapHint: { fontSize: 9, color: Colors.status.danger, fontWeight: "700" as const, marginTop: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, marginTop: 6 },
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
  lordProvinces: { borderTopWidth: 1, borderTopColor: Colors.border.primary, paddingHorizontal: 10, paddingBottom: 8 },
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
  divider: { height: 1, backgroundColor: Colors.border.primary, marginHorizontal: 12 },
  emptyCard: { backgroundColor: Colors.bg.card, borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  emptyText: { fontSize: 13, color: Colors.text.dim, textAlign: "center" as const },
  emptyHint: { fontSize: 12, color: Colors.text.dim, padding: 12, textAlign: "center" as const },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" as const, paddingTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 10, color: Colors.text.dim },
});
