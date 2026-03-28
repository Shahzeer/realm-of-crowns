import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Modal, Alert } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Swords, Globe, ScrollText, Crown, ChevronRight, Play, BookOpen, Users, Shield, Flame, RotateCcw, ArrowRightLeft, Eye, Sparkles, Trophy, X, TrendingUp, Settings, ShieldAlert, AlertTriangle, Bug, Wheat, Skull } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { useAuth } from "@/providers/AuthProvider";
import ResourceBar from "@/components/ResourceBar";
import MapView from "@/components/MapView";
import GameToast from "@/components/GameToast";
import AchievementPopup from "@/components/AchievementPopup";
import ProvinceActionPopup from "@/components/ProvinceActionPopup";
import RumorCards from "@/components/RumorCards";
import { Province, Achievement, TurnSummary } from "@/types/game";
import { SEASON_EFFECTS } from "@/mocks/gameData";

function SeasonBadge({ season }: { season: string }) {
  const seasonIcons: Record<string, string> = { Spring: '🌸', Summer: '☀️', Autumn: '🍂', Winter: '❄️' };
  const seasonColors: Record<string, string> = { Spring: '#7bc96a', Summer: '#e8b94a', Autumn: '#d4774a', Winter: '#58a6ff' };
  return (
    <View style={[idx.seasonBadge, { backgroundColor: (seasonColors[season] || '#888') + '20' }]}>
      <Text style={idx.seasonIcon}>{seasonIcons[season] || '🌍'}</Text>
      <Text style={[idx.seasonLabel, { color: seasonColors[season] || '#888' }]}>{season}</Text>
    </View>
  );
}

function WarBanner({ wars }: { wars: Array<{ name: string; color: string }> }) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  if (wars.length === 0) return null;
  return (
    <Animated.View style={[idx.warBanner, { opacity: pulseAnim }]}>
      <Flame size={16} color="#ff4444" />
      <Text style={idx.warBannerText}>AT WAR with {wars.map(w => w.name).join(', ')}</Text>
    </Animated.View>
  );
}

function PressureIndicators({ pressures, onPress }: { pressures: { corruption: number; overstretch: number; famine: number; plague: { active: boolean; severity: number }; nobleDisputes: Array<{ resolved: boolean }> }; onPress: () => void }) {
  const indicators: Array<{ label: string; value: number; threshold: number; criticalThreshold: number; icon: React.ReactNode }> = [];
  if (pressures.corruption > 15) indicators.push({ label: 'Corruption', value: pressures.corruption, threshold: 30, criticalThreshold: 60, icon: <Bug size={12} color={pressures.corruption >= 60 ? Colors.crimson.bright : Colors.status.warning} /> });
  if (pressures.overstretch > 0) indicators.push({ label: 'Overstretch', value: pressures.overstretch, threshold: 20, criticalThreshold: 50, icon: <AlertTriangle size={12} color={pressures.overstretch >= 50 ? Colors.crimson.bright : Colors.status.warning} /> });
  if (pressures.famine > 10) indicators.push({ label: 'Famine', value: pressures.famine, threshold: 25, criticalThreshold: 50, icon: <Wheat size={12} color={pressures.famine >= 50 ? Colors.crimson.bright : Colors.status.warning} /> });
  if (pressures.plague.active) indicators.push({ label: 'Plague', value: pressures.plague.severity, threshold: 1, criticalThreshold: 50, icon: <Skull size={12} color={Colors.crimson.bright} /> });
  const unresolvedDisputes = pressures.nobleDisputes.filter(d => !d.resolved).length;
  if (unresolvedDisputes > 0) indicators.push({ label: `${unresolvedDisputes} Dispute${unresolvedDisputes > 1 ? 's' : ''}`, value: unresolvedDisputes * 25, threshold: 25, criticalThreshold: 75, icon: <Crown size={12} color={Colors.status.warning} /> });
  if (indicators.length === 0) return null;
  return (
    <TouchableOpacity style={idx.pressureStrip} onPress={onPress} activeOpacity={0.7} testID="pressure-indicators">
      {indicators.map((ind, i) => {
        const isCritical = ind.value >= ind.criticalThreshold;
        const color = isCritical ? Colors.crimson.bright : Colors.status.warning;
        return (
          <View key={i} style={[idx.pressureChip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            {ind.icon}
            <Text style={[idx.pressureChipText, { color }]}>{ind.label}</Text>
            <View style={[idx.pressureDot, { backgroundColor: color }]} />
          </View>
        );
      })}
    </TouchableOpacity>
  );
}

function TurnSummaryModal({ visible, onClose, summary }: { visible: boolean; onClose: () => void; summary: TurnSummary | undefined }) {
  if (!summary) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={idx.summaryOverlay}>
        <View style={idx.summaryCard}>
          <LinearGradient colors={['#1a1812', '#0d1117']} style={StyleSheet.absoluteFill} />
          <View style={idx.summaryHeader}>
            <Text style={idx.summaryTitle}>Turn {summary.turn} Summary</Text>
            <TouchableOpacity onPress={onClose} style={idx.summaryClose}><X size={20} color={Colors.text.secondary} /></TouchableOpacity>
          </View>
          <ScrollView style={idx.summaryScroll} showsVerticalScrollIndicator={false}>
            <View style={idx.summarySection}>
              <Text style={idx.summarySectionTitle}>Resources</Text>
              <View style={idx.summaryResourceRow}>
                <Text style={idx.summaryResource}>💰{summary.goldGained > 0 ? '+' : ''}{summary.goldGained}</Text>
                <Text style={idx.summaryResource}>🌾{summary.foodGained > 0 ? '+' : ''}{summary.foodGained}</Text>
                <Text style={idx.summaryResource}>⚔️{summary.militaryGained > 0 ? '+' : ''}{summary.militaryGained}</Text>
              </View>
            </View>
            {(summary.battlesWon > 0 || summary.battlesLost > 0) && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Battles</Text>
                {summary.battlesWon > 0 && <Text style={[idx.summaryDetail, { color: Colors.status.success }]}>⚔️ {summary.battlesWon} won</Text>}
                {summary.battlesLost > 0 && <Text style={[idx.summaryDetail, { color: Colors.crimson.bright }]}>💀 {summary.battlesLost} lost</Text>}
              </View>
            )}
            {summary.provincesConquered.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Conquered</Text>
                {summary.provincesConquered.map((p: string, i: number) => <Text key={i} style={[idx.summaryDetail, { color: Colors.status.success }]}>🏴 {p}</Text>)}
              </View>
            )}
            {summary.rumorsHeard && summary.rumorsHeard.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Rumors Heard</Text>
                {summary.rumorsHeard.map((r: string, i: number) => (
                  <View key={i} style={idx.summaryRumorRow}>
                    <Text style={idx.summaryRumorQuote}>"</Text>
                    <Text style={idx.summaryRumorText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
            {summary.spyResults && summary.spyResults.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Spy Reports</Text>
                {summary.spyResults.map((sr: string, i: number) => <Text key={i} style={idx.summaryDetail}>🕵️ {sr}</Text>)}
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={idx.summaryDismiss} onPress={onClose} activeOpacity={0.7}>
            <Text style={idx.summaryDismissText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function KingdomScreenGuard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={idx.root}>
        <LinearGradient colors={[Colors.bg.primary, Colors.bg.secondary, Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      </View>
    );
  }
  if (!isAuthenticated) return <Redirect href="/sign-in" />;

  return <KingdomScreen />;
}

function KingdomScreen() {
  console.log("[RealmOfCrowns] Kingdom screen render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, advanceTurn, unseenEvents, playerProvinces, activeWars, recentBattles, currentResearch, resetGame, dismissTutorial, newAchievements, recruitArmy, reinforceGarrison, visibilityMap, investigateRumor, dismissRumor } = useGame();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [showGameOver, setShowGameOver] = React.useState(false);
  const [showTurnSummary, setShowTurnSummary] = React.useState(false);
  const [toast, setToast] = React.useState<{ visible: boolean; message: string; type: 'success' | 'warning' | 'danger' | 'info' }>({ visible: false, message: '', type: 'info' });
  const [showEndTurnConfirm, setShowEndTurnConfirm] = React.useState(false);
  const [pendingAchievements, setPendingAchievements] = React.useState<Achievement[]>([]);
  const [selectedProvince, setSelectedProvince] = React.useState<Province | null>(null);
  const prevTurn = useRef(state.turn);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (unseenEvents.length > 0) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])).start();
    }
  }, [unseenEvents.length, pulseAnim]);

  useEffect(() => { if (state.gameOver || state.victory) setShowGameOver(true); }, [state.gameOver, state.victory]);
  useEffect(() => { if (state.gameStarted && !state.tutorialSeen) dismissTutorial(); }, [state.gameStarted, state.tutorialSeen]);

  useEffect(() => {
    if (state.turn > prevTurn.current && state.lastTurnSummary) {
      setShowTurnSummary(true);
      const summary = state.lastTurnSummary;
      if (summary.provincesLost.length > 0) setTimeout(() => setToast({ visible: true, message: `Province lost: ${summary.provincesLost.join(', ')}!`, type: 'danger' }), 500);
      else if (summary.provincesConquered.length > 0) setTimeout(() => setToast({ visible: true, message: `Conquered: ${summary.provincesConquered.join(', ')}!`, type: 'success' }), 500);
      if (newAchievements.length > 0) setTimeout(() => setPendingAchievements([...newAchievements]), 800);
    }
    prevTurn.current = state.turn;
  }, [state.turn, state.lastTurnSummary, newAchievements]);

  useEffect(() => {
    if (state.latestReignChronicle) {
      setTimeout(() => router.push('/reign-summary' as any), 1200);
    }
  }, [state.latestReignChronicle]);

  const handleAdvanceTurn = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEndTurnConfirm(true);
  }, []);
  const confirmAdvanceTurn = useCallback(() => {
    setShowEndTurnConfirm(false);
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advanceTurn();
  }, [advanceTurn]);
  const handleProvincePress = useCallback((province: Province) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvince(province);
  }, []);
  const handlePopupAction = useCallback((action: string, province: Province) => {
    setSelectedProvince(null);
    switch (action) {
      case 'details': case 'info': case 'build': router.push(`/province/${province.id}`); break;
      case 'recruit': {
        if (state.resources.gold < 400) { Alert.alert('Insufficient Gold'); return; }
        if (state.resources.military < 200) { Alert.alert('Insufficient Military'); return; }
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        recruitArmy(province.id, 200);
        setToast({ visible: true, message: `Army recruited at ${province.name}!`, type: 'success' });
        break;
      }
      case 'reinforce': {
        if (state.resources.gold < 100 || state.resources.military < 100) { Alert.alert('Insufficient Resources'); return; }
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        reinforceGarrison(province.id, 100);
        setToast({ visible: true, message: `+100 garrison at ${province.name}`, type: 'success' });
        break;
      }
      case 'attack': router.push('/armies' as any); break;
      case 'spy': router.push('/espionage' as any); break;
      case 'diplomacy': router.push('/diplomacy' as any); break;
      case 'trade': router.push('/trade' as any); break;
    }
  }, [router, state.resources, recruitArmy, reinforceGarrison]);
  const handlePopupClose = useCallback(() => setSelectedProvince(null), []);
  const navigateTo = useCallback((path: string) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, [router]);
  const handleReset = useCallback(async () => { await resetGame(); setShowGameOver(false); }, [resetGame]);

  const totalTroops = state.armies.reduce((sum, a) => sum + a.troops, 0);
  const totalPopulation = playerProvinces.reduce((sum, p) => sum + p.population, 0);
  const seasonEffect = SEASON_EFFECTS[state.season];
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;
  const pressureBadge = (state.pressures.plague.active ? 1 : 0) + state.pressures.nobleDisputes.filter(d => !d.resolved).length;
  const pressureSub = state.pressures.plague.active ? 'Plague!' : state.pressures.corruption > 30 ? 'Corruption' : 'Stable';

  if (!state.gameStarted) return <Redirect href="/kingdom-select" />;

  return (
    <View style={[idx.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, Colors.bg.secondary, Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <GameToast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast(prev => ({ ...prev, visible: false }))} />
      <TurnSummaryModal visible={showTurnSummary} onClose={() => setShowTurnSummary(false)} summary={state.lastTurnSummary} />
      <AchievementPopup achievements={pendingAchievements} onDismiss={() => setPendingAchievements([])} />
      <Modal visible={showEndTurnConfirm} transparent animationType="fade">
        <View style={idx.confirmOverlay}>
          <View style={idx.confirmCard}>
            <LinearGradient colors={['#1a1812', '#0d1117']} style={StyleSheet.absoluteFill} />
            <Text style={idx.confirmTitle}>End Turn {state.turn}?</Text>
            <View style={idx.confirmActions}>
              <TouchableOpacity style={idx.confirmCancel} onPress={() => setShowEndTurnConfirm(false)}><Text style={idx.confirmCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={idx.confirmBtn} onPress={confirmAdvanceTurn}>
                <Play size={16} color={Colors.bg.primary} fill={Colors.bg.primary} />
                <Text style={idx.confirmBtnText}>End Turn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={showGameOver} transparent animationType="fade">
        <View style={idx.modalOverlay}>
          <View style={idx.modalCard}>
            <LinearGradient colors={state.victory ? ['#1a3a1a', '#0d1117'] : ['#3a1a1a', '#0d1117']} style={StyleSheet.absoluteFill} />
            <Text style={idx.modalIcon}>{state.victory ? '👑' : '💀'}</Text>
            <Text style={idx.modalTitle}>{state.victory ? 'VICTORY!' : 'GAME OVER'}</Text>
            <Text style={idx.modalDesc}>{state.victory ? state.victoryType : state.gameOverReason}</Text>
            <TouchableOpacity style={idx.modalBtn} onPress={handleReset} activeOpacity={0.7}>
              <RotateCcw size={18} color={Colors.bg.primary} />
              <Text style={idx.modalBtnText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={idx.header}>
        <TouchableOpacity style={idx.rulerButton} onPress={() => navigateTo("/ruler")} activeOpacity={0.7} testID="ruler-button">
          <View style={idx.rulerAvatar}><Crown size={18} color={Colors.gold.bright} /></View>
          <View style={idx.rulerInfo}>
            <Text style={idx.rulerName}>{state.ruler.name}</Text>
            <Text style={idx.dynastyName}>{state.ruler.dynasty}</Text>
          </View>
        </TouchableOpacity>
        <View style={idx.turnInfo}>
          <Text style={idx.yearText}>{state.year} AD</Text>
          <SeasonBadge season={state.season} />
        </View>
      </View>
      <ResourceBar resources={state.resources} />
      <PressureIndicators pressures={state.pressures} onPress={() => navigateTo('/pressures')} />
      <WarBanner wars={activeWars.map(w => ({ name: w.name, color: w.color }))} />
      <ScrollView style={idx.scrollContent} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {seasonEffect && (
            <View style={idx.seasonEffectBar}>
              <Text style={idx.seasonEffectText}>{seasonEffect.description}</Text>
            </View>
          )}
          <View style={idx.statsRow}>
            <View style={idx.statCard}><Text style={idx.statValue}>{playerProvinces.length}</Text><Text style={idx.statLabel}>Provinces</Text></View>
            <View style={idx.statCard}><Text style={idx.statValue}>{(totalPopulation / 1000).toFixed(1)}k</Text><Text style={idx.statLabel}>Pop</Text></View>
            <View style={idx.statCard}><Text style={idx.statValue}>{totalTroops}</Text><Text style={idx.statLabel}>Troops</Text></View>
            <View style={idx.statCard}><Text style={idx.statValue}>{state.armies.length}</Text><Text style={idx.statLabel}>Armies</Text></View>
          </View>
          {currentResearch && (
            <View style={idx.researchBar}>
              <View style={idx.researchInfo}>
                <Text style={idx.researchIcon}>{currentResearch.icon}</Text>
                <Text style={idx.researchName}>{currentResearch.name}</Text>
                <Text style={idx.researchTurns}>{currentResearch.turnsRemaining}t</Text>
              </View>
              <View style={idx.researchBarBg}><View style={[idx.researchBarFill, { width: `${((currentResearch.turnsToResearch - currentResearch.turnsRemaining) / currentResearch.turnsToResearch) * 100}%` }]} /></View>
            </View>
          )}
          {recentBattles.length > 0 && (
            <TouchableOpacity style={idx.battleAlert} onPress={() => navigateTo("/battles")} activeOpacity={0.7}>
              <Swords size={16} color={Colors.crimson.bright} /><Text style={idx.battleAlertText}>{recentBattles.length} recent battle{recentBattles.length > 1 ? 's' : ''}</Text><ChevronRight size={14} color={Colors.text.dim} />
            </TouchableOpacity>
          )}
          {state.rumors.length > 0 && <RumorCards rumors={state.rumors} onInvestigate={investigateRumor} onDismiss={dismissRumor} onSendSpy={() => navigateTo('/espionage')} />}
          <Text style={idx.sectionTitle}>Realm Map</Text>
          <MapView provinces={state.provinces} armies={state.armies} onProvincePress={handleProvincePress} selectedProvinceId={selectedProvince?.id ?? null} visibilityMap={visibilityMap} />
          <Text style={idx.sectionTitle}>Command</Text>
          <View style={idx.commandGrid}>
            {[
              { path: "/armies", icon: <Swords size={22} color={Colors.crimson.bright} />, bg: Colors.military.blood + "30", title: "Armies", sub: `${state.armies.length} forces`, id: "armies-btn" },
              { path: "/diplomacy", icon: <Globe size={22} color={Colors.gold.primary} />, bg: Colors.gold.dim + "30", title: "Diplomacy", sub: `${state.kingdoms.length} kingdoms`, id: "diplomacy-btn" },
              { path: "/trade", icon: <ArrowRightLeft size={22} color={Colors.gold.bright} />, bg: Colors.gold.bright + "15", title: "Trade", sub: `${state.activeTrades.length} deals`, id: "trade-btn" },
              { path: "/espionage", icon: <Eye size={22} color="#8b5cf6" />, bg: '#8b5cf620', title: "Espionage", sub: state.activeSpyMission ? 'Active' : 'Send spies', id: "espionage-btn" },
              { path: "/events", icon: <ScrollText size={22} color={Colors.faith.light} />, bg: Colors.faith.purple + "30", title: "Events", sub: unseenEvents.length > 0 ? `${unseenEvents.length} awaiting` : "All quiet", id: "events-btn", badge: unseenEvents.length },
              { path: "/faith", icon: <Sparkles size={22} color={Colors.faith.light} />, bg: Colors.faith.purple + "20", title: "Faith", sub: `${state.resources.faith} pts`, id: "faith-btn" },
              { path: "/technology", icon: <BookOpen size={22} color={Colors.status.info} />, bg: Colors.status.info + "20", title: "Research", sub: currentResearch ? currentResearch.name : 'Choose', id: "tech-btn" },
              { path: "/council", icon: <Users size={22} color="#8b5cf6" />, bg: '#8b5cf620', title: "Council", sub: `${state.council.length} advisors`, id: "council-btn" },
              { path: "/battles", icon: <Shield size={22} color={Colors.crimson.bright} />, bg: Colors.crimson.dark + "30", title: "Battles", sub: `${state.battles.length} fought`, id: "battles-btn" },
              { path: "/pressures", icon: <ShieldAlert size={22} color={Colors.status.warning} />, bg: Colors.status.warning + "20", title: "Pressures", sub: pressureSub, id: "pressures-btn", badge: pressureBadge },
              { path: "/achievements", icon: <Trophy size={22} color={Colors.gold.bright} />, bg: Colors.gold.dim + "20", title: "Achievements", sub: `${unlockedAchievements}/${state.achievements.length}`, id: "achievements-btn" },
              { path: "/rankings", icon: <TrendingUp size={22} color={Colors.status.info} />, bg: Colors.status.info + "15", title: "Rankings", sub: "Standings", id: "rankings-btn" },
              { path: "/chronicle", icon: <BookOpen size={22} color={Colors.food.light} />, bg: Colors.food.green + "20", title: "Chronicle", sub: `${state.log.length} entries`, id: "chronicle-btn" },
              { path: "/settings", icon: <Settings size={22} color={Colors.text.secondary} />, bg: Colors.text.dim + "20", title: "Settings", sub: "Options", id: "settings-btn" },
            ].map(cmd => (
              <TouchableOpacity key={cmd.id} style={[idx.commandCard, cmd.badge && cmd.badge > 0 ? idx.commandCardHighlight : undefined]} onPress={() => navigateTo(cmd.path)} activeOpacity={0.7} testID={cmd.id}>
                <View style={[idx.commandIcon, { backgroundColor: cmd.bg }]}>
                  {cmd.icon}
                  {cmd.badge && cmd.badge > 0 ? <View style={idx.badge}><Text style={idx.badgeText}>{cmd.badge}</Text></View> : null}
                </View>
                <View style={idx.commandInfo}><Text style={idx.commandTitle}>{cmd.title}</Text><Text style={idx.commandSub}>{cmd.sub}</Text></View>
                <ChevronRight size={16} color={Colors.text.dim} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      <ProvinceActionPopup province={selectedProvince} armies={state.armies} kingdoms={state.kingdoms} onAction={handlePopupAction} onClose={handlePopupClose} visibilityMap={visibilityMap} />
      <View style={[idx.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={idx.endTurnButton} onPress={handleAdvanceTurn} activeOpacity={0.8} testID="advance-turn-button" disabled={state.gameOver || state.victory}>
          <LinearGradient colors={state.gameOver || state.victory ? ['#333', '#444', '#333'] : ["#8b6914", "#d4a574", "#8b6914"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={idx.endTurnGradient}>
            <Play size={18} color={Colors.bg.primary} fill={Colors.bg.primary} />
            <Text style={idx.endTurnText}>End Turn</Text>
            <Text style={idx.turnNumber}>Turn {state.turn}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const idx = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  rulerButton: { flexDirection: "row", alignItems: "center", gap: 10 },
  rulerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.gold.dim, alignItems: "center", justifyContent: "center" },
  rulerInfo: { gap: 2 },
  rulerName: { fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  dynastyName: { fontSize: 11, color: Colors.gold.dim },
  turnInfo: { alignItems: "flex-end", gap: 4 },
  yearText: { fontSize: 16, fontWeight: "800" as const, color: Colors.gold.bright },
  seasonBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  seasonIcon: { fontSize: 12 },
  seasonLabel: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.5 },
  warBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 6, backgroundColor: '#ff000018', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ff000030' },
  warBannerText: { fontSize: 12, fontWeight: "800" as const, color: '#ff4444', letterSpacing: 1 },
  scrollContent: { flex: 1 },
  seasonEffectBar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.bg.card + '60' },
  seasonEffectText: { fontSize: 11, color: Colors.text.secondary },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border.primary },
  statValue: { fontSize: 16, fontWeight: "800" as const, color: Colors.text.primary },
  statLabel: { fontSize: 9, color: Colors.text.secondary, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 2 },
  researchBar: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.status.info + '30' },
  researchInfo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  researchIcon: { fontSize: 16 },
  researchName: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.primary, flex: 1 },
  researchTurns: { fontSize: 11, fontWeight: "700" as const, color: Colors.status.info },
  researchBarBg: { height: 3, borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  researchBarFill: { height: "100%", borderRadius: 2, backgroundColor: Colors.status.info },
  battleAlert: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.crimson.dark + '20', borderWidth: 1, borderColor: Colors.crimson.dark + '40' },
  battleAlertText: { fontSize: 12, fontWeight: "600" as const, color: Colors.crimson.bright },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  commandGrid: { paddingHorizontal: 16, gap: 8 },
  commandCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.border.primary },
  commandCardHighlight: { borderColor: Colors.gold.dim },
  commandIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  commandInfo: { flex: 1, gap: 2 },
  commandTitle: { fontSize: 15, fontWeight: "600" as const, color: Colors.text.primary },
  commandSub: { fontSize: 12, color: Colors.text.secondary },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: Colors.crimson.bright, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10, fontWeight: "700" as const, color: "#fff" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: Colors.bg.primary + "f0" },
  endTurnButton: { borderRadius: 14, overflow: "hidden" },
  endTurnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10 },
  endTurnText: { fontSize: 17, fontWeight: "800" as const, color: Colors.bg.primary, letterSpacing: 0.5 },
  turnNumber: { fontSize: 12, fontWeight: "600" as const, color: Colors.bg.primary + "aa", marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 360, borderRadius: 20, padding: 32, alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: Colors.border.gold },
  modalIcon: { fontSize: 64, marginBottom: 16 },
  modalTitle: { fontSize: 28, fontWeight: "900" as const, color: Colors.gold.bright, letterSpacing: 2, marginBottom: 12 },
  modalDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 20, marginBottom: 20 },
  modalBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.gold.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  modalBtnText: { fontSize: 16, fontWeight: "700" as const, color: Colors.bg.primary },
  summaryOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: "center", justifyContent: "center", padding: 20 },
  summaryCard: { width: "100%", maxWidth: 380, maxHeight: "80%", borderRadius: 20, padding: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.border.gold },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  summaryTitle: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.tertiary, alignItems: "center", justifyContent: "center" },
  summaryScroll: { maxHeight: 400 },
  summarySection: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  summarySectionTitle: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.dim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" as const },
  summaryResourceRow: { flexDirection: "row", gap: 12 },
  summaryResource: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.primary },
  summaryDetail: { fontSize: 12, color: Colors.text.secondary, lineHeight: 18 },
  summaryDismiss: { marginTop: 12, backgroundColor: Colors.gold.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  summaryDismissText: { fontSize: 15, fontWeight: "700" as const, color: Colors.bg.primary },
  summaryRumorRow: { flexDirection: "row" as const, gap: 4, marginBottom: 4 },
  summaryRumorQuote: { fontSize: 16, fontWeight: "700" as const, color: Colors.gold.dim, lineHeight: 20 },
  summaryRumorText: { fontSize: 12, color: Colors.parchment.dark, fontStyle: "italic" as const, lineHeight: 18, flex: 1 },
  pressureStrip: { flexDirection: "row" as const, flexWrap: "wrap" as const, paddingHorizontal: 12, paddingVertical: 6, gap: 6, backgroundColor: Colors.bg.secondary + '80' },
  pressureChip: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  pressureChipText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.3 },
  pressureDot: { width: 5, height: 5, borderRadius: 3 },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: "center" as const, justifyContent: "center" as const, padding: 24 },
  confirmCard: { width: "100%" as const, maxWidth: 320, borderRadius: 20, padding: 28, alignItems: "center" as const, overflow: "hidden" as const, borderWidth: 1, borderColor: Colors.border.gold },
  confirmTitle: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright, marginBottom: 20 },
  confirmActions: { flexDirection: "row" as const, gap: 12, width: "100%" as const },
  confirmCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.primary, alignItems: "center" as const },
  confirmCancelText: { fontSize: 14, fontWeight: "600" as const, color: Colors.text.secondary },
  confirmBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.gold.primary },
  confirmBtnText: { fontSize: 14, fontWeight: "700" as const, color: Colors.bg.primary },
});
