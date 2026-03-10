import React, { useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { EventChoice, GameEvent } from "@/types/game";

const EVENT_ICONS: Record<string, string> = { political: '🏛️', military: '⚔️', religious: '🙏', economic: '💰', personal: '👤' };
const EVENT_COLORS: Record<string, string> = { political: Colors.status.info, military: Colors.crimson.bright, religious: Colors.faith.light, economic: Colors.gold.bright, personal: '#8b5cf6' };

function EventCard({ event, onChoice, resolved, index }: { event: GameEvent; onChoice: (id: string, c: EventChoice) => void; resolved: boolean; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
    if (!resolved) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const typeColor = EVENT_COLORS[event.type] || Colors.text.secondary;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[ev.eventCard, resolved && ev.eventCardResolved, !resolved && { borderColor: typeColor + '40' }]}>
        <View style={ev.eventHeader}>
          <View style={[ev.eventIconBox, { backgroundColor: typeColor + '20' }]}>
            <Text style={ev.eventIcon}>{EVENT_ICONS[event.type] ?? '📋'}</Text>
          </View>
          <View style={ev.eventTitleArea}>
            <Text style={ev.eventTitle}>{event.title}</Text>
            <View style={ev.eventMeta}>
              <Text style={[ev.eventType, { color: typeColor }]}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Text>
              <Text style={ev.eventTurn}>Turn {event.turn}</Text>
            </View>
          </View>
          {resolved && <CheckCircle size={18} color={Colors.status.success} />}
        </View>
        <Text style={ev.eventDesc}>{event.description}</Text>
        {!resolved && (
          <View style={ev.choicesArea}>
            {event.choices.map((choice) => (
              <TouchableOpacity key={choice.id} style={ev.choiceBtn} onPress={() => onChoice(event.id, choice)} activeOpacity={0.7}>
                <Text style={ev.choiceText}>{choice.text}</Text>
                <Text style={ev.choiceEffect}>{choice.effects}</Text>
                <View style={ev.choiceCostRow}>
                  {choice.cost && Object.entries(choice.cost).map(([k, v]) => (
                    <Text key={k} style={ev.choiceCost}>-{v} {k}</Text>
                  ))}
                  {choice.reward && Object.entries(choice.reward).map(([k, v]) => (
                    <Text key={k} style={ev.choiceReward}>+{v} {k}</Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function EventsScreen() {
  console.log("[RealmOfCrowns] Events render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, resolveEvent, unseenEvents } = useGame();

  const handleChoice = useCallback((eventId: string, choice: EventChoice) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    resolveEvent(eventId, choice);
  }, [resolveEvent]);

  const seenEvents = state.events.filter(e => e.seen);

  return (
    <View style={[ev.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#141420', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={ev.header}>
        <Text style={ev.title}>Events & Decisions</Text>
        <TouchableOpacity onPress={() => router.back()} style={ev.closeBtn} testID="close-events"><X size={22} color={Colors.text.secondary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {unseenEvents.length > 0 && (
          <>
            <Text style={ev.sectionTitle}>⚡ Pending Decisions</Text>
            {unseenEvents.map((e, i) => <EventCard key={e.id} event={e} onChoice={handleChoice} resolved={false} index={i} />)}
          </>
        )}
        {unseenEvents.length === 0 && (
          <View style={ev.emptyState}>
            <Text style={ev.emptyIcon}>📜</Text>
            <Text style={ev.emptyTitle}>All Quiet in the Realm</Text>
            <Text style={ev.emptyDesc}>No events require your attention. Advance a turn to discover what fate has in store.</Text>
          </View>
        )}
        {seenEvents.length > 0 && (
          <>
            <Text style={ev.sectionTitle}>Past Events</Text>
            {seenEvents.slice(0, 10).map((e, i) => <EventCard key={e.id} event={e} onChoice={handleChoice} resolved={true} index={i} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const ev = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  eventCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border.gold },
  eventCardResolved: { borderColor: Colors.border.primary, opacity: 0.65 },
  eventHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  eventIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eventIcon: { fontSize: 20 },
  eventTitleArea: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventType: { fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5 },
  eventTurn: { fontSize: 10, color: Colors.text.dim },
  eventDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 19, marginTop: 10 },
  choicesArea: { marginTop: 14, gap: 8 },
  choiceBtn: { backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.primary },
  choiceText: { fontSize: 14, fontWeight: "600" as const, color: Colors.gold.primary },
  choiceEffect: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
  choiceCostRow: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" },
  choiceCost: { fontSize: 11, color: Colors.crimson.bright },
  choiceReward: { fontSize: 11, color: Colors.status.success },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, maxWidth: 280, lineHeight: 20 },
});
