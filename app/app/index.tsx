import React, { useRef, useEffect, useCallback, useState as useStateHook } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Modal, Alert } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Swords, Globe, ScrollText, Crown, ChevronRight, Play, BookOpen, Users, Shield, Flame, RotateCcw, ArrowRightLeft, Eye, Sparkles, Trophy, X, TrendingUp, Settings, ShieldAlert, AlertTriangle, Bug, Wheat, Skull, ChevronDown, ChevronUp, UserX, TrendingDown, Minus, Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

import ResourceBar from "@/components/ResourceBar";
import MapView from "@/components/MapView";
import GameToast from "@/components/GameToast";
import AchievementPopup from "@/components/AchievementPopup";
import ProvinceActionPopup from "@/components/ProvinceActionPopup";
import TutorialOverlay from "@/components/TutorialOverlay";
import DailyQuestsCard from "@/components/DailyQuestsCard";
import { Province, Achievement, TurnSummary } from "@/types/game";
import { SEASON_EFFECTS } from "@/mocks/gameData";
import { checkReturnBonus, markPlayed } from "@/utils/notifications";

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

function WarBanner({ wars, warTaxActive, onToggleWarTax }: { wars: Array<{ name: string; color: string }>; warTaxActive?: boolean; onToggleWarTax?: () => void }) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  if (wars.length === 0) return null;
  return (
    <View style={idx.warBannerWrap}>
      <Animated.View style={[idx.warBanner, { opacity: pulseAnim }]}>
        <Flame size={16} color="#ff4444" />
        <Text style={[idx.warBannerText, { flex: 1 }]}>AT WAR with {wars.map(w => w.name).join(', ')}</Text>
      </Animated.View>
      <TouchableOpacity
        style={[idx.warTaxBtn, warTaxActive && idx.warTaxBtnActive]}
        onPress={onToggleWarTax}
        activeOpacity={0.7}
      >
        <Swords size={12} color={warTaxActive ? '#ff4444' : Colors.text.dim} />
        <Text style={[idx.warTaxBtnText, warTaxActive && { color: '#ff4444' }]}>
          {warTaxActive ? 'War Tax ON' : 'War Tax OFF'}
        </Text>
      </TouchableOpacity>
    </View>
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
              <Text style={idx.summarySectionTitle}>Income This Turn</Text>
              <View style={idx.summaryResourceRow}>
                <Text style={idx.summaryResource}>💰{summary.goldGained > 0 ? '+' : ''}{summary.goldGained}</Text>
                <Text style={idx.summaryResource}>🌾{summary.foodGained > 0 ? '+' : ''}{summary.foodGained}</Text>
                <Text style={idx.summaryResource}>⚔️{summary.militaryGained > 0 ? '+' : ''}{summary.militaryGained}</Text>
                <Text style={idx.summaryResource}>🙏{summary.faithGained > 0 ? '+' : ''}{summary.faithGained}</Text>
              </View>
            </View>
            {summary.breakdown && (
              <View style={idx.summarySection}>
                <Text style={idx.summarySectionTitle}>Income Breakdown</Text>
                {[
                  { label: 'Base income', gold: summary.breakdown.base.gold, food: summary.breakdown.base.food, mil: summary.breakdown.base.military, faith: summary.breakdown.base.faith, always: true },
                  { label: `Season (${summary.season})`, gold: summary.breakdown.season.gold, food: summary.breakdown.season.food, mil: summary.breakdown.season.military, faith: 0, always: summary.breakdown.season.gold !== 0 || summary.breakdown.season.food !== 0 || summary.breakdown.season.military !== 0 },
                  { label: 'Trade deals', gold: summary.breakdown.trade, food: 0, mil: 0, faith: 0, always: summary.breakdown.trade !== 0 },
                  { label: 'Technology', gold: summary.breakdown.tech.gold, food: summary.breakdown.tech.food, mil: summary.breakdown.tech.military, faith: summary.breakdown.tech.faith, always: summary.breakdown.tech.gold + summary.breakdown.tech.food + summary.breakdown.tech.military + summary.breakdown.tech.faith > 0 },
                  { label: 'Council', gold: summary.breakdown.council.gold, food: summary.breakdown.council.food, mil: summary.breakdown.council.military, faith: summary.breakdown.council.faith, always: summary.breakdown.council.gold + summary.breakdown.council.food + summary.breakdown.council.military + summary.breakdown.council.faith > 0 },
                  { label: 'Difficulty bonus', gold: summary.breakdown.diff.gold, food: summary.breakdown.diff.food, mil: summary.breakdown.diff.military, faith: summary.breakdown.diff.faith, always: summary.breakdown.diff.gold > 0 },
                  { label: 'Pressures', gold: summary.breakdown.pressure.gold, food: summary.breakdown.pressure.food, mil: summary.breakdown.pressure.military, faith: 0, always: summary.breakdown.pressure.gold !== 0 || summary.breakdown.pressure.food !== 0 || summary.breakdown.pressure.military !== 0 },
                  { label: 'Vassal tributes', gold: summary.breakdown.vassal ?? 0, food: 0, mil: 0, faith: 0, always: (summary.breakdown.vassal ?? 0) > 0 },
                  { label: 'Lord tribute (−)', gold: -(summary.breakdown.lordTribute ?? 0), food: 0, mil: 0, faith: 0, always: (summary.breakdown.lordTribute ?? 0) > 0 },
                  { label: 'War tax bonus', gold: summary.breakdown.warTax ?? 0, food: 0, mil: 0, faith: 0, always: (summary.breakdown.warTax ?? 0) > 0 },
                ].filter(r => r.always).map((row, i) => {
                  const isPenalty = row.label === 'Pressures' || row.label === 'Lord tribute (−)';
                  const isSeason = row.label.startsWith('Season');
                  const isBonus = row.label === 'War tax bonus';
                  const rowColor = isPenalty ? Colors.crimson.bright : isSeason ? Colors.status.warning : isBonus ? Colors.gold.bright : Colors.text.secondary;
                  const parts: string[] = [];
                  if (row.gold !== 0) parts.push(`💰${row.gold > 0 ? '+' : ''}${row.gold}`);
                  if (row.food !== 0) parts.push(`🌾${row.food > 0 ? '+' : ''}${row.food}`);
                  if (row.mil !== 0) parts.push(`⚔️${row.mil > 0 ? '+' : ''}${row.mil}`);
                  if (row.faith !== 0) parts.push(`🙏${row.faith > 0 ? '+' : ''}${row.faith}`);
                  return (
                    <View key={i} style={idx.breakdownRow}>
                      <Text style={idx.breakdownLabel}>{row.label}</Text>
                      <Text style={[idx.breakdownValue, { color: rowColor }]}>{parts.join('  ') || '—'}</Text>
                    </View>
                  );
                })}
              </View>
            )}
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

function LordsOverviewPanel({ lords, provinces, stewardshipCap, onDismiss, onAdjustTax }: {
  lords: import("@/types/game").Lord[];
  provinces: import("@/types/game").Province[];
  stewardshipCap: number;
  onDismiss: (provinceId: string, lordName: string) => void;
  onAdjustTax?: (lordId: string, delta: number) => void;
}) {
  const [collapsed, setCollapsed] = useStateHook(false);
  if (lords.length === 0) return null;

  const crownCount = provinces.filter(p => p.owner === 'player' && !p.assignedLordId).length;
  const lordCount = lords.length;
  const overCap = Math.max(0, crownCount - stewardshipCap);

  return (
    <View style={idx.lordsPanel}>
      <TouchableOpacity style={idx.lordsPanelHeader} onPress={() => setCollapsed(c => !c)} activeOpacity={0.7}>
        <View style={idx.lordsPanelLeft}>
          <Crown size={14} color={Colors.gold.bright} />
          <Text style={idx.lordsPanelTitle}>Lords & Overseers</Text>
          <View style={idx.lordsPanelBadge}><Text style={idx.lordsPanelBadgeText}>{lordCount}</Text></View>
        </View>
        <View style={idx.lordsPanelRight}>
          <Text style={idx.lordsCrownInfo}>👑{crownCount} Crown · 🏰{lordCount} Lords</Text>
          {overCap > 0 && (
            <View style={idx.lordsCapWarning}>
              <Text style={idx.lordsCapWarningText}>⚠️ {overCap} over cap</Text>
            </View>
          )}
          {collapsed ? <ChevronDown size={16} color={Colors.text.dim} /> : <ChevronUp size={16} color={Colors.text.dim} />}
        </View>
      </TouchableOpacity>
      {!collapsed && (
        <View style={idx.lordsListWrap}>
          {lords.map(lord => {
            const lordProvinces = (lord.provinceIds ?? []).map(pid => provinces.find(p => p.id === pid)).filter(Boolean) as import("@/types/game").Province[];
            const primaryProvince = lordProvinces[0];
            if (!primaryProvince) return null;
            const loyaltyColor = lord.loyalty >= 60 ? Colors.status.success : lord.loyalty >= 30 ? Colors.status.warning : Colors.status.danger;
            const isLowLoyalty = lord.loyalty < 30;
            const taxPct = Math.round(lord.taxRate * 100);
            const levy = lord.skill * 3 * lordProvinces.length;
            const isPeasant = lord.type === 'peasant';
            return (
              <View key={lord.id} style={[idx.lordRow, isLowLoyalty && idx.lordRowDanger]}>
                <View style={idx.lordRowMain}>
                  <View style={idx.lordRowInfo}>
                    <View style={idx.lordRowNameRow}>
                      <Text style={idx.lordRowName} numberOfLines={1}>{lord.name}</Text>
                      {isPeasant && <View style={idx.peasantBadge}><Text style={idx.peasantBadgeText}>Peasant</Text></View>}
                    </View>
                    <Text style={idx.lordRowProvince} numberOfLines={2}>
                      {lordProvinces.map(p => p.name).join(' · ')}
                      {lordProvinces.length > 1 ? ` (${lordProvinces.length})` : ''}
                    </Text>
                  </View>
                  <View style={idx.lordRowStats}>
                    <View style={idx.lordStatChip}>
                      <Text style={idx.lordStatLabel}>SKL</Text>
                      <Text style={idx.lordStatValue}>{lord.skill}</Text>
                    </View>
                    <View style={idx.lordStatChip}>
                      <Text style={idx.lordStatLabel}>LEVY</Text>
                      <Text style={idx.lordStatValue}>+{levy}</Text>
                    </View>
                    <View style={[idx.lordStatChip, { backgroundColor: loyaltyColor + '20', borderColor: loyaltyColor + '40' }]}>
                      {lord.loyalty >= 50
                        ? <TrendingUp size={10} color={loyaltyColor} />
                        : <TrendingDown size={10} color={loyaltyColor} />}
                      <Text style={[idx.lordStatValue, { color: loyaltyColor }]}>{lord.loyalty}</Text>
                    </View>
                  </View>
                  <View style={idx.lordTaxRow}>
                    <Text style={idx.lordTaxLabel}>Tax:</Text>
                    <TouchableOpacity style={idx.lordTaxBtn} onPress={() => onAdjustTax?.(lord.id, -0.05)} activeOpacity={0.7}>
                      <Minus size={11} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={idx.lordTaxValue}>{taxPct}%</Text>
                    <TouchableOpacity style={idx.lordTaxBtn} onPress={() => onAdjustTax?.(lord.id, 0.05)} activeOpacity={0.7}>
                      <Plus size={11} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={idx.lordTaxHint} numberOfLines={1}>
                      {taxPct >= 85 ? '⚠️ loyalty risk' : taxPct <= 40 ? '📈 boosts loyalty' : '✓ stable'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={idx.lordDismissBtn}
                    onPress={() => {
                      Alert.alert(
                        'Remove Lord',
                        `Remove ${lord.name} from all provinces?\n\nUnrest +20 in each province.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => {
                            lord.provinceIds.forEach((pid: string) => onDismiss(pid, lord.name));
                          }},
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <UserX size={15} color={Colors.status.danger} />
                  </TouchableOpacity>
                </View>
                {isLowLoyalty && (
                  <Text style={idx.lordRebellionWarn}>Rebellion risk! Loyalty critically low.</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function KingdomScreenGuard() {
  return <KingdomScreen />;
}

function KingdomScreen() {
  console.log("[RealmOfCrowns] Kingdom screen render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, isLoaded, advanceTurn, unseenEvents, playerProvinces, activeWars, recentBattles, currentResearch, resetGame, dismissTutorial, newAchievements, recruitArmy, reinforceGarrison, claimNeutralProvince, marchArmyToNeutral, cancelMarch, visibilityMap, investigateRumor, dismissRumor, claimQuestReward, acceptVassal, rejectVassal, declareIndependence, refuseTribute, dismissLord, adjustLordTax, toggleWarTax } = useGame();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollRef = useRef<ScrollView>(null);
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

  useEffect(() => {
    if (!state.gameStarted) return;
    markPlayed();
    checkReturnBonus().then(bonus => {
      if (bonus?.shouldShowBonus) {
        setTimeout(() => setToast({
          visible: true,
          message: `${bonus.message} (+${bonus.bonusGold} gold, +${bonus.bonusFaith} faith)`,
          type: 'info',
        }), 1200);
      }
    });
  }, [state.gameStarted]);


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
      case 'lay_claim': {
        claimNeutralProvince?.(province.id, 'lay_claim');
        setToast({ visible: true, message: `Envoys sent to lay claim to ${province.name}.`, type: 'info' });
        break;
      }
      case 'cancel_march': {
        const marchingArmies = state.armies.filter(a => a.owner === 'player' && a.location === province.id && a.status === 'marching' && a.marchPath && a.marchPath.length > 0);
        if (marchingArmies.length === 1) {
          cancelMarch?.(marchingArmies[0].id);
          setToast({ visible: true, message: `${marchingArmies[0].name} march cancelled.`, type: 'warning' });
        } else if (marchingArmies.length > 1) {
          Alert.alert(
            'Cancel Which March?',
            'Select the army to recall:',
            [
              ...marchingArmies.map(a => ({
                text: `${a.name} → ${state.provinces.find(p => p.id === a.marchPath![a.marchPath!.length - 1])?.name ?? '?'}`,
                onPress: () => {
                  cancelMarch?.(a.id);
                  setToast({ visible: true, message: `${a.name} march cancelled.`, type: 'warning' });
                },
              })),
              { text: 'Dismiss', style: 'cancel' as const, onPress: () => {} },
            ]
          );
        }
        break;
      }
      case 'send_troops': {
        const idleArmies = state.armies.filter(a => a.owner === 'player' && a.status === 'idle');
        if (idleArmies.length === 0) {
          Alert.alert('No Armies Available', 'All your armies are currently engaged. Recruit a new army or wait for one to return.');
          break;
        }
        const armyButtons = idleArmies.map(army => {
          const loc = state.provinces.find(p => p.id === army.location)?.name ?? army.location;
          return {
            text: `${army.name}  ·  ${army.troops} troops  ·  ${loc}`,
            onPress: () => {
              marchArmyToNeutral?.(army.id, province.id);
              setToast({ visible: true, message: `${army.name} marching on ${province.name}.`, type: 'info' });
            },
          };
        });
        armyButtons.push({ text: 'Cancel', onPress: () => {} } as any);
        Alert.alert(
          `March on ${province.name}`,
          'Select an army to send. They will march one province per turn through your territory.',
          armyButtons as any
        );
        break;
      }
      case 'attack': router.push('/armies' as any); break;
      case 'spy': {
        const isVisible = visibilityMap[province.id];
        if (isVisible && province.owner !== 'player' && province.owner !== 'neutral') {
          router.push(`/espionage?kingdomId=${province.owner}` as any);
        } else {
          router.push(`/espionage?provinceId=${province.id}&mode=undiscovered` as any);
        }
        break;
      }
      case 'diplomacy': {
        const ownerKingdomId = province.owner !== 'player' && province.owner !== 'neutral' ? province.owner : null;
        router.push(ownerKingdomId ? `/diplomacy?kingdomId=${ownerKingdomId}` as any : '/diplomacy' as any);
        break;
      }
      case 'trade': router.push('/trade' as any); break;
    }
  }, [router, state.resources, recruitArmy, reinforceGarrison, claimNeutralProvince]);
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
  const stewardshipCap = Math.floor((state.ruler.stewardship ?? 8) / 2) + 3;
  const crownProvinces = playerProvinces.filter(p => !(state.lords ?? []).some(l => (l.provinceIds ?? []).includes(p.id))).length;
  const isOverstretched = crownProvinces > stewardshipCap;
  const handleDismissLord = useCallback((provinceId: string, lordName: string) => {
    dismissLord?.(provinceId);
    setToast({ visible: true, message: `${lordName} dismissed. Province unrest rises.`, type: 'warning' });
  }, [dismissLord]);

  if (!isLoaded) {
    return (
      <View style={idx.root}>
        <LinearGradient colors={[Colors.bg.primary, Colors.bg.secondary, Colors.bg.primary]} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>👑</Text>
          <Text style={{ fontSize: 14, color: Colors.gold.dim, fontWeight: '600' as const }}>Loading your realm...</Text>
        </View>
      </View>
    );
  }

  if (!state.gameStarted) return <Redirect href="/welcome" />;

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
      <Modal visible={!!state.vassalOfferPending} transparent animationType="fade">
        <View style={idx.modalOverlay}>
          <View style={idx.modalCard}>
            <LinearGradient colors={['#1a1225', '#0d1117']} style={StyleSheet.absoluteFill} />
            <Text style={idx.modalIcon}>⚔️</Text>
            <Text style={[idx.modalTitle, { color: '#a78bfa' }]}>DEFEAT</Text>
            <Text style={[idx.modalDesc, { marginBottom: 6 }]}>Your realm has been conquered. But {state.kingdoms.find(k => k.id === state.vassalOfferPending?.overlordId)?.name ?? 'your conqueror'} offers you a choice...</Text>
            <Text style={[idx.modalDesc, { color: Colors.gold.bright, fontWeight: '700' as const, marginBottom: 16 }]}>Submit as a vassal and keep your capital — but pay tribute each turn based on your income (roughly 40% of gold earnings).</Text>
            <TouchableOpacity style={[idx.modalBtn, { backgroundColor: '#4c1d95', borderColor: '#7c3aed', marginBottom: 10 }]} onPress={acceptVassal} activeOpacity={0.7}>
              <Text style={idx.modalBtnText}>🤝 Bend the Knee</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[idx.modalBtn, { backgroundColor: '#3a1a1a', borderColor: '#7f1d1d' }]} onPress={rejectVassal} activeOpacity={0.7}>
              <Text style={[idx.modalBtnText, { color: '#ff4444' }]}>💀 Fight to the Last</Text>
            </TouchableOpacity>
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
      {state.isRegency && (
        <View style={idx.regencyBanner}>
          <Text style={idx.regencyBannerText}>
            👑 Regency — {state.ruler.name} rules until the heir comes of age
          </Text>
        </View>
      )}
      <View style={idx.header}>
        <TouchableOpacity style={idx.rulerButton} onPress={() => navigateTo("/ruler")} activeOpacity={0.7} testID="ruler-button">
          <View style={idx.rulerAvatar}><Crown size={18} color={Colors.gold.bright} /></View>
          <View style={idx.rulerInfo}>
            <Text style={idx.rulerName}>
              {state.isCustomKingdom && state.rulerTitle
                ? `${state.rulerTitle} ${state.ruler.name.replace(/^(Princess|Prince|Lady|Lord)\s+/i, '')}`
                : state.isRegency ? `Queen Regent ${state.ruler.name}` : state.ruler.name}
            </Text>
            <Text style={idx.dynastyName}>{state.ruler.dynasty}{state.isRegency && state.heir ? ` · Heir: ${state.heir.name} (age ${state.heir.age})` : ''}</Text>
          </View>
        </TouchableOpacity>
        <View style={idx.turnInfo}>
          <Text style={idx.yearText}>{state.year} AD</Text>
          <SeasonBadge season={state.season} />
        </View>
      </View>
      <ResourceBar resources={state.resources} />
      <PressureIndicators pressures={state.pressures} onPress={() => navigateTo('/pressures')} />
      <WarBanner wars={activeWars.map(w => ({ name: w.name, color: w.color }))} warTaxActive={state.warTaxActive} onToggleWarTax={toggleWarTax} />
      {(state.pendingAllyAttacks ?? []).length > 0 && (
        <View style={idx.allyMarchBanner}>
          {(state.pendingAllyAttacks ?? []).map(atk => (
            <Text key={atk.id} style={idx.allyMarchText}>
              ⚔️ {atk.allyName}'s army marching on {atk.targetName} — {atk.turnsLeft} turn{atk.turnsLeft > 1 ? 's' : ''} until assault
            </Text>
          ))}
        </View>
      )}
      {state.isPlayerVassal && state.playerOverlordId && (() => {
        const overlord = state.kingdoms.find(k => k.id === state.playerOverlordId);
        const tributeAmount = Math.max(30, Math.min(200, Math.floor((state.resources.goldPerTurn || 50) * 0.4)));
        const favor = state.overlordFavor ?? 50;
        const favorColor = favor > 60 ? Colors.status.success : favor > 30 ? Colors.status.warning : Colors.status.danger;
        const tributeRefused = state.refuseNextTribute;
        return (
          <View style={idx.vassalBanner}>
            <View style={idx.vassalBannerLeft}>
              <Text style={idx.vassalBannerIcon}>⛓️</Text>
              <View>
                <Text style={idx.vassalBannerTitle}>Vassal of {overlord?.name ?? 'your overlord'}</Text>
                <Text style={idx.vassalBannerSub}>
                  {tributeRefused ? '💢 Tribute refused this turn' : `Paying ${tributeAmount}g tribute per turn`}
                </Text>
                <Text style={[idx.vassalBannerSub, { color: favorColor, marginTop: 1 }]}>Favor: {favor}/100</Text>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              {!tributeRefused && (
                <TouchableOpacity style={idx.vassalRefuseBtn} onPress={() => {
                  Alert.alert(
                    'Refuse Tribute',
                    `Withhold the ${tributeAmount}g tribute from ${overlord?.name ?? 'your overlord'} this turn?\n\nRepeated refusals will lower their favor and may lead to war.`,
                    [
                      { text: 'Pay as normal', style: 'cancel' },
                      { text: 'Refuse', style: 'destructive', onPress: () => { refuseTribute(); } },
                    ]
                  );
                }} activeOpacity={0.7}>
                  <Text style={idx.vassalRefuseBtnText}>💰 Refuse</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={idx.vassalBreakBtn} onPress={() => {
                Alert.alert(
                  'Declare Independence',
                  `Break free from ${overlord?.name ?? 'your overlord'}? This will immediately start a war — ensure your armies are ready.`,
                  [
                    { text: 'Not yet', style: 'cancel' },
                    { text: 'Declare Independence!', style: 'destructive', onPress: declareIndependence },
                  ]
                );
              }} activeOpacity={0.7}>
                <Text style={idx.vassalBreakBtnText}>⚔️ Break Free</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
      {state.kingdoms.filter(k => k.attitude === 'war' && ((k.warScore ?? 0) <= -50 || k.provinces.length === 0)).map(k => (
        <TouchableOpacity key={`surr-${k.id}`} style={idx.surrenderBanner} onPress={() => navigateTo(`/diplomacy?kingdomId=${k.id}` as any)} activeOpacity={0.8}>
          <Text style={idx.surrenderBannerText}>⚔️ {k.name} is ready to surrender — demand it now!</Text>
          <ChevronRight size={14} color="#ef4444" />
        </TouchableOpacity>
      ))}
      <ScrollView ref={scrollRef} style={idx.scrollContent} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {seasonEffect && (
            <View style={idx.seasonEffectBar}>
              <Text style={idx.seasonEffectText}>{seasonEffect.description}</Text>
            </View>
          )}
          <View style={idx.statsRow}>
            <TouchableOpacity style={idx.statCard} onPress={() => navigateTo('/provinces')} activeOpacity={0.7}>
              <Text style={idx.statValue}>{playerProvinces.length}</Text>
              <Text style={idx.statLabel}>Provinces</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[idx.statCard, isOverstretched && { borderColor: Colors.status.warning }]} onPress={() => navigateTo('/pressures')} activeOpacity={0.7}>
              <Text style={[idx.statValue, isOverstretched && { color: Colors.status.warning }]}>{crownProvinces}/{stewardshipCap}</Text>
              <Text style={idx.statLabel}>Direct</Text>
            </TouchableOpacity>
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
          <DailyQuestsCard
            quests={state.dailyQuests ?? []}
            onClaim={id => { claimQuestReward?.(id); setToast({ visible: true, message: 'Quest reward claimed!', type: 'success' }); }}
          />
          <LordsOverviewPanel
            lords={state.lords ?? []}
            provinces={state.provinces}
            stewardshipCap={stewardshipCap}
            onDismiss={handleDismissLord}
            onAdjustTax={adjustLordTax}
          />
          <Text style={idx.sectionTitle}>Realm Map</Text>
          <MapView provinces={state.provinces} armies={state.armies} onProvincePress={handleProvincePress} selectedProvinceId={selectedProvince?.id ?? null} visibilityMap={visibilityMap} />
          <Text style={idx.sectionTitle}>Command</Text>
          <View style={idx.commandGrid}>
            {[
              { path: "/armies", icon: <Swords size={22} color={Colors.crimson.bright} />, bg: Colors.military.blood + "30", title: "Armies", sub: `${state.armies.length} forces`, id: "armies-btn" },
              { path: "/diplomacy", icon: <Globe size={22} color={Colors.gold.primary} />, bg: Colors.gold.dim + "30", title: "Diplomacy", sub: `${state.kingdoms.length} kingdoms`, id: "diplomacy-btn" },
              { path: "/events", icon: <ScrollText size={22} color={Colors.faith.light} />, bg: Colors.faith.purple + "30", title: "Events", sub: unseenEvents.length > 0 ? `${unseenEvents.length} awaiting` : "All quiet", id: "events-btn", badge: unseenEvents.length },
              { path: "/realm", icon: <Crown size={22} color={Colors.gold.bright} />, bg: Colors.gold.bright + "18", title: "Realm", sub: pressureSub, id: "realm-btn", badge: pressureBadge },
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
      <TutorialOverlay visible={state.gameStarted && !state.tutorialSeen} onFinish={dismissTutorial} />
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
  warBannerWrap: { backgroundColor: '#ff000018', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ff000030' },
  warBanner: { flexDirection: "row" as const, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 12 },
  warBannerText: { fontSize: 12, fontWeight: "800" as const, color: '#ff4444', letterSpacing: 1 },
  warTaxBtn: { flexDirection: "row" as const, alignItems: "center", gap: 5, paddingVertical: 4, paddingHorizontal: 12, marginHorizontal: 12, marginBottom: 6, borderRadius: 6, backgroundColor: Colors.bg.tertiary, borderWidth: 1, borderColor: Colors.border.primary },
  warTaxBtnActive: { backgroundColor: '#ff000025', borderColor: '#ff000060' },
  warTaxBtnText: { fontSize: 11, fontWeight: "700" as const, color: Colors.text.dim },
  surrenderBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#dc262618', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#dc262640' },
  surrenderBannerText: { flex: 1, fontSize: 12, fontWeight: "700" as const, color: '#ef4444' },
  regencyBanner: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#1a1030', borderBottomWidth: 1, borderColor: '#a78bfa50', alignItems: 'center' as const },
  regencyBannerText: { fontSize: 11, color: '#a78bfa', fontWeight: '700' as const, letterSpacing: 0.4 },
  vassalBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#1e1040', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#7c3aed50' },
  vassalBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  vassalBannerIcon: { fontSize: 18 },
  vassalBannerTitle: { fontSize: 13, fontWeight: "700" as const, color: '#a78bfa' },
  vassalBannerSub: { fontSize: 11, color: Colors.text.secondary, marginTop: 1 },
  vassalRefuseBtn: { backgroundColor: '#2a1a0a', borderWidth: 1, borderColor: '#92400e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  vassalRefuseBtnText: { fontSize: 11, fontWeight: "700" as const, color: '#f59e0b' },
  vassalBreakBtn: { backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  vassalBreakBtnText: { fontSize: 12, fontWeight: "700" as const, color: '#ef4444' },
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
  breakdownRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, paddingVertical: 4 },
  breakdownLabel: { fontSize: 12, color: Colors.text.dim, flex: 1 },
  breakdownValue: { fontSize: 12, fontWeight: "600" as const, textAlign: "right" as const },
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
  lordsPanel: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.gold + '50', overflow: "hidden" as const },
  lordsPanelHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 14, paddingVertical: 11 },
  lordsPanelLeft: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  lordsPanelTitle: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.bright, textTransform: "uppercase" as const, letterSpacing: 1 },
  lordsPanelBadge: { backgroundColor: Colors.gold.dim + '40', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  lordsPanelBadgeText: { fontSize: 10, fontWeight: "700" as const, color: Colors.gold.bright },
  lordsPanelRight: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  lordsCapWarning: { backgroundColor: Colors.status.warning + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: Colors.status.warning + '40' },
  lordsCapWarningText: { fontSize: 10, fontWeight: "700" as const, color: Colors.status.warning },
  lordsListWrap: { borderTopWidth: 1, borderTopColor: Colors.border.primary },
  lordRow: { paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border.primary + '60' },
  lordRowDanger: { backgroundColor: Colors.status.danger + '08' },
  lordRowMain: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  lordRowInfo: { flex: 1, minWidth: 0 },
  lordRowName: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.primary },
  lordRowProvince: { fontSize: 10, color: Colors.text.dim, marginTop: 1 },
  lordRowStats: { flexDirection: "row" as const, gap: 5 },
  lordStatChip: { alignItems: "center" as const, backgroundColor: Colors.bg.tertiary, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border.primary, minWidth: 36, flexDirection: "row" as const, gap: 2 },
  lordStatLabel: { fontSize: 8, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 0.3 },
  lordStatValue: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.primary },
  lordTaxRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginTop: 4 },
  lordTaxLabel: { fontSize: 11, color: Colors.text.dim, width: 28 },
  lordTaxBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: Colors.bg.tertiary, alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 1, borderColor: Colors.border.primary },
  lordTaxValue: { fontSize: 13, fontWeight: "800" as const, color: Colors.text.primary, width: 38, textAlign: "center" as const },
  lordTaxHint: { flex: 1, fontSize: 10, color: Colors.text.dim },
  lordDismissBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.status.danger + '15', borderWidth: 1, borderColor: Colors.status.danger + '30', alignItems: "center" as const, justifyContent: "center" as const },
  lordRowNameRow: { flexDirection: "row" as const, alignItems: "center", gap: 6 },
  peasantBadge: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Colors.border.primary },
  peasantBadgeText: { fontSize: 9, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const },
  lordsCrownInfo: { fontSize: 10, color: Colors.text.dim, marginRight: 6 },
  allyMarchBanner: { backgroundColor: '#1a2a1a', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#4ade8050', paddingHorizontal: 14, paddingVertical: 6, gap: 2 },
  allyMarchText: { fontSize: 12, fontWeight: "600" as const, color: '#4ade80' },
  lordRebellionWarn: { fontSize: 10, color: Colors.status.danger, fontWeight: "600" as const, marginTop: 4 },
});
