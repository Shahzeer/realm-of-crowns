import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, BookOpen, Check, Lock, Clock, Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Technology } from "@/types/game";

function TechCard({ tech, onResearch, canResearch, index }: { tech: Technology; onResearch: () => void; canResearch: boolean; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const categoryColors: Record<string, string> = {
    military: Colors.crimson.bright,
    economy: Colors.gold.bright,
    culture: Colors.faith.light,
    governance: Colors.status.info,
  };

  const color = categoryColors[tech.category] || Colors.text.secondary;
  const progressWidth = tech.researching ? `${((tech.turnsToResearch - tech.turnsRemaining) / tech.turnsToResearch) * 100}%` : '0%';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[st.techCard, tech.researched && st.techCardResearched, tech.researching && st.techCardActive]}>
        <View style={st.techHeader}>
          <View style={[st.techIconBox, { backgroundColor: color + '20' }]}>
            <Text style={st.techIcon}>{tech.icon}</Text>
          </View>
          <View style={st.techInfo}>
            <Text style={st.techName}>{tech.name}</Text>
            <Text style={[st.techCategory, { color }]}>{tech.category.toUpperCase()}</Text>
          </View>
          {tech.researched && <Check size={20} color={Colors.status.success} />}
          {tech.researching && <Clock size={20} color={Colors.gold.bright} />}
          {!tech.researched && !tech.researching && !canResearch && <Lock size={18} color={Colors.text.dim} />}
        </View>
        <Text style={st.techDesc}>{tech.description}</Text>
        <View style={st.techEffects}>
          {Object.entries(tech.effects).map(([key, val]) => (
            <View key={key} style={st.effectBadge}>
              <Text style={st.effectText}>+{val} {key.replace(/([A-Z])/g, ' $1').trim()}</Text>
            </View>
          ))}
        </View>
        {tech.researching && (
          <View style={st.progressSection}>
            <View style={st.progressBarBg}>
              <Animated.View style={[st.progressBarFill, { width: progressWidth as any, backgroundColor: color }]} />
            </View>
            <Text style={st.progressText}>{tech.turnsRemaining} turns remaining</Text>
          </View>
        )}
        {!tech.researched && !tech.researching && canResearch && (
          <TouchableOpacity style={[st.researchBtn, { borderColor: color }]} onPress={onResearch} activeOpacity={0.7}>
            <Sparkles size={14} color={color} />
            <Text style={[st.researchBtnText, { color }]}>Research ({tech.cost}g • {tech.turnsToResearch} turns)</Text>
          </TouchableOpacity>
        )}
        {tech.requires && tech.requires.length > 0 && !tech.researched && (
          <Text style={st.requiresText}>Requires: {tech.requires.map(r => r.replace('tech_', '').replace(/_/g, ' ')).join(', ')}</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function TechnologyScreen() {
  console.log("[RealmOfCrowns] Technology render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, startResearch, currentResearch } = useGame();

  const handleResearch = useCallback((techId: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    startResearch(techId);
  }, [startResearch]);

  const canResearchTech = useCallback((tech: Technology) => {
    if (tech.researched || tech.researching) return false;
    if (currentResearch) return false;
    if (state.resources.gold < tech.cost) return false;
    if (tech.requires) {
      return tech.requires.every(reqId => state.technologies.find(t => t.id === reqId)?.researched);
    }
    return true;
  }, [currentResearch, state.resources.gold, state.technologies]);

  const researchedCount = state.technologies.filter(t => t.researched).length;
  const categories = ['military', 'economy', 'culture', 'governance'] as const;
  const categoryLabels: Record<string, string> = { military: '⚔️ Military', economy: '💰 Economy', culture: '📿 Culture', governance: '🏛️ Governance' };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#0f1923', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={st.header}>
        <View style={st.headerLeft}>
          <BookOpen size={22} color={Colors.gold.bright} />
          <Text style={st.title}>Research</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={st.closeBtn} testID="close-tech">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={st.summaryValue}>{researchedCount}</Text>
          <Text style={st.summaryLabel}>Researched</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={st.summaryValue}>{state.technologies.length - researchedCount}</Text>
          <Text style={st.summaryLabel}>Available</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryValue, { color: Colors.status.info }]}>{state.ruler.learning}</Text>
          <Text style={st.summaryLabel}>Learning</Text>
        </View>
      </View>
      {currentResearch && (
        <View style={st.activeResearch}>
          <Text style={st.activeLabel}>CURRENTLY RESEARCHING</Text>
          <Text style={st.activeName}>{currentResearch.icon} {currentResearch.name}</Text>
          <View style={st.activeBarBg}>
            <View style={[st.activeBarFill, { width: `${((currentResearch.turnsToResearch - currentResearch.turnsRemaining) / currentResearch.turnsToResearch) * 100}%` }]} />
          </View>
          <Text style={st.activeProgress}>{currentResearch.turnsRemaining} turns left</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {categories.map(cat => {
          const techs = state.technologies.filter(t => t.category === cat);
          return (
            <View key={cat}>
              <Text style={st.sectionTitle}>{categoryLabels[cat]}</Text>
              {techs.map((tech, idx) => (
                <TechCard
                  key={tech.id}
                  tech={tech}
                  index={idx}
                  canResearch={canResearchTech(tech)}
                  onResearch={() => handleResearch(tech.id)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  activeResearch: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.gold.dim },
  activeLabel: { fontSize: 9, fontWeight: "700" as const, color: Colors.gold.dim, letterSpacing: 1.5, marginBottom: 6 },
  activeName: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary, marginBottom: 8 },
  activeBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  activeBarFill: { height: "100%", borderRadius: 3, backgroundColor: Colors.status.info },
  activeProgress: { fontSize: 11, color: Colors.text.secondary, marginTop: 4, textAlign: "right" as const },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  techCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border.primary },
  techCardResearched: { borderColor: Colors.status.success + '40', backgroundColor: Colors.status.success + '08' },
  techCardActive: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + '08' },
  techHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  techIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  techIcon: { fontSize: 22 },
  techInfo: { flex: 1, gap: 2 },
  techName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  techCategory: { fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5 },
  techDesc: { fontSize: 12, color: Colors.text.secondary, lineHeight: 17, marginTop: 8 },
  techEffects: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  effectBadge: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  effectText: { fontSize: 10, color: Colors.status.success, fontWeight: "600" as const },
  progressSection: { marginTop: 10 },
  progressBarBg: { height: 4, borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 10, color: Colors.text.secondary, marginTop: 4 },
  researchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, backgroundColor: Colors.bg.tertiary },
  researchBtnText: { fontSize: 13, fontWeight: "600" as const },
  requiresText: { fontSize: 10, color: Colors.text.dim, marginTop: 8, fontStyle: "italic" as const },
});
