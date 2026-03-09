import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, BookOpen } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

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

export default function ChronicleScreen() {
  console.log("[RealmOfCrowns] Chronicle render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

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

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {state.log.map((entry, idx) => {
            const icon = getLogIcon(entry);
            const color = getLogColor(entry);
            const isYearEntry = entry.startsWith('Year');

            return (
              <View key={`log-${idx}`} style={[s.logEntry, isYearEntry && s.logEntryYear]}>
                <View style={[s.logIconBox, { backgroundColor: color + '15' }]}>
                  <Text style={s.logIcon}>{icon}</Text>
                </View>
                <View style={s.logContent}>
                  <Text style={[s.logText, isYearEntry && { color: Colors.gold.dim, fontWeight: '700' as const }]}>
                    {entry}
                  </Text>
                </View>
                <View style={[s.logTimeline, { backgroundColor: color + '30' }]} />
              </View>
            );
          })}

          {state.log.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📜</Text>
              <Text style={s.emptyTitle}>The Chronicle Awaits</Text>
              <Text style={s.emptyDesc}>Your deeds will be recorded here for posterity.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  summaryValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const, marginTop: 2 },
  logEntry: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.primary + '40' },
  logEntryYear: { backgroundColor: Colors.gold.dim + '08' },
  logIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  logIcon: { fontSize: 14 },
  logContent: { flex: 1 },
  logText: { fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  logTimeline: { width: 3, borderRadius: 2, alignSelf: "stretch" },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const },
});
