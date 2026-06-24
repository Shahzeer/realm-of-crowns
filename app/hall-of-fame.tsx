import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown, Trophy, Swords, MapPin, Calendar, Star, TrendingUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { loadPrestigeRecords } from "@/utils/prestige";
import { PrestigeRecord } from "@/types/game";

const OUTCOME_META: Record<PrestigeRecord['outcome'], { icon: string; label: string; color: string }> = {
  conquest:   { icon: '⚔️', label: 'Conquest', color: '#ef4444' },
  domination: { icon: '👑', label: 'Domination', color: Colors.gold.bright },
  cultural:   { icon: '📚', label: 'Cultural', color: Colors.status.info },
  faith:      { icon: '✨', label: 'Faith', color: '#c084fc' },
  defeat:     { icon: '💀', label: 'Fallen', color: Colors.text.dim },
};

const DIFF_META: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: Colors.status.success },
  normal: { label: 'Normal', color: Colors.status.warning },
  hard:   { label: 'Hard',   color: Colors.crimson.bright },
};

function RunCard({ record, rank, index }: { record: PrestigeRecord; rank: number; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 80, useNativeDriver: true, tension: 50, friction: 10 }),
    ]).start();
  }, []);

  const meta = OUTCOME_META[record.outcome];
  const diff = DIFF_META[record.difficulty] ?? DIFF_META.normal;
  const isTop = rank === 1;

  const getRankDisplay = (r: number) => {
    if (r === 1) return '👑';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return `#${r}`;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[h.card, isTop && h.topCard, record.outcome === 'defeat' && h.defeatCard]}>
        {isTop && (
          <LinearGradient colors={[Colors.gold.dim + '20', 'transparent']} style={StyleSheet.absoluteFill} />
        )}
        <View style={h.cardHeader}>
          <View style={h.rankBadge}>
            <Text style={h.rankText}>{getRankDisplay(rank)}</Text>
          </View>
          <View style={[h.outcomeBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={h.outcomeBadgeIcon}>{meta.icon}</Text>
            <Text style={[h.outcomeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={h.dynastyName}>{record.dynastyName}</Text>
            <Text style={h.rulerName}>{record.rulerName}</Text>
          </View>
          <View style={h.scoreBox}>
            <Text style={[h.scoreValue, isTop && { color: Colors.gold.bright }]}>
              {record.finalScore.toLocaleString()}
            </Text>
            <Text style={h.scoreLabel}>pts</Text>
          </View>
        </View>

        {(record.victoryType ?? record.causeOfDeath) ? (
          <Text style={[h.outcomeDesc, { color: meta.color + 'cc' }]} numberOfLines={1}>
            {record.victoryType?.split('—')[1]?.trim() ?? record.causeOfDeath}
          </Text>
        ) : null}

        <View style={h.statsRow}>
          <View style={h.statItem}>
            <Calendar size={11} color={Colors.text.dim} />
            <Text style={h.statText}>Turn {record.turnCount}</Text>
          </View>
          <View style={h.statItem}>
            <MapPin size={11} color={Colors.text.dim} />
            <Text style={h.statText}>Peak: {record.peakProvinces} provinces</Text>
          </View>
          <View style={[h.diffBadge, { backgroundColor: diff.color + '20' }]}>
            <Text style={[h.diffText, { color: diff.color }]}>{diff.label}</Text>
          </View>
        </View>

        <Text style={h.datePlayed}>{record.datePlayed}</Text>
      </View>
    </Animated.View>
  );
}

export default function HallOfFameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<PrestigeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrestigeRecords().then(r => {
      const sorted = [...r].sort((a, b) => b.finalScore - a.finalScore);
      setRecords(sorted);
      setLoading(false);
    });
  }, []);

  const bestVictory = records.find(r => r.outcome !== 'defeat');
  const totalRuns = records.length;
  const victories = records.filter(r => r.outcome !== 'defeat').length;
  const topScore = records.length > 0 ? records[0].finalScore : 0;

  return (
    <View style={[h.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0d1117', '#111a25', '#0d1117']} style={StyleSheet.absoluteFill} />

      <View style={h.header}>
        <View style={h.headerLeft}>
          <Trophy size={22} color={Colors.gold.bright} />
          <Text style={h.title}>Dynasty Chronicles</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={h.closeBtn}>
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={h.summaryRow}>
        <View style={h.summaryCard}>
          <Star size={16} color={Colors.gold.bright} />
          <Text style={h.summaryValue}>{topScore > 0 ? topScore.toLocaleString() : '—'}</Text>
          <Text style={h.summaryLabel}>Top Score</Text>
        </View>
        <View style={h.summaryCard}>
          <TrendingUp size={16} color={Colors.status.success} />
          <Text style={h.summaryValue}>{totalRuns}</Text>
          <Text style={h.summaryLabel}>Runs</Text>
        </View>
        <View style={h.summaryCard}>
          <Crown size={16} color={Colors.gold.dim} />
          <Text style={h.summaryValue}>{victories}</Text>
          <Text style={h.summaryLabel}>Victories</Text>
        </View>
      </View>

      {!loading && records.length === 0 && (
        <View style={h.emptyState}>
          <Text style={h.emptyIcon}>📜</Text>
          <Text style={h.emptyTitle}>No chronicles yet</Text>
          <Text style={h.emptyDesc}>
            Complete a game — victory or defeat — to begin your dynasty's legacy.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {records.map((record, idx) => (
          <RunCard key={record.id} record={record} rank={idx + 1} index={idx} />
        ))}
      </ScrollView>
    </View>
  );
}

const h = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 20, fontWeight: '800' as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.text.primary },
  summaryLabel: { fontSize: 9, color: Colors.text.secondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.primary, overflow: 'hidden' as const },
  topCard: { borderColor: Colors.gold.dim + '80' },
  defeatCard: { opacity: 0.75 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: { width: 28, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '800' as const, color: Colors.text.primary },
  outcomeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  outcomeBadgeIcon: { fontSize: 12 },
  outcomeBadgeText: { fontSize: 10, fontWeight: '700' as const },
  dynastyName: { fontSize: 14, fontWeight: '700' as const, color: Colors.text.primary },
  rulerName: { fontSize: 11, color: Colors.text.secondary },
  scoreBox: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.text.primary },
  scoreLabel: { fontSize: 9, color: Colors.text.dim, textTransform: 'uppercase' as const },
  outcomeDesc: { fontSize: 11, fontStyle: 'italic' as const, marginTop: 6, marginLeft: 38, lineHeight: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: Colors.text.secondary },
  diffBadge: { marginLeft: 'auto' as any, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '700' as const },
  datePlayed: { fontSize: 10, color: Colors.text.dim, marginTop: 6, textAlign: 'right' as const },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text.secondary, textAlign: 'center' as const },
  emptyDesc: { fontSize: 13, color: Colors.text.dim, textAlign: 'center' as const, lineHeight: 20 },
});
