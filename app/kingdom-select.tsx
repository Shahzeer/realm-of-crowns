import React, { useRef, useEffect, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Shield, Star, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";

import { useGame } from "@/providers/GameProvider";
import { KINGDOM_CHOICES } from "@/mocks/gameData";
import { KingdomChoice } from "@/types/game";


function KingdomCard({ kingdom, onSelect, index }: { kingdom: KingdomChoice; onSelect: () => void; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 120, useNativeDriver: true, tension: 50, friction: 10 }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  const ruler = kingdom.ruler;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={ks.card}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`kingdom-${kingdom.id}`}
      >
        <LinearGradient
          colors={[kingdom.color + '25', Colors.bg.card, Colors.bg.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={ks.cardTop}>
          <View style={[ks.crestCircle, { backgroundColor: kingdom.color + '30', borderColor: kingdom.color }]}>
            <Text style={ks.crestText}>{kingdom.crest}</Text>
          </View>
          <View style={ks.cardTitleArea}>
            <Text style={ks.kingdomName}>{kingdom.name}</Text>
            <Text style={ks.dynastyText}>{kingdom.dynasty}</Text>
          </View>
        </View>

        <Text style={ks.description}>{kingdom.description}</Text>

        <View style={ks.rulerSection}>
          <Text style={ks.rulerLabel}>RULER</Text>
          <View style={ks.rulerRow}>
            <Text style={ks.rulerName}>{ruler.name}</Text>
            <Text style={ks.rulerAge}>Age {ruler.age}</Text>
          </View>
          <View style={ks.statsRow}>
            <View style={ks.statItem}><Text style={ks.statEmoji}>🗣️</Text><Text style={ks.statVal}>{ruler.diplomacy}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>⚔️</Text><Text style={ks.statVal}>{ruler.martial}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>💰</Text><Text style={ks.statVal}>{ruler.stewardship}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>🗡️</Text><Text style={ks.statVal}>{ruler.intrigue}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>📖</Text><Text style={ks.statVal}>{ruler.learning}</Text></View>
          </View>
        </View>

        <View style={ks.infoRow}>
          <View style={ks.infoItem}>
            <Shield size={12} color={Colors.text.dim} />
            <Text style={ks.infoText}>{kingdom.startingProvinces.length} provinces</Text>
          </View>
          <View style={ks.infoItem}>
            <Star size={12} color={Colors.gold.dim} />
            <Text style={ks.infoText}>{kingdom.bonuses}</Text>
          </View>
        </View>

        <View style={[ks.selectRow, { borderTopColor: kingdom.color + '30' }]}>
          <Text style={[ks.selectText, { color: kingdom.color }]}>Select Kingdom</Text>
          <ChevronRight size={18} color={kingdom.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const GAME_DIFFICULTY_COLORS: Record<string, string> = {
  easy: Colors.status.success,
  normal: Colors.status.warning,
  hard: Colors.crimson.bright,
};

export default function KingdomSelectGuard() {
  return <KingdomSelectScreen />;
}


function KingdomSelectScreen() {
  console.log("[RealmOfCrowns] Kingdom Select render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectKingdom, state, isLoaded } = useGame();
  const titleAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-20)).current;
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const hasSavedGame = isLoaded && state.gameStarted;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelect = useCallback((kingdomId: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    selectKingdom(kingdomId, difficulty);
    router.replace('/');
  }, [selectKingdom, router, difficulty]);

  const handleContinue = useCallback(() => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    router.replace('/');
  }, [router]);

  return (
    <View style={[ks.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0a0e14', '#111820', '#0d1117']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[ks.headerSection, { opacity: titleAnim, transform: [{ translateY: titleSlide }] }]}>
        <Text style={ks.crownEmoji}>👑</Text>
        <Text style={ks.mainTitle}>REALM OF CROWNS</Text>
        {hasSavedGame ? (
          <TouchableOpacity
            style={ks.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
            testID="continue-game-btn"
          >
            <LinearGradient
              colors={['#8b6914', '#d4a574', '#8b6914']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ks.continueGradient}
            >
              <ChevronRight size={18} color={Colors.bg.primary} />
              <Text style={ks.continueText}>Continue — Turn {state.turn}, {state.year} AD</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
        <Text style={ks.subtitle}>{hasSavedGame ? 'Or start a new game below:' : 'Choose your kingdom wisely. Each realm offers unique strengths and challenges.'}</Text>
        <View style={ks.difficultyRow}>
          {(['easy', 'normal', 'hard'] as const).map(d => (
            <TouchableOpacity
              key={d}
              style={[ks.difficultyBtn, difficulty === d && { borderColor: GAME_DIFFICULTY_COLORS[d], backgroundColor: GAME_DIFFICULTY_COLORS[d] + '15' }]}
              onPress={() => setDifficulty(d)}
              activeOpacity={0.7}
            >
              <Text style={[ks.difficultyBtnText, difficulty === d && { color: GAME_DIFFICULTY_COLORS[d] }]}>
                {d.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ks.difficultyHint}>
          {difficulty === 'easy' ? 'More resources, weaker AI' : difficulty === 'hard' ? 'Fewer resources, aggressive AI' : 'Balanced experience'}
        </Text>
      </Animated.View>

      <ScrollView
        style={ks.scrollArea}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {KINGDOM_CHOICES.map((kingdom, idx) => (
          <KingdomCard
            key={kingdom.id}
            kingdom={kingdom}
            index={idx}
            onSelect={() => handleSelect(kingdom.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const ks = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  headerSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 32 },
  crownEmoji: { fontSize: 48, marginBottom: 8 },
  mainTitle: { fontSize: 26, fontWeight: "900" as const, color: Colors.gold.bright, letterSpacing: 3, textAlign: "center" as const },
  subtitle: { fontSize: 13, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 19, marginTop: 8 },
  continueButton: { width: '100%', borderRadius: 14, overflow: 'hidden' as const, marginTop: 12, marginBottom: 4 },
  continueGradient: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 16, gap: 8 },
  continueText: { fontSize: 16, fontWeight: '800' as const, color: Colors.bg.primary, letterSpacing: 0.5 },
  scrollArea: { flex: 1 },
  card: { marginBottom: 16, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border.primary, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  crestCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  crestText: { fontSize: 26 },
  cardTitleArea: { flex: 1, gap: 2 },
  kingdomName: { fontSize: 17, fontWeight: "800" as const, color: Colors.text.primary },
  dynastyText: { fontSize: 12, color: Colors.text.secondary },
  description: { fontSize: 12, color: Colors.text.secondary, lineHeight: 18, marginTop: 12 },
  rulerSection: { marginTop: 14, backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 10 },
  rulerLabel: { fontSize: 9, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 1.5, marginBottom: 6 },
  rulerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rulerName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  rulerAge: { fontSize: 11, color: Colors.text.dim },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: Colors.bg.card, borderRadius: 6, paddingVertical: 5 },
  statEmoji: { fontSize: 11 },
  statVal: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  infoRow: { flexDirection: "row", gap: 12, marginTop: 12, flexWrap: "wrap" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 11, color: Colors.text.dim },
  selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  selectText: { fontSize: 14, fontWeight: "700" as const },
  difficultyRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  difficultyBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: Colors.border.primary, backgroundColor: Colors.bg.card },
  difficultyBtnText: { fontSize: 11, fontWeight: "800" as const, color: Colors.text.dim, letterSpacing: 1 },
  difficultyHint: { fontSize: 11, color: Colors.text.dim, marginTop: 6 },
});
