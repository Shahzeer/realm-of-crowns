import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown, BookOpen, Users, Sparkles, ShieldAlert, ChevronRight, MapPin } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

export default function RealmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const currentResearch = state.technologies.find(t => t.researched === false && t.available !== false);
  const activeNobleDisputes = state.pressures.nobleDisputes.filter(d => !d.resolved).length;
  const highPressures = (state.pressures.plague.active ? 1 : 0) + activeNobleDisputes;
  const pressureSub = state.pressures.plague.active ? 'Plague active' : state.pressures.corruption > 30 ? 'High corruption' : state.pressures.warExhaustion > 30 ? 'War exhaustion' : 'Stable';

  const playerProvinces = state.provinces.filter(p => p.owner === 'player');
  const lords = state.lords ?? [];
  const stewardshipCap = Math.floor(state.ruler.stewardship / 2) + 3;
  const lordProvSet = new Set((lords).flatMap(l => l.provinceIds));
  const directCount = playerProvinces.filter(p => !lordProvSet.has(p.id)).length;

  const hubs: Array<{
    path: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    stat: string;
    statLabel: string;
    accent: string;
    badge?: number;
  }> = [
    {
      path: "/domains",
      icon: <MapPin size={26} color={Colors.status.success} />,
      iconBg: Colors.status.success + "20",
      title: "Domains",
      description: "Your provinces, lords, and crown direct holdings",
      stat: `${playerProvinces.length}`,
      statLabel: `${directCount}/${stewardshipCap} direct`,
      accent: Colors.status.success,
      badge: directCount > stewardshipCap ? 1 : undefined,
    },
    {
      path: "/technology",
      icon: <BookOpen size={26} color={Colors.status.info} />,
      iconBg: Colors.status.info + "22",
      title: "Research",
      description: "Advance your kingdom with new technologies",
      stat: `${state.technologies.filter(t => t.researched).length}/${state.technologies.length}`,
      statLabel: "Researched",
      accent: Colors.status.info,
    },
    {
      path: "/council",
      icon: <Users size={26} color="#8b5cf6" />,
      iconBg: "#8b5cf620",
      title: "Council",
      description: "Manage advisors and royal court appointments",
      stat: `${state.council.length}`,
      statLabel: "Advisors",
      accent: "#8b5cf6",
    },
    {
      path: "/faith",
      icon: <Sparkles size={26} color={Colors.faith.light} />,
      iconBg: Colors.faith.purple + "22",
      title: "Faith",
      description: "Harness divine power and religious authority",
      stat: `${state.resources.faith ?? 0}`,
      statLabel: "Faith pts",
      accent: Colors.faith.light,
    },
    {
      path: "/pressures",
      icon: <ShieldAlert size={26} color={Colors.status.warning} />,
      iconBg: Colors.status.warning + "20",
      title: "Pressures",
      description: "Manage stability, corruption, and noble disputes",
      stat: pressureSub,
      statLabel: `${activeNobleDisputes} dispute${activeNobleDisputes !== 1 ? 's' : ''}`,
      accent: Colors.status.warning,
      badge: highPressures > 0 ? highPressures : undefined,
    },
  ];

  return (
    <View style={[r.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#14120a', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={r.header}>
        <View style={r.headerLeft}>
          <Crown size={22} color={Colors.gold.bright} />
          <Text style={r.title}>Realm</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={r.closeBtn}>
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[r.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={r.sectionLabel}>Kingdom Administration</Text>

        {hubs.map(hub => (
          <TouchableOpacity
            key={hub.path}
            style={r.hubCard}
            onPress={() => router.push(hub.path as any)}
            activeOpacity={0.75}
          >
            <View style={[r.hubIcon, { backgroundColor: hub.iconBg }]}>
              {hub.icon}
              {hub.badge ? (
                <View style={r.badge}>
                  <Text style={r.badgeText}>{hub.badge}</Text>
                </View>
              ) : null}
            </View>
            <View style={r.hubBody}>
              <Text style={[r.hubTitle, { color: hub.accent }]}>{hub.title}</Text>
              <Text style={r.hubDesc}>{hub.description}</Text>
              <View style={r.hubStatRow}>
                <Text style={[r.hubStat, { color: hub.accent }]}>{hub.stat}</Text>
                <Text style={r.hubStatLabel}>{hub.statLabel}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.text.dim} />
          </TouchableOpacity>
        ))}

        {currentResearch && (
          <View style={r.activeResearchBanner}>
            <BookOpen size={14} color={Colors.status.info} />
            <Text style={r.activeResearchText}>
              Researching: <Text style={{ color: Colors.status.info, fontWeight: "700" }}>{currentResearch.name}</Text>
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const r = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, marginBottom: 4 },
  hubCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border.primary,
  },
  hubIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute", top: -4, right: -4, minWidth: 18, height: 18,
    borderRadius: 9, backgroundColor: Colors.status.warning, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "800" as const, color: "#000" },
  hubBody: { flex: 1, gap: 3 },
  hubTitle: { fontSize: 16, fontWeight: "800" as const },
  hubDesc: { fontSize: 12, color: Colors.text.secondary, lineHeight: 17 },
  hubStatRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 },
  hubStat: { fontSize: 18, fontWeight: "800" as const },
  hubStatLabel: { fontSize: 11, color: Colors.text.dim },
  activeResearchBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.status.info + "15", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.status.info + "30",
  },
  activeResearchText: { fontSize: 13, color: Colors.text.secondary, flex: 1 },
});
