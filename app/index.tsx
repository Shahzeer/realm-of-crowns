import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Modal, Alert } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Swords, Globe, ScrollText, Crown, ChevronRight, Play, BookOpen, Users, Shield, Flame, RotateCcw, ArrowRightLeft, Eye, Sparkles, Trophy, X, TrendingUp, Settings } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import ResourceBar from "@/components/ResourceBar";
import MapView from "@/components/MapView";
import GameToast from "@/components/GameToast";
import AchievementPopup from "@/components/AchievementPopup";
import ProvinceActionPopup from "@/components/ProvinceActionPopup";
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  if (wars.length === 0) return null;
  return (
    <Animated.View style={[idx.warBanner, { opacity: pulseAnim }]}>
      <Flame size={16} color="#ff4444" />
      <Text style={idx.warBannerText}>AT WAR with {wars.map(w => w.name).join(', ')}</Text>
    </Animated.View>
  );
}

function TurnSummaryModal({ visible, onClose, summary }: {
  visible: boolean;
  onClose: () => void;
  summary: TurnSummary | undefined;
}) {
  if (!summary) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={idx.summaryOverlay}>
        <View style={idx.summaryCard}>
          <LinearGradient colors={['#1a1812', '#0d1117']} style={StyleSheet.absoluteFill} />
          <View style={idx.summaryHeader}>
            <Text style={idx.summaryTitle}>Turn {summary.turn} Summary</Text>
            <TouchableOpacity onPress={onClose} style={idx.summaryClose}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={idx.summarySubtitle}>{summary.year} AD — {summary.season}</Text>
          <ScrollView style={idx.summaryScroll} showsVerticalScrollIndicator={false}>
            <View style={idx.summarySection}>
              <Text style={idx.summarySectionTitle}>Resources Gained</Text>
              <View style={idx.summaryResourceRow}>
                <Text style={idx.summaryResource}>💰 {summary.goldGained > 0 ? '+' : ''}{summary.goldGained}</Text>
                <Text style={idx.summaryResource}>🌾 {summary.foodGained > 0 ? '+' : ''}{summary.foodGained}</Text>
                <Text style={idx.summaryResource}>⚔️ {summary.militaryGained > 0 ? '+' : ''}{summary.militaryGained}</Text>
                <Text style={idx.summaryResource}>🙏 {summary.faithGained > 0 ? '+' : ''}{summary.faithGained}</Text>
              </View>
              {summary.tradeIncome !== 0 && (
                <Text style={idx.summaryDetail}>🤝 Trade income: {summary.tradeIncome > 0 ? '+' : ''}{summary.tradeIncome}g</Text>
              )}
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
            {summary.provincesLost.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Lost</Text>
                {summary.provincesLost.map((p: string, i: number) => <Text key={i} style={[idx.summaryDetail, { color: Colors.crimson.bright }]}>⚠️ {p}</Text>)}
              </View>
            )}
            {summary.revolts.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Revolts</Text>
                {summary.revolts.map((r: string, i: number) => <Text key={i} style={[idx.summaryDetail, { color: '#ff4444' }]}>{r}</Text>)}
              </View>
            )}
            {summary.eventsTriggered.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Events</Text>
                {summary.eventsTriggered.map((e: string, i: number) => <Text key={i} style={idx.summaryDetail}>📜 {e}</Text>)}
              </View>
            )}
            {summary.techCompleted && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Research Complete</Text>
                <Text style={[idx.summaryDetail, { color: Colors.status.info }]}>📚 {summary.techCompleted}</Text>
              </View>
            )}
            {summary.spyResults.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Espionage</Text>
                {summary.spyResults.map((r: string, i: number) => <Text key={i} style={idx.summaryDetail}>{r}</Text>)}
              </View>
            )}
            {summary.aiActions.length > 0 && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>World Events</Text>
                {summary.aiActions.map((a: string, i: number) => <Text key={i} style={idx.summaryDetail}>{a}</Text>)}
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

function TutorialOverlay({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={idx.tutOverlay}>
        <View style={idx.tutCard}>
          <LinearGradient colors={['#1a1812', '#0d1117']} style={StyleSheet.absoluteFill} />
          <Text style={idx.tutIcon}>👑</Text>
          <Text style={idx.tutTitle}>Welcome, Your Majesty!</Text>
          <Text style={idx.tutDesc}>A quick guide to ruling your kingdom:</Text>
          <View style={idx.tutSteps}>
            {[
              { icon: '🗺️', text: 'Tap provinces on the map to manage them' },
              { icon: '⚔️', text: 'Recruit armies and conquer enemy lands' },
              { icon: '🏗️', text: 'Build structures to grow your economy' },
              { icon: '📚', text: 'Research technologies for advantages' },
              { icon: '🤝', text: 'Trade, spy, and forge alliances' },
              { icon: '🙏', text: 'Use faith for divine blessings' },
              { icon: '▶️', text: 'Press End Turn to advance time' },
            ].map((step, i) => (
              <View key={i} style={idx.tutStep}>
                <Text style={idx.tutStepIcon}>{step.icon}</Text>
                <Text style={idx.tutStepText}>{step.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={idx.tutBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={idx.tutBtnText}>Begin Your Reign</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function KingdomScreen() {
  console.log("[RealmOfCrowns] Kingdom screen render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, advanceTurn, unseenEvents, playerProvinces, activeWars, recentBattles, currentResearch, resetGame, dismissTutorial, newAchievements, recruitArmy, reinforceGarrison, visibilityMap } = useGame();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [showGameOver, setShowGameOver] = React.useState(false);
  const [showTurnSummary, setShowTurnSummary] = React.useState(false);
  const [showTutorial, setShowTutorial] = React.useState(false);
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
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [unseenEvents.length, pulseAnim]);

  useEffect(() => {
    if (state.gameOver || state.victory) setShowGameOver(true);
  }, [state.gameOver, state.victory]);

  useEffect(() => {
    if (state.gameStarted && !state.tutorialSeen) setShowTutorial(true);
  }, [state.gameStarted, state.tutorialSeen]);

  useEffect(() => {
    if (state.turn > prevTurn.current && state.lastTurnSummary) {
      setShowTurnSummary(true);
      const summary = state.lastTurnSummary;
      if (summary.provincesLost.length > 0) {
        setTimeout(() => setToast({ visible: true, message: `Province lost: ${summary.provincesLost.join(', ')}!`, type: 'danger' }), 500);
      } else if (summary.provincesConquered.length > 0) {
        setTimeout(() => setToast({ visible: true, message: `Conquered: ${summary.provincesConquered.join(', ')}!`, type: 'success' }), 500);
      } else if (summary.revolts.length > 0) {
        setTimeout(() => setToast({ visible: true, message: summary.revolts[0], type: 'warning' }), 500);
      }
      if (newAchievements.length > 0) {
        setTimeout(() => setPendingAchievements([...newAchievements]), 800);
      }
    }
    prevTurn.current = state.turn;
  }, [state.turn, state.lastTurnSummary, newAchievements]);

  const handleAdvanceTurn = useCallback(() => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    setShowEndTurnConfirm(true);
  }, []);

  const confirmAdvanceTurn = useCallback(() => {
    setShowEndTurnConfirm(false);
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    advanceTurn();
  }, [advanceTurn]);

  const handleProvincePress = useCallback((province: Province) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    setSelectedProvince(province);
  }, []);

  const handlePopupAction = useCallback((action: string, province: Province) => {
    console.log('[RealmOfCrowns] Popup action:', action, province.id);
    setSelectedProvince(null);
    switch (action) {
      case 'details':
      case 'info':
        router.push(`/province/${province.id}`);
        break;
      case 'build':
        router.push(`/province/${province.id}`);
        break;
      case 'recruit': {
        const troops = 200;
        const cost = troops * 2;
        if (state.resources.gold < cost) {
          Alert.alert('Insufficient Gold', `Need ${cost} gold to recruit.`);
          return;
        }
        if (state.resources.military < troops) {
          Alert.alert('Insufficient Military', `Need ${troops} military points.`);
          return;
        }
        if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
        recruitArmy(province.id, troops);
        setToast({ visible: true, message: `Army recruited at ${province.name}!`, type: 'success' });
        break;
      }
      case 'reinforce': {
        const amount = 100;
        if (state.resources.gold < amount || state.resources.military < amount) {
          Alert.alert('Insufficient Resources', `Need ${amount} gold and ${amount} military.`);
          return;
        }
        if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
        reinforceGarrison(province.id, amount);
        setToast({ visible: true, message: `+${amount} garrison at ${province.name}`, type: 'success' });
        break;
      }
      case 'attack':
        router.push('/armies' as any);
        break;
      case 'spy':
        router.push('/espionage' as any);
        break;
      case 'diplomacy': {
        const kingdom = state.kingdoms.find(k => k.id === province.owner);
        if (kingdom) {
          router.push('/diplomacy' as any);
        }
        break;
      }
      case 'trade':
        router.push('/trade' as any);
        break;
    }
  }, [router, state.resources, state.kingdoms, recruitArmy, reinforceGarrison]);

  const handlePopupClose = useCallback(() => {
    setSelectedProvince(null);
  }, []);

  const navigateTo = useCallback((path: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    router.push(path as any);
  }, [router]);

  const handleReset = useCallback(async () => {
    await resetGame();
    setShowGameOver(false);
  }, [resetGame]);

  const handleDismissTutorial = useCallback(() => {
    setShowTutorial(false);
    dismissTutorial();
  }, [dismissTutorial]);

  const totalTroops = state.armies.reduce((sum, a) => sum + a.troops, 0);
  const totalPopulation = playerProvinces.reduce((sum, p) => sum + p.population, 0);
  const seasonEffect = SEASON_EFFECTS[state.season];
  const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;

  if (!state.gameStarted) {
    return <Redirect href="/kingdom-select" />;
  }

  return (
    <View style={[idx.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, Colors.bg.secondary, Colors.bg.primary]} style={StyleSheet.absoluteFill} />

      <GameToast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast(prev => ({ ...prev, visible: false }))} />
      <TutorialOverlay visible={showTutorial} onDismiss={handleDismissTutorial} />
      <TurnSummaryModal visible={showTurnSummary} onClose={() => setShowTurnSummary(false)} summary={state.lastTurnSummary} />
      <AchievementPopup achievements={pendingAchievements} onDismiss={() => setPendingAchievements([])} />

      <Modal visible={showEndTurnConfirm} transparent animationType="fade">
        <View style={idx.confirmOverlay}>
          <View style={idx.confirmCard}>
            <LinearGradient colors={['#1a1812', '#0d1117']} style={StyleSheet.absoluteFill} />
            <Text style={idx.confirmIcon}>⏭️</Text>
            <Text style={idx.confirmTitle}>End Turn {state.turn}?</Text>
            <Text style={idx.confirmDesc}>
              {unseenEvents.length > 0 ? `⚠️ ${unseenEvents.length} unseen event${unseenEvents.length > 1 ? 's' : ''}!\n` : ''}
              {activeWars.length > 0 ? `🔥 ${activeWars.length} active war${activeWars.length > 1 ? 's' : ''}\n` : ''}
              Advance to {state.season === 'Winter' ? state.year + 1 : state.year} AD, {['Spring', 'Summer', 'Autumn', 'Winter'][((['Spring', 'Summer', 'Autumn', 'Winter'].indexOf(state.season)) + 1) % 4]}
            </Text>
            <View style={idx.confirmActions}>
              <TouchableOpacity style={idx.confirmCancel} onPress={() => setShowEndTurnConfirm(false)} activeOpacity={0.7}>
                <Text style={idx.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={idx.confirmBtn} onPress={confirmAdvanceTurn} activeOpacity={0.7}>
                <Play size={16} color={Colors.bg.primary} fill={Colors.bg.primary} />
                <Text style={idx.confirmBtnText}>End Turn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showGameOver} transparent animationType="fade">
        <View style={idx.modalOverlay}>
          <ScrollView contentContainerStyle={idx.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={idx.modalCard}>
              <LinearGradient colors={state.victory ? ['#1a3a1a', '#0d1117'] : ['#3a1a1a', '#0d1117']} style={StyleSheet.absoluteFill} />
              <Text style={idx.modalIcon}>{state.victory ? '👑' : '💀'}</Text>
              <Text style={idx.modalTitle}>{state.victory ? 'VICTORY!' : 'GAME OVER'}</Text>
              <Text style={idx.modalDesc}>{state.victory ? state.victoryType : state.gameOverReason}</Text>
              <View style={idx.modalStats}>
                <View style={idx.modalStatItem}><Text style={idx.modalStatValue}>{state.turn}</Text><Text style={idx.modalStatLabel}>Turns</Text></View>
                <View style={idx.modalStatItem}><Text style={idx.modalStatValue}>{state.year}</Text><Text style={idx.modalStatLabel}>Year</Text></View>
                <View style={idx.modalStatItem}><Text style={idx.modalStatValue}>{playerProvinces.length}</Text><Text style={idx.modalStatLabel}>Provinces</Text></View>
                <View style={idx.modalStatItem}><Text style={idx.modalStatValue}>{state.battles.length}</Text><Text style={idx.modalStatLabel}>Battles</Text></View>
              </View>
              <View style={idx.modalDetailStats}>
                <Text style={idx.modalDetailTitle}>Reign Summary</Text>
                <View style={idx.modalDetailRow}><Text style={idx.modalDetailLabel}>Battles Won</Text><Text style={idx.modalDetailValue}>{state.battles.filter(b => b.conquered).length}</Text></View>
                <View style={idx.modalDetailRow}><Text style={idx.modalDetailLabel}>Battles Lost</Text><Text style={idx.modalDetailValue}>{state.battles.filter(b => !b.conquered).length}</Text></View>
                <View style={idx.modalDetailRow}><Text style={idx.modalDetailLabel}>Total Troops</Text><Text style={idx.modalDetailValue}>{totalTroops.toLocaleString()}</Text></View>
                <View style={idx.modalDetailRow}><Text style={idx.modalDetailLabel}>Tech Researched</Text><Text style={idx.modalDetailValue}>{state.technologies.filter(t => t.researched).length}/{state.technologies.length}</Text></View>
                <View style={idx.modalDetailRow}><Text style={idx.modalDetailLabel}>Active Alliances</Text><Text style={idx.modalDetailValue}>{state.kingdoms.filter(k => k.attitude === 'allied').length}</Text></View>
                <View style={idx.modalDetailRow}><Text style={idx.modalDetailLabel}>Gold in Treasury</Text><Text style={idx.modalDetailValue}>{state.resources.gold.toLocaleString()}</Text></View>
              </View>
              <Text style={idx.modalAch}>{unlockedAchievements}/{state.achievements.length} Achievements Unlocked</Text>
              <TouchableOpacity style={idx.modalBtn} onPress={handleReset} activeOpacity={0.7}>
                <RotateCcw size={18} color={Colors.bg.primary} />
                <Text style={idx.modalBtnText}>New Game</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
      <WarBanner wars={activeWars.map(w => ({ name: w.name, color: w.color }))} />

      <ScrollView style={idx.scrollContent} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {seasonEffect && (
            <View style={idx.seasonEffectBar}>
              <Text style={idx.seasonEffectText}>{seasonEffect.description}</Text>
              <View style={idx.seasonEffectValues}>
                {seasonEffect.food !== 0 && <Text style={[idx.effectVal, { color: seasonEffect.food > 0 ? Colors.food.light : Colors.crimson.bright }]}>{seasonEffect.food > 0 ? '+' : ''}{seasonEffect.food}🌾</Text>}
                {seasonEffect.gold !== 0 && <Text style={[idx.effectVal, { color: seasonEffect.gold > 0 ? Colors.gold.bright : Colors.crimson.bright }]}>{seasonEffect.gold > 0 ? '+' : ''}{seasonEffect.gold}💰</Text>}
                {seasonEffect.military !== 0 && <Text style={[idx.effectVal, { color: seasonEffect.military > 0 ? Colors.military.steel : Colors.crimson.bright }]}>{seasonEffect.military > 0 ? '+' : ''}{seasonEffect.military}⚔️</Text>}
              </View>
            </View>
          )}

          <View style={idx.statsRow}>
            <View style={idx.statCard}><Text style={idx.statValue}>{playerProvinces.length}</Text><Text style={idx.statLabel}>Provinces</Text></View>
            <View style={idx.statCard}><Text style={idx.statValue}>{(totalPopulation / 1000).toFixed(1)}k</Text><Text style={idx.statLabel}>Population</Text></View>
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
              <View style={idx.researchBarBg}>
                <View style={[idx.researchBarFill, { width: `${((currentResearch.turnsToResearch - currentResearch.turnsRemaining) / currentResearch.turnsToResearch) * 100}%` }]} />
              </View>
            </View>
          )}

          {state.activeSpyMission && (
            <View style={idx.spyBar}><Text style={idx.spyBarIcon}>🕵️</Text><Text style={idx.spyBarText}>Spy mission active</Text><Text style={idx.spyBarTurns}>{state.activeSpyMission.turnsRemaining}t</Text></View>
          )}

          {state.activeTrades.length > 0 && (
            <View style={idx.tradeBar}><Text style={idx.tradeBarIcon}>🤝</Text><Text style={idx.tradeBarText}>{state.activeTrades.length} active trade{state.activeTrades.length > 1 ? 's' : ''}</Text></View>
          )}

          {recentBattles.length > 0 && (
            <TouchableOpacity style={idx.battleAlert} onPress={() => navigateTo("/battles")} activeOpacity={0.7}>
              <Swords size={16} color={Colors.crimson.bright} /><Text style={idx.battleAlertText}>{recentBattles.length} recent battle{recentBattles.length > 1 ? 's' : ''}</Text><ChevronRight size={14} color={Colors.text.dim} />
            </TouchableOpacity>
          )}

          {newAchievements.length > 0 && (
            <TouchableOpacity style={idx.achievementAlert} onPress={() => navigateTo("/achievements")} activeOpacity={0.7}>
              <Trophy size={16} color={Colors.gold.bright} /><Text style={idx.achievementAlertText}>{newAchievements.length} achievement{newAchievements.length > 1 ? 's' : ''} unlocked!</Text><ChevronRight size={14} color={Colors.text.dim} />
            </TouchableOpacity>
          )}

          <Text style={idx.sectionTitle}>Realm Map</Text>
          <MapView provinces={state.provinces} armies={state.armies} onProvincePress={handleProvincePress} selectedProvinceId={selectedProvince?.id ?? null} visibilityMap={visibilityMap} />

          <Text style={idx.sectionTitle}>Command</Text>
          <View style={idx.commandGrid}>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/armies")} activeOpacity={0.7} testID="armies-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.military.blood + "30" }]}><Swords size={22} color={Colors.crimson.bright} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Armies</Text><Text style={idx.commandSub}>{state.armies.length} forces • {totalTroops} troops</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/diplomacy")} activeOpacity={0.7} testID="diplomacy-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.gold.dim + "30" }]}><Globe size={22} color={Colors.gold.primary} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Diplomacy</Text><Text style={idx.commandSub}>{activeWars.length > 0 ? `${activeWars.length} active war${activeWars.length > 1 ? 's' : ''}` : `${state.kingdoms.length} kingdoms`}</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/trade")} activeOpacity={0.7} testID="trade-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.gold.bright + "15" }]}><ArrowRightLeft size={22} color={Colors.gold.bright} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Trade</Text><Text style={idx.commandSub}>{state.activeTrades.length} active deals</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/espionage")} activeOpacity={0.7} testID="espionage-button">
              <View style={[idx.commandIcon, { backgroundColor: '#8b5cf620' }]}><Eye size={22} color="#8b5cf6" /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Espionage</Text><Text style={idx.commandSub}>{state.activeSpyMission ? 'Mission active' : 'Send spies'}</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <Animated.View style={{ transform: [{ scale: unseenEvents.length > 0 ? pulseAnim : 1 }] }}>
              <TouchableOpacity style={[idx.commandCard, unseenEvents.length > 0 && idx.commandCardHighlight]} onPress={() => navigateTo("/events")} activeOpacity={0.7} testID="events-button">
                <View style={[idx.commandIcon, { backgroundColor: Colors.faith.purple + "30" }]}>
                  <ScrollText size={22} color={Colors.faith.light} />
                  {unseenEvents.length > 0 && (<View style={idx.badge}><Text style={idx.badgeText}>{unseenEvents.length}</Text></View>)}
                </View>
                <View style={idx.commandInfo}><Text style={idx.commandTitle}>Events</Text><Text style={idx.commandSub}>{unseenEvents.length > 0 ? `${unseenEvents.length} awaiting` : "All quiet"}</Text></View>
                <ChevronRight size={16} color={Colors.text.dim} />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/faith")} activeOpacity={0.7} testID="faith-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.faith.purple + "20" }]}><Sparkles size={22} color={Colors.faith.light} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Faith</Text><Text style={idx.commandSub}>{state.resources.faith} faith points</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/technology")} activeOpacity={0.7} testID="tech-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.status.info + "20" }]}><BookOpen size={22} color={Colors.status.info} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Research</Text><Text style={idx.commandSub}>{currentResearch ? `Researching: ${currentResearch.name}` : 'Choose research'}</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/council")} activeOpacity={0.7} testID="council-button">
              <View style={[idx.commandIcon, { backgroundColor: '#8b5cf620' }]}><Users size={22} color="#8b5cf6" /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Council</Text><Text style={idx.commandSub}>{state.council.length} advisors</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/battles")} activeOpacity={0.7} testID="battles-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.crimson.dark + "30" }]}><Shield size={22} color={Colors.crimson.bright} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Battles</Text><Text style={idx.commandSub}>{state.battles.length} fought</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/achievements")} activeOpacity={0.7} testID="achievements-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.gold.dim + "20" }]}><Trophy size={22} color={Colors.gold.bright} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Achievements</Text><Text style={idx.commandSub}>{unlockedAchievements}/{state.achievements.length} unlocked</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/rankings")} activeOpacity={0.7} testID="rankings-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.status.info + "15" }]}><TrendingUp size={22} color={Colors.status.info} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Rankings</Text><Text style={idx.commandSub}>Realm power standings</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/chronicle")} activeOpacity={0.7} testID="chronicle-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.food.green + "20" }]}><BookOpen size={22} color={Colors.food.light} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Chronicle</Text><Text style={idx.commandSub}>{state.log.length} entries</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
            <TouchableOpacity style={idx.commandCard} onPress={() => navigateTo("/settings")} activeOpacity={0.7} testID="settings-button">
              <View style={[idx.commandIcon, { backgroundColor: Colors.text.dim + "20" }]}><Settings size={22} color={Colors.text.secondary} /></View>
              <View style={idx.commandInfo}><Text style={idx.commandTitle}>Settings</Text><Text style={idx.commandSub}>Game info & options</Text></View>
              <ChevronRight size={16} color={Colors.text.dim} />
            </TouchableOpacity>
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
  seasonEffectBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.bg.card + '60' },
  seasonEffectText: { fontSize: 11, color: Colors.text.secondary, flex: 1 },
  seasonEffectValues: { flexDirection: "row", gap: 8 },
  effectVal: { fontSize: 11, fontWeight: "600" as const },
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
  spyBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#8b5cf610', borderWidth: 1, borderColor: '#8b5cf630' },
  spyBarIcon: { fontSize: 14 },
  spyBarText: { fontSize: 12, fontWeight: "600" as const, color: '#8b5cf6' },
  spyBarTurns: { fontSize: 11, fontWeight: "700" as const, color: Colors.text.dim },
  tradeBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.gold.dim + '10', borderWidth: 1, borderColor: Colors.gold.dim + '30' },
  tradeBarIcon: { fontSize: 14 },
  tradeBarText: { fontSize: 12, fontWeight: "600" as const, color: Colors.gold.primary },
  battleAlert: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.crimson.dark + '20', borderWidth: 1, borderColor: Colors.crimson.dark + '40' },
  battleAlertText: { fontSize: 12, fontWeight: "600" as const, color: Colors.crimson.bright },
  achievementAlert: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.gold.dim + '20', borderWidth: 1, borderColor: Colors.gold.dim + '40' },
  achievementAlertText: { fontSize: 12, fontWeight: "600" as const, color: Colors.gold.bright },
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
  modalScrollContent: { flexGrow: 1, alignItems: "center" as const, justifyContent: "center" as const, padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalCard: { width: "100%", maxWidth: 360, borderRadius: 20, padding: 32, alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: Colors.border.gold },
  modalIcon: { fontSize: 64, marginBottom: 16 },
  modalTitle: { fontSize: 28, fontWeight: "900" as const, color: Colors.gold.bright, letterSpacing: 2, marginBottom: 12 },
  modalDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 20, marginBottom: 20 },
  modalStats: { flexDirection: "row", gap: 16, marginBottom: 12 },
  modalStatItem: { alignItems: "center", gap: 2 },
  modalStatValue: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  modalStatLabel: { fontSize: 10, color: Colors.text.dim, textTransform: "uppercase" as const },
  modalDetailStats: { width: "100%" as const, backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 12, marginBottom: 14 },
  modalDetailTitle: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 },
  modalDetailRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, paddingVertical: 5 },
  modalDetailLabel: { fontSize: 12, color: Colors.text.secondary },
  modalDetailValue: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  modalAch: { fontSize: 12, color: Colors.gold.dim, marginBottom: 16 },
  modalBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.gold.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  modalBtnText: { fontSize: 16, fontWeight: "700" as const, color: Colors.bg.primary },
  summaryOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: "center", justifyContent: "center", padding: 20 },
  summaryCard: { width: "100%", maxWidth: 380, maxHeight: "80%", borderRadius: 20, padding: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.border.gold },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  summaryTitle: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright },
  summaryClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.tertiary, alignItems: "center", justifyContent: "center" },
  summarySubtitle: { fontSize: 12, color: Colors.text.secondary, marginBottom: 12 },
  summaryScroll: { maxHeight: 400 },
  summarySection: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  summarySectionTitle: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.dim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" as const },
  summaryResourceRow: { flexDirection: "row", gap: 12 },
  summaryResource: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.primary },
  summaryDetail: { fontSize: 12, color: Colors.text.secondary, lineHeight: 18 },
  summaryDismiss: { marginTop: 12, backgroundColor: Colors.gold.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  summaryDismissText: { fontSize: 15, fontWeight: "700" as const, color: Colors.bg.primary },
  tutOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: "center", justifyContent: "center", padding: 20 },
  tutCard: { width: "100%", maxWidth: 360, borderRadius: 20, padding: 28, alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: Colors.gold.dim },
  tutIcon: { fontSize: 48, marginBottom: 12 },
  tutTitle: { fontSize: 22, fontWeight: "900" as const, color: Colors.gold.bright, marginBottom: 6 },
  tutDesc: { fontSize: 14, color: Colors.text.secondary, marginBottom: 16 },
  tutSteps: { gap: 10, width: "100%", marginBottom: 20 },
  tutStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  tutStepIcon: { fontSize: 20, width: 30, textAlign: "center" as const },
  tutStepText: { fontSize: 13, color: Colors.text.primary, flex: 1, lineHeight: 18 },
  tutBtn: { backgroundColor: Colors.gold.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  tutBtnText: { fontSize: 16, fontWeight: "700" as const, color: Colors.bg.primary },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: "center" as const, justifyContent: "center" as const, padding: 24 },
  confirmCard: { width: "100%" as const, maxWidth: 320, borderRadius: 20, padding: 28, alignItems: "center" as const, overflow: "hidden" as const, borderWidth: 1, borderColor: Colors.border.gold },
  confirmIcon: { fontSize: 40, marginBottom: 12 },
  confirmTitle: { fontSize: 20, fontWeight: "800" as const, color: Colors.gold.bright, marginBottom: 8 },
  confirmDesc: { fontSize: 13, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 20, marginBottom: 20 },
  confirmActions: { flexDirection: "row" as const, gap: 12, width: "100%" as const },
  confirmCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.primary, alignItems: "center" as const },
  confirmCancelText: { fontSize: 14, fontWeight: "600" as const, color: Colors.text.secondary },
  confirmBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.gold.primary },
  confirmBtnText: { fontSize: 14, fontWeight: "700" as const, color: Colors.bg.primary },
});
