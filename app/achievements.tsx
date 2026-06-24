import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Trophy, Lock } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

const CATEGORY_COLORS: Record<string, string> = {
  military: Colors.crimson.bright,
  economy: Colors.gold.bright,
  diplomacy: Colors.status.info,
  expansion: Colors.status.success,
  survival: '#8b5cf6',
};

export default function AchievementsScreen() {
  console.log("[RealmOfCrowns] Achievements render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const unlockedCount = state.achievements.filter(a => a.unlocked).length;
  const totalCount = state.achievements.length;
  const categories = ['military', 'economy', 'diplomacy', 'expansion', 'survival'] as const;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#1a1510', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Trophy size={22} color={Colors.gold.bright} />
          <Text style={s.title}>Achievements</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} testID="close-achievements">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={s.progressSection}>
        <View style={s.progressHeader}>
          <Text style={s.progressLabel}>{unlockedCount}/{totalCount} Unlocked</Text>
          <Text style={s.progressPercent}>{Math.round((unlockedCount / totalCount) * 100)}%</Text>
        </View>
        <View style={s.progressBarBg}>
          <Animated.View style={[s.progressBarFill, { width: `${(unlockedCount / totalCount) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {categories.map(cat => {
            const catAchievements = state.achievements.filter(a => a.category === cat);
            const catColor = CATEGORY_COLORS[cat] || Colors.text.dim;
            const catUnlocked = catAchievements.filter(a => a.unlocked).length;

            return (
              <View key={cat}>
                <View style={s.categoryHeader}>
                  <Text style={[s.categoryTitle, { color: catColor }]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                  <Text style={s.categoryCount}>{catUnlocked}/{catAchievements.length}</Text>
                </View>
                {catAchievements.map((ach, idx) => (
                  <AchievementCard key={ach.id} achievement={ach} index={idx} catColor={catColor} />
                ))}
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function AchievementCard({ achievement, index, catColor }: {
  achievement: { id: string; name: string; description: string; icon: string; unlocked: boolean; unlockedTurn?: number };
  index: number;
  catColor: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[s.achCard, achievement.unlocked && { borderColor: catColor + '40', backgroundColor: catColor + '08' }]}>
        <View style={[s.achIconBox, { backgroundColor: achievement.unlocked ? catColor + '20' : Colors.bg.tertiary }]}>
          {achievement.unlocked ? (
            <Text style={s.achIcon}>{achievement.icon}</Text>
          ) : (
            <Lock size={18} color={Colors.text.dim} />
          )}
        </View>
        <View style={s.achInfo}>
          <Text style={[s.achName, !achievement.unlocked && { color: Colors.text.dim }]}>{achievement.name}</Text>
          <Text style={s.achDesc}>{achievement.description}</Text>
          {achievement.unlocked && achievement.unlockedTurn && (
            <Text style={[s.achTurn, { color: catColor }]}>Unlocked on turn {achievement.unlockedTurn}</Text>
          )}
        </View>
        {achievement.unlocked && (
          <View style={[s.achCheckmark, { backgroundColor: catColor }]}>
            <Text style={s.achCheckText}>✓</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  progressSection: { marginHorizontal: 16, marginTop: 14, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.gold.dim + '30' },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  progressPercent: { fontSize: 14, fontWeight: "800" as const, color: Colors.gold.bright },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4, backgroundColor: Colors.gold.bright },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  categoryTitle: { fontSize: 13, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 1.5 },
  categoryCount: { fontSize: 11, color: Colors.text.dim },
  achCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: Colors.border.primary },
  achIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  achIcon: { fontSize: 22 },
  achInfo: { flex: 1, gap: 2 },
  achName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  achDesc: { fontSize: 11, color: Colors.text.secondary },
  achTurn: { fontSize: 10, fontWeight: "600" as const, marginTop: 2 },
  achCheckmark: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  achCheckText: { fontSize: 14, fontWeight: "800" as const, color: '#fff' },
});
