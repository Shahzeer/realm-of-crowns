import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, CheckCircle, Link, ChevronRight, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { EventChoice, GameEvent } from "@/types/game";

const EVENT_ICONS: Record<string, string> = {
  political: '🏛️', military: '⚔️', religious: '🙏',
  economic: '💰', personal: '👤', dynasty: '👑',
};
const EVENT_COLORS: Record<string, string> = {
  political: Colors.status.info, military: Colors.crimson.bright,
  religious: Colors.faith.light, economic: Colors.gold.bright,
  personal: '#8b5cf6', dynasty: '#e07c3a',
};

function EventCard({ event, onChoice, resolved, index, onOpenPressures, onDismiss }: {
  event: GameEvent;
  onChoice: (id: string, c: EventChoice) => void;
  resolved: boolean;
  index: number;
  onOpenPressures: () => void;
  onDismiss?: () => void;
}) {
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
  const isChain = !!event.isChainEvent;
  const isNobleDemand = event.title.startsWith('Noble Demands:') ||
    event.choices.some(c => c.id.startsWith('nd_grant_') || c.id.startsWith('nd_refuse_') || c.id.startsWith('nd_imprison_'));

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[ev.eventCard, resolved && ev.eventCardResolved, !resolved && { borderColor: typeColor + '40' }]}>
        <View style={ev.eventHeader}>
          <View style={[ev.eventIconBox, { backgroundColor: typeColor + '20' }]}>
            <Text style={ev.eventIcon}>{EVENT_ICONS[event.type] ?? '📋'}</Text>
          </View>
          <View style={ev.eventTitleArea}>
            <View style={ev.titleRow}>
              <Text style={ev.eventTitle} numberOfLines={1}>{event.title}</Text>
              {isChain && (
                <View style={ev.chainBadge}>
                  <Link size={10} color={Colors.gold.bright} />
                  <Text style={ev.chainBadgeText}>Chain</Text>
                </View>
              )}
            </View>
            <View style={ev.eventMeta}>
              <Text style={[ev.eventType, { color: typeColor }]}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </Text>
              {event.chainStep && event.chainStep > 1 && (
                <Text style={[ev.eventStep, { color: typeColor }]}>Step {event.chainStep}</Text>
              )}
              <Text style={ev.eventTurn}>Turn {event.turn}</Text>
            </View>
          </View>
          {resolved && <CheckCircle size={18} color={Colors.status.success} />}
        </View>
        <Text style={ev.eventDesc}>{event.description}</Text>
        {!resolved && (
          isNobleDemand ? (
            <View style={ev.nobleDemandActions}>
              <TouchableOpacity style={ev.openPressuresBtn} onPress={onOpenPressures} activeOpacity={0.8}>
                <Crown size={15} color={Colors.gold.bright} />
                <Text style={ev.openPressuresBtnText}>Open Pressures</Text>
                <ChevronRight size={15} color={Colors.gold.bright} />
              </TouchableOpacity>
              {onDismiss && (
                <TouchableOpacity style={ev.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
                  <X size={16} color={Colors.text.dim} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={ev.choicesArea}>
              {event.choices.map((choice) => (
                <TouchableOpacity
                  key={choice.id}
                  style={[ev.choiceBtn, choice.followUpEventId ? ev.choiceBtnChain : null]}
                  onPress={() => onChoice(event.id, choice)}
                  activeOpacity={0.7}
                >
                  <View style={ev.choiceHeader}>
                    <Text style={ev.choiceText}>{choice.text}</Text>
                    {choice.followUpEventId && (
                      <ChevronRight size={14} color={Colors.gold.dim} />
                    )}
                  </View>
                  <Text style={ev.choiceEffect}>{choice.effects}</Text>
                  {choice.followUpEventId && (
                    <Text style={ev.chainHint}>Triggers follow-up in {choice.followUpDelay ?? '?'} turns</Text>
                  )}
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
          )
        )}
      </View>
    </Animated.View>
  );
}

type FilterType = 'all' | 'political' | 'military' | 'religious' | 'economic' | 'personal' | 'dynasty';

export default function EventsScreen() {
  console.log("[RealmOfCrowns] Events render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, resolveEvent, dismissEvent, unseenEvents } = useGame();
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');

  const handleChoice = useCallback((eventId: string, choice: EventChoice) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    resolveEvent(eventId, choice);
  }, [resolveEvent]);

  const seenEvents = useMemo(() => state.events.filter(e => e.seen), [state.events]);

  const resolvedDisputeIds = useMemo(
    () => new Set(state.pressures.nobleDisputes.filter(d => d.resolved).map(d => `noble_dispute_${d.id}`)),
    [state.pressures.nobleDisputes]
  );

  const filteredUnseen = useMemo(() => {
    const base = unseenEvents.filter(e => !resolvedDisputeIds.has(e.id));
    if (activeFilter === 'all') return base;
    return base.filter(e => e.type === activeFilter);
  }, [unseenEvents, activeFilter, resolvedDisputeIds]);

  const filteredSeen = useMemo(() => {
    const base = activeFilter === 'all' ? seenEvents : seenEvents.filter(e => e.type === activeFilter);
    return base.slice(0, 15);
  }, [seenEvents, activeFilter]);

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📜' },
    { key: 'political', label: 'Political', icon: '🏛️' },
    { key: 'military', label: 'Military', icon: '⚔️' },
    { key: 'religious', label: 'Religious', icon: '🙏' },
    { key: 'economic', label: 'Economic', icon: '💰' },
    { key: 'dynasty', label: 'Dynasty', icon: '👑' },
    { key: 'personal', label: 'Personal', icon: '👤' },
  ];

  return (
    <View style={[ev.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#141420', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={ev.header}>
        <Text style={ev.title}>Events & Decisions</Text>
        <TouchableOpacity onPress={() => router.back()} style={ev.closeBtn} testID="close-events">
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={ev.filterBar}
        contentContainerStyle={ev.filterBarContent}
      >
        {filters.map(f => {
          const isActive = activeFilter === f.key;
          const color = f.key === 'all' ? Colors.gold.bright : (EVENT_COLORS[f.key] ?? Colors.text.secondary);
          return (
            <TouchableOpacity
              key={f.key}
              style={[ev.filterChip, isActive && { backgroundColor: color + '25', borderColor: color + '60' }]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={ev.filterIcon}>{f.icon}</Text>
              <Text style={[ev.filterLabel, isActive && { color }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {filteredUnseen.length > 0 && (
          <>
            <Text style={ev.sectionTitle}>⚡ Pending Decisions ({filteredUnseen.length})</Text>
            {filteredUnseen.map((e, i) => (
              <EventCard key={e.id} event={e} onChoice={handleChoice} resolved={false} index={i} onOpenPressures={() => router.push('/pressures')} onDismiss={() => dismissEvent(e.id)} />
            ))}
          </>
        )}
        {filteredUnseen.length === 0 && (
          <View style={ev.emptyState}>
            <Text style={ev.emptyIcon}>📜</Text>
            <Text style={ev.emptyTitle}>All Quiet in the Realm</Text>
            <Text style={ev.emptyDesc}>
              No events require your attention. Advance a turn to discover what fate has in store.
            </Text>
          </View>
        )}
        {filteredSeen.length > 0 && (
          <>
            <Text style={ev.sectionTitle}>Past Events</Text>
            {filteredSeen.map((e, i) => (
              <EventCard key={e.id} event={e} onChoice={handleChoice} resolved={true} index={i} onOpenPressures={() => router.push('/pressures')} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const ev = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.primary,
  },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card,
    alignItems: "center", justifyContent: "center",
  },
  filterBar: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  filterBarContent: { paddingHorizontal: 12, gap: 6, alignItems: "center" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.primary, backgroundColor: Colors.bg.secondary,
  },
  filterIcon: { fontSize: 12 },
  filterLabel: { fontSize: 11, fontWeight: "600" as const, color: Colors.text.secondary },
  sectionTitle: {
    fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim,
    textTransform: "uppercase" as const, letterSpacing: 1.5,
    paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  eventCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.bg.card,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border.gold,
  },
  eventCardResolved: { borderColor: Colors.border.primary, opacity: 0.65 },
  eventHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  eventIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eventIcon: { fontSize: 20 },
  eventTitleArea: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary, flexShrink: 1 },
  chainBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: Colors.gold.bright + '15', borderWidth: 1, borderColor: Colors.gold.bright + '30',
  },
  chainBadgeText: { fontSize: 9, fontWeight: "700" as const, color: Colors.gold.bright, letterSpacing: 0.5 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventType: { fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5 },
  eventStep: { fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5 },
  eventTurn: { fontSize: 10, color: Colors.text.dim },
  eventDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 19, marginTop: 10 },
  choicesArea: { marginTop: 14, gap: 8 },
  choiceBtn: {
    backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border.primary,
  },
  choiceBtnChain: { borderColor: Colors.gold.dim + '40', borderLeftWidth: 3, borderLeftColor: Colors.gold.bright + '60' },
  choiceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  choiceText: { fontSize: 14, fontWeight: "600" as const, color: Colors.gold.primary, flex: 1 },
  choiceEffect: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
  chainHint: {
    fontSize: 10, fontWeight: "600" as const, color: Colors.gold.dim,
    marginTop: 4, fontStyle: "italic" as const,
  },
  choiceCostRow: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" as const },
  choiceCost: { fontSize: 11, color: Colors.crimson.bright },
  choiceReward: { fontSize: 11, color: Colors.status.success },
  nobleDemandActions: { flexDirection: "row" as const, alignItems: "center", marginTop: 14, gap: 8 },
  openPressuresBtn: {
    flex: 1, flexDirection: "row" as const, alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1,
    borderColor: Colors.gold.bright + '50', backgroundColor: Colors.gold.bright + '12',
  },
  openPressuresBtnText: { fontSize: 14, fontWeight: "700" as const, color: Colors.gold.bright, flex: 1, textAlign: "center" as const },
  dismissBtn: {
    width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border.primary, backgroundColor: Colors.bg.tertiary,
  },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  emptyDesc: {
    fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const,
    maxWidth: 280, lineHeight: 20,
  },
});
