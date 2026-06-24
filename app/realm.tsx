import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, BookOpen, Users, Sparkles, ShieldAlert, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

export default function RealmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, unseenEvents, currentResearch } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const pressureBadge =
    (state.pressures.corruption > 60 ? 1 : 0) +
    (state.pressures.nobleDisputes.filter((d) => !d.resolved).length > 0 ? 1 : 0) +
    (state.pressures.plague ? 1 : 0) +
    (state.pressures.warExhaustion > 50 ? 1 : 0);

  const items = [
    {
      path: "/technology",
      icon: <BookOpen size={28} color={Colors.status.info} />,
      bg: Colors.status.info + "20",
      accent: Colors.status.info,
      title: "Research",
      sub: currentResearch ? `Studying: ${currentResearch.name}` : "No active research",
      emoji: "📚",
      badge: 0,
    },
    {
      path: "/council",
      icon: <Users size={28} color="#a78bfa" />,
      bg: "#a78bfa18",
      accent: "#a78bfa",
      title: "Council",
      sub: `${state.council.length} advisors serving`,
      emoji: "🏛️",
      badge: 0,
    },
    {
      path: "/faith",
      icon: <Sparkles size={28} color={Colors.faith.light} />,
      bg: Colors.faith.purple + "20",
      accent: Colors.faith.light,
      title: "Faith",
      sub: `${state.resources.faith} faith points`,
      emoji: "✝️",
      badge: 0,
    },
    {
      path: "/pressures",
      icon: <ShieldAlert size={28} color={Colors.status.warning} />,
      bg: Colors.status.warning + "18",
      accent: Colors.status.warning,
      title: "Pressures",
      sub: pressureBadge > 0 ? `${pressureBadge} active concern${pressureBadge > 1 ? "s" : ""}` : "Kingdom is stable",
      emoji: "⚠️",
      badge: pressureBadge,
    },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, "#0e1018", Colors.bg.primary]} style={StyleSheet.absoluteFill} />

      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerEmoji}>🏰</Text>
          <Text style={s.title}>Realm</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <Text style={s.subtitle}>Manage the internal affairs of your kingdom</Text>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, gap: 12 }}>
          {items.map((item) => (
            <TouchableOpacity key={item.path} style={s.card} onPress={() => router.push(item.path as any)} activeOpacity={0.75}>
              <LinearGradient colors={[Colors.bg.card, Colors.bg.tertiary]} style={StyleSheet.absoluteFill} />
              <View style={[s.iconWrap, { backgroundColor: item.bg }]}>
                {item.icon}
                {item.badge > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <View style={s.cardBody}>
                <Text style={[s.cardTitle, { color: item.accent }]}>{item.title}</Text>
                <Text style={s.cardSub}>{item.sub}</Text>
              </View>
              <ChevronRight size={18} color={Colors.text.dim} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerEmoji: { fontSize: 22 },
  title: { fontSize: 22, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { padding: 6, borderRadius: 20, backgroundColor: Colors.bg.card },
  subtitle: { fontSize: 12, color: Colors.text.dim, paddingHorizontal: 16, marginBottom: 20, letterSpacing: 0.3 },
  content: { paddingHorizontal: 16 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 18,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border.primary,
    overflow: "hidden",
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: Colors.crimson.bright, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "800" as const, color: "#fff" },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 17, fontWeight: "800" as const },
  cardSub: { fontSize: 12, color: Colors.text.secondary },
});
