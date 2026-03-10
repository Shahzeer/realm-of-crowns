import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown, Sword, Shield, Building2, BookOpen, Skull, Calendar, TrendingUp, ScrollText } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { ReignChronicle, ReignEvent } from "@/types/game";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getEventIcon(type: ReignEvent["type"]): string {
  switch (type) {
    case "military": return "\u2694\ufe0f";
    case "diplomacy": return "\ud83e\udd1d";
    case "economy": return "\ud83d\udcb0";
    case "dynasty": return "\ud83d\udc51";
    case "religion": return "\u26ea";
    case "conquest": return "\ud83c\udff0";
    default: return "\ud83d\udcdc";
  }
}

function getEventColor(type: ReignEvent["type"]): string {
  switch (type) {
    case "military": return Colors.crimson.bright;
    case "diplomacy": return Colors.status.info;
    case "economy": return Colors.gold.bright;
    case "dynasty": return Colors.gold.primary;
    case "religion": return Colors.faith.light;
    case "conquest": return Colors.status.success;
    default: return Colors.text.secondary;
  }
}

export default function ReignSummaryScreen() {
  console.log("[RealmOfCrowns] ReignSummary render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ index?: string }>();
  const { state, dismissReignChronicle } = useGame();

  const chronicle: ReignChronicle | null = useMemo(() => {
    if (params.index !== undefined) {
      const idx = parseInt(params.index, 10);
      const chronicles = state.reignChronicles ?? [];
      return chronicles[idx] ?? null;
    }
    return state.latestReignChronicle ?? null;
  }, [params.index, state.reignChronicles, state.latestReignChronicle]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const crownScale = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(crownScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      ]),
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    if (!params.index) {
      dismissReignChronicle();
    }
    router.back();
  };

  if (!chronicle) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={[Colors.bg.primary, "#0f1219", Colors.bg.primary]} style={StyleSheet.absoluteFill} />
        <View style={s.header}>
          <Text style={s.headerTitle}>Reign Summary</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-reign-summary">
            <X size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>{"\ud83d\udcdc"}</Text>
          <Text style={s.emptyTitle}>No Reign to Record</Text>
          <Text style={s.emptyDesc}>The chronicles await a ruler{"'"}s legacy.</Text>
        </View>
      </View>
    );
  }

  const stats = [
    { icon: Calendar, label: "Years Ruled", value: chronicle.yearsRuled, color: Colors.gold.bright },
    { icon: Sword, label: "Wars Fought", value: chronicle.warsFought, color: Colors.crimson.bright },
    { icon: Shield, label: "Battles Won", value: chronicle.battlesWon, color: Colors.status.success },
    { icon: Skull, label: "Battles Lost", value: chronicle.battlesLost, color: Colors.status.danger },
    { icon: TrendingUp, label: "Provinces Won", value: chronicle.provincesConquered, color: Colors.food.green },
    { icon: Building2, label: "Buildings Built", value: chronicle.buildingsConstructed, color: Colors.gold.primary },
    { icon: BookOpen, label: "Tech Researched", value: chronicle.technologiesResearched, color: Colors.status.info },
    { icon: Crown, label: "Peak Provinces", value: chronicle.peakProvinces, color: Colors.gold.dim },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#1a1006", "#0d1117", "#0a0d14"]} style={StyleSheet.absoluteFill} />

      <View style={s.header}>
        <ScrollText size={20} color={Colors.gold.bright} />
        <Text style={s.headerTitle}>Reign Summary</Text>
        <TouchableOpacity onPress={handleDismiss} style={s.closeBtn} testID="close-reign-summary">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={s.heroSection}>
            <Animated.View style={[s.crownContainer, { transform: [{ scale: crownScale }] }]}>
              <LinearGradient colors={[Colors.gold.dim + "40", Colors.gold.dim + "10"]} style={s.crownBg}>
                <Text style={s.crownEmoji}>{"\ud83d\udc51"}</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={s.legacyTitle}>{chronicle.legacyTitle}</Text>
              <Text style={s.dynastyText}>House {chronicle.dynasty}</Text>
              <View style={s.reignYearsRow}>
                <Text style={s.reignYears}>{chronicle.startYear} — {chronicle.endYear}</Text>
              </View>
              {chronicle.causeOfDeath && (
                <Text style={s.causeOfDeath}>Died of {chronicle.causeOfDeath}</Text>
              )}
            </Animated.View>

            {chronicle.legacyTitles.length > 0 && (
              <View style={s.titlesRow}>
                {chronicle.legacyTitles.map((title, idx) => (
                  <View key={idx} style={s.titleBadge}>
                    <Text style={s.titleBadgeText}>{title}</Text>
                  </View>
                ))}
              </View>
            )}

            {chronicle.traits.length > 0 && (
              <View style={s.traitsRow}>
                {chronicle.traits.map((trait, idx) => (
                  <View key={idx} style={s.traitChip}>
                    <Text style={s.traitIcon}>{trait.icon}</Text>
                    <Text style={s.traitName}>{trait.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
            <View style={s.narrativeCard}>
              <LinearGradient colors={[Colors.gold.dim + "12", Colors.bg.card]} style={s.narrativeBg}>
                <View style={s.narrativeHeader}>
                  <ScrollText size={16} color={Colors.gold.dim} />
                  <Text style={s.narrativeLabel}>The Chronicle</Text>
                </View>
                <Text style={s.narrativeText}>{chronicle.narrative}</Text>
              </LinearGradient>
            </View>

            <Text style={s.sectionTitle}>Reign Statistics</Text>
            <View style={s.statsGrid}>
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <View key={idx} style={s.statCard}>
                    <Icon size={18} color={stat.color} />
                    <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={s.statLabel}>{stat.label}</Text>
                  </View>
                );
              })}
            </View>

            {chronicle.keyEvents.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Key Events</Text>
                <View style={s.timelineContainer}>
                  {chronicle.keyEvents.map((evt, idx) => {
                    const evtColor = getEventColor(evt.type);
                    return (
                      <View key={idx} style={s.timelineItem}>
                        <View style={s.timelineLeft}>
                          <View style={[s.timelineDot, { backgroundColor: evtColor }]} />
                          {idx < chronicle.keyEvents.length - 1 && <View style={s.timelineLine} />}
                        </View>
                        <View style={[s.timelineIconBox, { backgroundColor: evtColor + "15" }]}>
                          <Text style={s.timelineIcon}>{getEventIcon(evt.type)}</Text>
                        </View>
                        <View style={s.timelineContent}>
                          <Text style={s.timelineYear}>Year {evt.year}</Text>
                          <Text style={s.timelineDesc}>{evt.description}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {chronicle.provincesLost > 0 && (
              <View style={s.lossCard}>
                <Text style={s.lossIcon}>{"\ud83d\udea9"}</Text>
                <Text style={s.lossText}>
                  {chronicle.provincesLost} province{chronicle.provincesLost !== 1 ? "s" : ""} lost during this reign
                </Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: 10,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center",
  },
  heroSection: { alignItems: "center", paddingTop: 28, paddingBottom: 20, paddingHorizontal: 20 },
  crownContainer: { marginBottom: 16 },
  crownBg: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.gold.dim + "50",
  },
  crownEmoji: { fontSize: 40 },
  legacyTitle: {
    fontSize: 24, fontWeight: "900" as const, color: Colors.gold.bright,
    textAlign: "center" as const, letterSpacing: 0.5,
  },
  dynastyText: {
    fontSize: 14, fontWeight: "600" as const, color: Colors.text.secondary,
    textAlign: "center" as const, marginTop: 4,
  },
  reignYearsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 8, gap: 6,
  },
  reignYears: {
    fontSize: 15, fontWeight: "700" as const, color: Colors.gold.dim,
    letterSpacing: 1,
  },
  causeOfDeath: {
    fontSize: 12, color: Colors.text.dim, marginTop: 6,
    fontStyle: "italic" as const, textAlign: "center" as const,
  },
  titlesRow: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
    gap: 6, marginTop: 14,
  },
  titleBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: Colors.gold.dim + "20", borderWidth: 1, borderColor: Colors.gold.dim + "40",
  },
  titleBadgeText: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.bright },
  traitsRow: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
    gap: 6, marginTop: 10,
  },
  traitChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary,
  },
  traitIcon: { fontSize: 12 },
  traitName: { fontSize: 10, fontWeight: "600" as const, color: Colors.text.secondary },
  narrativeCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 14, overflow: "hidden" as const },
  narrativeBg: {
    padding: 16, borderWidth: 1, borderColor: Colors.border.gold + "30", borderRadius: 14,
  },
  narrativeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  narrativeLabel: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1 },
  narrativeText: {
    fontSize: 14, lineHeight: 22, color: Colors.parchment.dark,
    fontStyle: "italic" as const,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: "800" as const, color: Colors.text.dim,
    textTransform: "uppercase" as const, letterSpacing: 1.2,
    marginHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, gap: 8,
  },
  statCard: {
    width: (SCREEN_WIDTH - 24 - 24) / 4 - 1,
    backgroundColor: Colors.bg.card, borderRadius: 10,
    paddingVertical: 12, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: Colors.border.primary,
  },
  statValue: { fontSize: 18, fontWeight: "900" as const },
  statLabel: { fontSize: 8, fontWeight: "600" as const, color: Colors.text.dim, textTransform: "uppercase" as const, textAlign: "center" as const },
  timelineContainer: { marginHorizontal: 16 },
  timelineItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 8, minHeight: 60,
  },
  timelineLeft: { width: 16, alignItems: "center", paddingTop: 10 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border.primary, marginTop: 4 },
  timelineIconBox: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  timelineIcon: { fontSize: 14 },
  timelineContent: { flex: 1, paddingBottom: 14 },
  timelineYear: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.dim, marginBottom: 2 },
  timelineDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  lossCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 16, padding: 12,
    backgroundColor: Colors.crimson.dark + "30", borderRadius: 10,
    borderWidth: 1, borderColor: Colors.crimson.bright + "30",
  },
  lossIcon: { fontSize: 20 },
  lossText: { flex: 1, fontSize: 13, color: Colors.crimson.bright, fontWeight: "600" as const },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary },
});
