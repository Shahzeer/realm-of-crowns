import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown, Shield, Coins, MapPin, Swords, TrendingUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

interface RankedKingdom {
  id: string;
  name: string;
  crest: string;
  color: string;
  isPlayer: boolean;
  militaryPower: number;
  provinces: number;
  treasury: number;
  totalPower: number;
  attitude: string;
  rulerName: string;
}

function RankCard({ kingdom, rank, maxPower, index }: {
  kingdom: RankedKingdom;
  rank: number;
  maxPower: number;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 100, useNativeDriver: true, tension: 50, friction: 10 }),
    ]).start();
    Animated.timing(barAnim, { toValue: 1, duration: 800, delay: index * 100 + 300, useNativeDriver: false }).start();
  }, []);

  const powerPercent = maxPower > 0 ? (kingdom.totalPower / maxPower) * 100 : 0;
  const getRankIcon = (r: number) => {
    if (r === 1) return '👑';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return `#${r}`;
  };

  const attitudeColor = kingdom.attitude === 'war' ? '#ff4444' :
    kingdom.attitude === 'allied' ? Colors.status.success :
    kingdom.attitude === 'friendly' ? Colors.status.success :
    kingdom.attitude === 'hostile' ? Colors.status.danger : Colors.text.dim;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[r.card, kingdom.isPlayer && r.playerCard]}>
        {kingdom.isPlayer && (
          <LinearGradient
            colors={[Colors.gold.dim + '15', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={r.cardHeader}>
          <View style={r.rankBadge}>
            <Text style={r.rankText}>{getRankIcon(rank)}</Text>
          </View>
          <View style={[r.crestCircle, { backgroundColor: kingdom.color + '25', borderColor: kingdom.color }]}>
            <Text style={r.crestEmoji}>{kingdom.crest}</Text>
          </View>
          <View style={r.nameArea}>
            <View style={r.nameRow}>
              <Text style={[r.kingdomName, kingdom.isPlayer && { color: Colors.gold.bright }]}>{kingdom.name}</Text>
              {kingdom.isPlayer && <Text style={r.youBadge}>YOU</Text>}
            </View>
            <Text style={r.rulerName}>{kingdom.rulerName}</Text>
          </View>
          {!kingdom.isPlayer && (
            <View style={[r.attitudeBadge, { backgroundColor: attitudeColor + '15', borderColor: attitudeColor + '40' }]}>
              <Text style={[r.attitudeText, { color: attitudeColor }]}>{kingdom.attitude.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={r.powerBarSection}>
          <View style={r.powerLabelRow}>
            <Text style={r.powerLabel}>Total Power</Text>
            <Text style={[r.powerValue, kingdom.isPlayer && { color: Colors.gold.bright }]}>{kingdom.totalPower.toLocaleString()}</Text>
          </View>
          <View style={r.barBg}>
            <Animated.View style={[r.barFill, {
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${powerPercent}%`] }),
              backgroundColor: kingdom.isPlayer ? Colors.gold.primary : kingdom.color,
            }]} />
          </View>
        </View>

        <View style={r.statsRow}>
          <View style={r.statBlock}>
            <Swords size={13} color={Colors.crimson.bright} />
            <Text style={r.statValue}>{kingdom.militaryPower.toLocaleString()}</Text>
            <Text style={r.statLabel}>Military</Text>
          </View>
          <View style={r.statBlock}>
            <MapPin size={13} color={Colors.status.info} />
            <Text style={r.statValue}>{kingdom.provinces}</Text>
            <Text style={r.statLabel}>Provinces</Text>
          </View>
          <View style={r.statBlock}>
            <Coins size={13} color={Colors.gold.bright} />
            <Text style={r.statValue}>{kingdom.treasury.toLocaleString()}</Text>
            <Text style={r.statLabel}>Treasury</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function RankingsScreen() {
  console.log("[RealmOfCrowns] Rankings render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playerProvinces } = useGame();

  const rankings = useMemo(() => {
    const playerMilitary = state.armies.reduce((s, a) => s + a.troops, 0) +
      playerProvinces.reduce((s, p) => s + p.garrison, 0);
    const playerTreasury = state.resources.gold;

    const playerEntry: RankedKingdom = {
      id: 'player',
      name: state.selectedKingdom ? state.selectedKingdom.charAt(0).toUpperCase() + state.selectedKingdom.slice(1) : 'Your Kingdom',
      crest: '👑',
      color: Colors.gold.primary,
      isPlayer: true,
      militaryPower: playerMilitary,
      provinces: playerProvinces.length,
      treasury: playerTreasury,
      totalPower: playerMilitary + playerProvinces.length * 200 + playerTreasury,
      attitude: 'player',
      rulerName: state.ruler.name,
    };

    const aiEntries: RankedKingdom[] = state.kingdoms.map(k => {
      const kProvinces = state.provinces.filter(p => p.owner === k.id);
      const kMilitary = k.armies.reduce((s, a) => s + a.troops, 0) +
        kProvinces.reduce((s, p) => s + p.garrison, 0);
      return {
        id: k.id,
        name: k.name,
        crest: k.crest,
        color: k.color,
        isPlayer: false,
        militaryPower: kMilitary,
        provinces: kProvinces.length,
        treasury: k.treasury,
        totalPower: kMilitary + kProvinces.length * 200 + k.treasury,
        attitude: k.attitude,
        rulerName: k.ruler.name,
      };
    });

    return [playerEntry, ...aiEntries].sort((a, b) => b.totalPower - a.totalPower);
  }, [state.kingdoms, state.armies, state.provinces, state.resources.gold, state.ruler.name, state.selectedKingdom, playerProvinces]);

  const maxPower = rankings.length > 0 ? rankings[0].totalPower : 1;
  const playerRank = rankings.findIndex(r => r.isPlayer) + 1;

  return (
    <View style={[r.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0d1117', '#111a25', '#0d1117']} style={StyleSheet.absoluteFill} />

      <View style={r.header}>
        <View style={r.headerLeft}>
          <TrendingUp size={22} color={Colors.gold.bright} />
          <Text style={r.title}>Realm Rankings</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={r.closeBtn} testID="close-rankings">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={r.summaryRow}>
        <View style={[r.summaryCard, { borderColor: Colors.gold.dim + '60' }]}>
          <Crown size={18} color={Colors.gold.bright} />
          <Text style={r.summaryValue}>#{playerRank}</Text>
          <Text style={r.summaryLabel}>Your Rank</Text>
        </View>
        <View style={r.summaryCard}>
          <Shield size={18} color={Colors.crimson.bright} />
          <Text style={r.summaryValue}>{rankings.length}</Text>
          <Text style={r.summaryLabel}>Realms</Text>
        </View>
        <View style={r.summaryCard}>
          <Swords size={18} color={Colors.status.info} />
          <Text style={r.summaryValue}>{state.kingdoms.filter(k => k.attitude === 'war').length}</Text>
          <Text style={r.summaryLabel}>Wars</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {rankings.map((kingdom, idx) => (
          <RankCard
            key={kingdom.id}
            kingdom={kingdom}
            rank={idx + 1}
            maxPower={maxPower}
            index={idx}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const r = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", gap: 4, borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  summaryLabel: { fontSize: 9, color: Colors.text.secondary, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.primary, overflow: "hidden" },
  playerCard: { borderColor: Colors.gold.dim + '80' },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankBadge: { width: 28, alignItems: "center" },
  rankText: { fontSize: 16, fontWeight: "800" as const, color: Colors.text.primary },
  crestCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  crestEmoji: { fontSize: 20 },
  nameArea: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  kingdomName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  youBadge: { fontSize: 8, fontWeight: "800" as const, color: Colors.gold.bright, backgroundColor: Colors.gold.dim + '30', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, letterSpacing: 1, overflow: "hidden" },
  rulerName: { fontSize: 11, color: Colors.text.secondary },
  attitudeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  attitudeText: { fontSize: 8, fontWeight: "700" as const, letterSpacing: 0.5 },
  powerBarSection: { marginTop: 12 },
  powerLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  powerLabel: { fontSize: 10, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1 },
  powerValue: { fontSize: 13, fontWeight: "800" as const, color: Colors.text.primary },
  barBg: { height: 8, borderRadius: 4, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  statsRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  statBlock: { flex: 1, alignItems: "center", gap: 3, backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingVertical: 8 },
  statValue: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  statLabel: { fontSize: 8, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 0.5 },
});
