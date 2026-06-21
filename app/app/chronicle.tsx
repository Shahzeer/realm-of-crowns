import React, { useRef, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, BookOpen, Crown, ChevronRight, Shield, Trophy } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

type FilterType = 'all' | 'military' | 'diplomacy' | 'economy' | 'events';
type TabType = 'log' | 'rulers';

function getLogIcon(entry: string): string {
  if (entry.includes('⚔️') || entry.includes('Conquered')) return '⚔️';
  if (entry.includes('🔥') || entry.includes('WAR')) return '🔥';
  if (entry.includes('👑') || entry.includes('died')) return '👑';
  if (entry.includes('📈') || entry.includes('training')) return '📈';
  if (entry.includes('🏗️') || entry.includes('Built')) return '🏗️';
  if (entry.includes('📚') || entry.includes('research')) return '📚';
  if (entry.includes('☮️') || entry.includes('peace')) return '☮️';
  if (entry.includes('🕵️') || entry.includes('spy')) return '🕵️';
  if (entry.includes('🤝') || entry.includes('Trade')) return '🤝';
  if (entry.includes('Revolt') || entry.includes('revolt')) return '🔥';
  if (entry.includes('Event')) return '📜';
  if (entry.includes('Year')) return '📅';
  if (entry.includes('📖') || entry.includes('education')) return '📖';
  if (entry.includes('💍') || entry.includes('married')) return '💍';
  return '📋';
}

function getLogColor(entry: string): string {
  if (entry.includes('⚔️') || entry.includes('Conquered') || entry.includes('VICTORY')) return Colors.status.success;
  if (entry.includes('🔥') || entry.includes('WAR') || entry.includes('Revolt')) return '#ff4444';
  if (entry.includes('❌') || entry.includes('failed')) return Colors.crimson.bright;
  if (entry.includes('👑')) return Colors.gold.bright;
  if (entry.includes('🕵️')) return '#8b5cf6';
  if (entry.includes('🤝') || entry.includes('Trade')) return Colors.gold.primary;
  if (entry.includes('☮️')) return Colors.status.success;
  return Colors.text.dim;
}

function getLogCategory(entry: string): FilterType {
  if (entry.includes('⚔️') || entry.includes('army') || entry.includes('Conquered') || entry.includes('siege') || entry.includes('Recruited') || entry.includes('Merged') || entry.includes('Reinforced') || entry.includes('Disbanded')) return 'military';
  if (entry.includes('🤝') || entry.includes('Trade') || entry.includes('alliance') || entry.includes('gift') || entry.includes('☮️') || entry.includes('relation') || entry.includes('💍')) return 'diplomacy';
  if (entry.includes('🏗️') || entry.includes('Built') || entry.includes('Upgraded') || entry.includes('gold') || entry.includes('💰')) return 'economy';
  if (entry.includes('Event') || entry.includes('📜') || entry.includes('🔥') || entry.includes('Revolt')) return 'events';
  return 'all';
}

export default function ChronicleScreen() {
  console.log("[RealmOfCrowns] Chronicle render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<TabType>('log');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const battlesWon = useMemo(() => state.battles.filter(b => b.conquered).length, [state.battles]);
  const battlesLost = useMemo(() => state.battles.filter(b => !b.conquered).length, [state.battles]);
  const playerProvCount = useMemo(() => state.provinces.filter(p => p.owner === 'player').length, [state.provinces]);
  const techResearched = useMemo(() => state.technologies.filter(t => t.researched).length, [state.technologies]);
  const chronicles = useMemo(() => state.reignChronicles ?? [], [state.reignChronicles]);

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'all') return state.log;
    return state.log.filter(entry => getLogCategory(entry) === activeFilter || entry.startsWith('Year'));
  }, [state.log, activeFilter]);

  const filters: Array<{ id: FilterType; label: string; icon: string }> = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'military', label: 'Military', icon: '⚔️' },
    { id: 'diplomacy', label: 'Diplomacy', icon: '🤝' },
    { id: 'economy', label: 'Economy', icon: '🏗️' },
    { id: 'events', label: 'Events', icon: '📜' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#12150f', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <BookOpen size={22} color={Colors.gold.bright} />
          <Text style={s.title}>Chronicle</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-chronicle">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, activeTab === 'log' && s.tabBtnActive]}
          onPress={() => setActiveTab('log')}
          activeOpacity={0.7}
        >
          <BookOpen size={14} color={activeTab === 'log' ? Colors.gold.bright : Colors.text.dim} />
          <Text style={[s.tabLabel, activeTab === 'log' && s.tabLabelActive]}>Event Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, activeTab === 'rulers' && s.tabBtnActive]}
          onPress={() => setActiveTab('rulers')}
          activeOpacity={0.7}
        >
          <Crown size={14} color={activeTab === 'rulers' ? Colors.gold.bright : Colors.text.dim} />
          <Text style={[s.tabLabel, activeTab === 'rulers' && s.tabLabelActive]}>Past Rulers</Text>
          {chronicles.length > 0 && (
            <View style={s.tabBadge}>
              <Text style={s.tabBadgeText}>{chronicles.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.quickNav}>
        <TouchableOpacity style={s.quickNavBtn} onPress={() => router.push('/battles')} activeOpacity={0.75}>
          <Shield size={16} color={Colors.crimson.bright} />
          <Text style={s.quickNavText}>Battles</Text>
          <Text style={s.quickNavSub}>{state.battles.length} fought</Text>
          <ChevronRight size={13} color={Colors.text.dim} />
        </TouchableOpacity>
        <View style={s.quickNavDivider} />
        <TouchableOpacity style={s.quickNavBtn} onPress={() => router.push('/achievements')} activeOpacity={0.75}>
          <Trophy size={16} color={Colors.gold.bright} />
          <Text style={s.quickNavText}>Achievements</Text>
          <Text style={s.quickNavSub}>{state.achievements.filter(a => a.unlocked).length}/{state.achievements.length}</Text>
          <ChevronRight size={13} color={Colors.text.dim} />
        </TouchableOpacity>
      </View>

      {activeTab === 'log' && (
        <>
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <Text style={s.summaryValue}>{state.turn}</Text>
              <Text style={s.summaryLabel}>Turns</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryValue}>{state.year}</Text>
              <Text style={s.summaryLabel}>Year</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryValue}>{state.log.length}</Text>
              <Text style={s.summaryLabel}>Entries</Text>
            </View>
          </View>

          <View style={s.kingdomStats}>
            <View style={s.kStatRow}>
              <View style={s.kStatItem}>
                <Text style={s.kStatIcon}>⚔️</Text>
                <Text style={s.kStatValue}>{battlesWon}</Text>
                <Text style={s.kStatLabel}>Won</Text>
              </View>
              <View style={s.kStatItem}>
                <Text style={s.kStatIcon}>💀</Text>
                <Text style={s.kStatValue}>{battlesLost}</Text>
                <Text style={s.kStatLabel}>Lost</Text>
              </View>
              <View style={s.kStatItem}>
                <Text style={s.kStatIcon}>🏰</Text>
                <Text style={s.kStatValue}>{playerProvCount}</Text>
                <Text style={s.kStatLabel}>Provinces</Text>
              </View>
              <View style={s.kStatItem}>
                <Text style={s.kStatIcon}>📚</Text>
                <Text style={s.kStatValue}>{techResearched}</Text>
                <Text style={s.kStatLabel}>Tech</Text>
              </View>
              <View style={s.kStatItem}>
                <Text style={s.kStatIcon}>👑</Text>
                <Text style={s.kStatValue}>{state.ruler.age}</Text>
                <Text style={s.kStatLabel}>Age</Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterScrollContent}>
            {filters.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[s.filterChip, activeFilter === f.id && s.filterChipActive]}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.7}
              >
                <Text style={s.filterIcon}>{f.icon}</Text>
                <Text style={[s.filterLabel, activeFilter === f.id && s.filterLabelActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim }}>
              {filteredLogs.map((entry, idx) => {
                const icon = getLogIcon(entry);
                const color = getLogColor(entry);
                const isYearEntry = entry.startsWith('Year');

                return (
                  <View key={`log-${idx}`} style={[s.logEntry, isYearEntry && s.logEntryYear]}>
                    <View style={s.timelineCol}>
                      <View style={[s.timelineDot, { backgroundColor: color }]} />
                      {idx < filteredLogs.length - 1 && <View style={s.timelineLine} />}
                    </View>
                    <View style={[s.logIconBox, { backgroundColor: color + '15' }]}>
                      <Text style={s.logIcon}>{icon}</Text>
                    </View>
                    <View style={s.logContent}>
                      <Text style={[s.logText, isYearEntry && { color: Colors.gold.dim, fontWeight: '700' as const }]}>
                        {entry}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {filteredLogs.length === 0 && (
                <View style={s.emptyState}>
                  <Text style={s.emptyIcon}>📜</Text>
                  <Text style={s.emptyTitle}>{activeFilter === 'all' ? 'The Chronicle Awaits' : 'No Entries'}</Text>
                  <Text style={s.emptyDesc}>
                    {activeFilter === 'all' ? 'Your deeds will be recorded here for posterity.' : `No ${activeFilter} entries found.`}
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </>
      )}

      {activeTab === 'rulers' && (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={s.currentRulerCard}>
              <LinearGradient colors={[Colors.gold.dim + '20', Colors.bg.card]} style={s.currentRulerBg}>
                <View style={s.currentRulerHeader}>
                  <View style={s.currentRulerAvatar}>
                    <Text style={s.currentRulerEmoji}>👑</Text>
                  </View>
                  <View style={s.currentRulerInfo}>
                    <View style={s.currentBadge}>
                      <Text style={s.currentBadgeText}>CURRENT RULER</Text>
                    </View>
                    <Text style={s.currentRulerName}>{state.ruler.name}</Text>
                    <Text style={s.currentRulerDynasty}>House {state.ruler.dynasty}</Text>
                    <Text style={s.currentRulerMeta}>
                      Age {state.ruler.age} · Ruling since {state.rulerStartYear ?? 1066}
                    </Text>
                  </View>
                </View>
                {(state.ruler.legacyTitles?.length ?? 0) > 0 && (
                  <View style={s.currentTitlesRow}>
                    {state.ruler.legacyTitles?.map((title, idx) => (
                      <View key={idx} style={s.currentTitleBadge}>
                        <Text style={s.currentTitleText}>{title}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>

            {chronicles.length > 0 && (
              <Text style={s.pastRulersHeader}>Past Rulers</Text>
            )}

            {[...chronicles].reverse().map((chronicle, idx) => {
              const actualIndex = chronicles.length - 1 - idx;
              return (
                <TouchableOpacity
                  key={chronicle.rulerId}
                  style={s.rulerCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/reign-summary?index=${actualIndex}`)}
                  testID={`past-ruler-${actualIndex}`}
                >
                  <View style={s.rulerCardLeft}>
                    <View style={s.rulerOrdinal}>
                      <Text style={s.rulerOrdinalText}>{actualIndex + 1}</Text>
                    </View>
                    <View style={s.rulerCardInfo}>
                      <Text style={s.rulerCardName}>{chronicle.legacyTitle}</Text>
                      <Text style={s.rulerCardDynasty}>House {chronicle.dynasty}</Text>
                      <Text style={s.rulerCardYears}>
                        {chronicle.startYear} — {chronicle.endYear} · {chronicle.yearsRuled} year{chronicle.yearsRuled !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={s.rulerCardRight}>
                    <View style={s.rulerStatsCol}>
                      <Text style={s.rulerStatIcon}>⚔️</Text>
                      <Text style={s.rulerStatVal}>{chronicle.battlesWon}</Text>
                    </View>
                    <View style={s.rulerStatsCol}>
                      <Text style={s.rulerStatIcon}>🏰</Text>
                      <Text style={s.rulerStatVal}>{chronicle.peakProvinces}</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.text.dim} />
                  </View>
                </TouchableOpacity>
              );
            })}

            {chronicles.length === 0 && (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>👑</Text>
                <Text style={s.emptyTitle}>No Past Rulers</Text>
                <Text style={s.emptyDesc}>
                  When a ruler passes, their legacy will be recorded here.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 10, marginBottom: 6, gap: 8 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary,
  },
  tabBtnActive: { backgroundColor: Colors.gold.dim + '18', borderColor: Colors.gold.dim + '40' },
  tabLabel: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.dim },
  tabLabelActive: { color: Colors.gold.bright },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.gold.dim + '40',
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: "800" as const, color: Colors.gold.bright },
  quickNav: { flexDirection: "row", marginHorizontal: 16, marginVertical: 8, backgroundColor: Colors.bg.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.primary, overflow: "hidden" },
  quickNavBtn: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, gap: 7 },
  quickNavText: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary, flex: 1 },
  quickNavSub: { fontSize: 11, color: Colors.text.dim },
  quickNavDivider: { width: 1, backgroundColor: Colors.border.primary, marginVertical: 8 },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  kingdomStats: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border.primary },
  kStatRow: { flexDirection: "row", justifyContent: "space-between" },
  kStatItem: { alignItems: "center", gap: 2, flex: 1 },
  kStatIcon: { fontSize: 16 },
  kStatValue: { fontSize: 15, fontWeight: "800" as const, color: Colors.text.primary },
  kStatLabel: { fontSize: 8, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  filterScroll: { maxHeight: 44, marginBottom: 4 },
  filterScrollContent: { paddingHorizontal: 16, gap: 8, flexDirection: "row", alignItems: "center" },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary },
  filterChipActive: { backgroundColor: Colors.gold.dim + '20', borderColor: Colors.gold.dim + '50' },
  filterIcon: { fontSize: 12 },
  filterLabel: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.dim },
  filterLabelActive: { color: Colors.gold.bright },
  logEntry: { flexDirection: "row", alignItems: "flex-start", paddingRight: 16, paddingVertical: 10, gap: 8 },
  logEntryYear: { backgroundColor: Colors.gold.dim + '08' },
  timelineCol: { width: 20, alignItems: "center", paddingTop: 8, marginLeft: 16 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border.primary, marginTop: 4 },
  logIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  logIcon: { fontSize: 14 },
  logContent: { flex: 1 },
  logText: { fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const },
  currentRulerCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 14, overflow: "hidden" as const },
  currentRulerBg: { padding: 14, borderWidth: 1, borderColor: Colors.gold.dim + '30', borderRadius: 14 },
  currentRulerHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  currentRulerAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.gold.dim + '25',
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.gold.dim + '40',
  },
  currentRulerEmoji: { fontSize: 24 },
  currentRulerInfo: { flex: 1 },
  currentBadge: {
    alignSelf: "flex-start" as const, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, backgroundColor: Colors.status.success + '20', marginBottom: 4,
  },
  currentBadgeText: { fontSize: 8, fontWeight: "800" as const, color: Colors.status.success, letterSpacing: 0.8 },
  currentRulerName: { fontSize: 17, fontWeight: "800" as const, color: Colors.text.primary },
  currentRulerDynasty: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.secondary, marginTop: 1 },
  currentRulerMeta: { fontSize: 11, color: Colors.text.dim, marginTop: 2 },
  currentTitlesRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 10 },
  currentTitleBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
    backgroundColor: Colors.gold.dim + '18', borderWidth: 1, borderColor: Colors.gold.dim + '35',
  },
  currentTitleText: { fontSize: 10, fontWeight: "700" as const, color: Colors.gold.bright },
  pastRulersHeader: {
    fontSize: 12, fontWeight: "800" as const, color: Colors.text.dim,
    textTransform: "uppercase" as const, letterSpacing: 1.2,
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  rulerCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.primary,
  },
  rulerCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rulerOrdinal: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.bg.tertiary, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border.primary,
  },
  rulerOrdinalText: { fontSize: 12, fontWeight: "800" as const, color: Colors.gold.dim },
  rulerCardInfo: { flex: 1 },
  rulerCardName: { fontSize: 14, fontWeight: "800" as const, color: Colors.text.primary },
  rulerCardDynasty: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.secondary, marginTop: 1 },
  rulerCardYears: { fontSize: 10, color: Colors.text.dim, marginTop: 2 },
  rulerCardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  rulerStatsCol: { alignItems: "center", gap: 1 },
  rulerStatIcon: { fontSize: 12 },
  rulerStatVal: { fontSize: 12, fontWeight: "800" as const, color: Colors.text.secondary },
});
