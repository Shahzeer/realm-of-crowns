import React, { useCallback, useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Animated, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Gift, AlertTriangle, Handshake, Flame, Flag, DollarSign, Eye, Heart, Megaphone, Scale, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Kingdom, AIPersonality } from "@/types/game";
import { PERSONALITY_LABELS } from "@/mocks/gameData";

type DiplomacyAction = 'gift' | 'threaten' | 'ally' | 'declare_war' | 'peace' | 'demand_tribute' | 'propose_marriage' | 'call_to_war';

function KingdomCard({ kingdom, onAction, onNegotiate, index, rulerMarried, hasPendingProposal }: {
  kingdom: Kingdom;
  onAction: (id: string, action: DiplomacyAction) => void;
  onNegotiate: (kingdom: Kingdom) => void;
  index: number;
  rulerMarried: boolean;
  hasPendingProposal: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const getAttitudeColor = (attitude: string) => {
    switch (attitude) {
      case "friendly": case "allied": return Colors.status.success;
      case "neutral": return Colors.status.warning;
      case "hostile": return Colors.status.danger;
      case "war": return "#ff0000";
      default: return Colors.text.dim;
    }
  };

  const attColor = getAttitudeColor(kingdom.attitude);
  const relColor = kingdom.relation > 0 ? Colors.status.success : kingdom.relation < 0 ? Colors.status.danger : Colors.text.secondary;
  const isAtWar = kingdom.attitude === 'war';
  const isHostile = kingdom.attitude === 'hostile';
  const isVassal = !!kingdom.isVassal;
  const vassalTribute = isVassal ? Math.max(40, Math.min(150, kingdom.provinces.length * 20)) : 0;
  const hasProposal = !!kingdom.marriageProposal;
  const canMarry = !rulerMarried && !hasPendingProposal && !isAtWar && !isHostile && !hasProposal;
  const totalArmyStrength = kingdom.armies.reduce((sum, a) => sum + a.troops, 0);
  const warScore = kingdom.warScore ?? 0;
  const canDemandTribute = isAtWar && warScore <= -30;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[d.kingdomCard, isAtWar && d.warCard]}>
        {isVassal && (
          <View style={d.vassalStrip}>
            <Text style={d.vassalStripText}>👑 VASSAL STATE</Text>
            <View style={d.vassalTributeBadge}>
              <Text style={d.vassalTributeText}>+{vassalTribute}g tribute/turn</Text>
            </View>
          </View>
        )}
        {isAtWar && (
          <View style={d.warStrip}>
            <Flame size={12} color="#ff4444" />
            <Text style={d.warStripText}>AT WAR</Text>
            <View style={d.warScoreBadge}>
              <Text style={[d.warScoreText, { color: warScore > 0 ? Colors.crimson.bright : warScore < 0 ? Colors.status.success : Colors.text.dim }]}>
                War Score: {warScore > 0 ? '+' : ''}{warScore}
              </Text>
            </View>
          </View>
        )}
        <View style={d.kingdomHeader}>
          <View style={[d.crest, { backgroundColor: kingdom.color + '30' }]}>
            <Text style={[d.crestLetter, { color: kingdom.color }]}>{kingdom.name.charAt(0)}</Text>
          </View>
          <View style={d.kingdomInfo}>
            <Text style={d.kingdomName}>{kingdom.name}</Text>
            <Text style={d.rulerName}>{kingdom.ruler.name} - {kingdom.ruler.dynasty}</Text>
          </View>
          <View style={[d.attBadge, { backgroundColor: attColor + '20' }]}>
            <Text style={[d.attText, { color: attColor }]}>{kingdom.attitude.toUpperCase()}</Text>
          </View>
        </View>
        <View style={d.detailRow}>
          <View style={d.detailItem}>
            <Text style={d.detailLabel}>Relations</Text>
            <Text style={[d.detailValue, { color: relColor }]}>{kingdom.relation > 0 ? '+' : ''}{kingdom.relation}</Text>
          </View>
          <View style={d.detailItem}>
            <Text style={d.detailLabel}>Armies</Text>
            <Text style={d.detailValue}>{totalArmyStrength}</Text>
          </View>
          <View style={d.detailItem}>
            <Text style={d.detailLabel}>Provinces</Text>
            <Text style={d.detailValue}>{kingdom.provinces.length}</Text>
          </View>
        </View>
        {kingdom.allyOf && kingdom.allyOf.length > 0 && (
          <View style={d.allyInfo}>
            <Text style={d.allyLabel}>Allied with other kingdoms</Text>
          </View>
        )}
        {kingdom.intel && kingdom.intel.confidence > 0 && (
          <View style={d.intelSection}>
            <View style={d.intelHeader}>
              <Eye size={12} color="#8b5cf6" />
              <Text style={d.intelTitle}>Intelligence ({kingdom.intel.confidence}% confidence)</Text>
            </View>
            {kingdom.intel.personalityGuesses.length > 0 && (
              <View style={d.intelGuesses}>
                {kingdom.intel.personalityGuesses.map((guess: AIPersonality, i: number) => {
                  const label = PERSONALITY_LABELS[guess];
                  return (
                    <View key={i} style={[d.intelChip, { backgroundColor: label.color + '15', borderColor: label.color + '40' }]}>
                      <Text style={d.intelChipIcon}>{label.icon}</Text>
                      <Text style={[d.intelChipText, { color: label.color }]}>{label.name}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            {kingdom.intel.rumors.length > 0 && (
              <Text style={d.intelRumor}>{kingdom.intel.rumors[kingdom.intel.rumors.length - 1]}</Text>
            )}
          </View>
        )}
        <View style={d.rulerStats}>
          <Text style={d.rulerStatsLabel}>Ruler Stats:</Text>
          <View style={d.rulerStatRow}>
            <Text style={d.rulerStat}>🗣️{kingdom.ruler.diplomacy}</Text>
            <Text style={d.rulerStat}>⚔️{kingdom.ruler.martial}</Text>
            <Text style={d.rulerStat}>💰{kingdom.ruler.stewardship}</Text>
            <Text style={d.rulerStat}>🗡️{kingdom.ruler.intrigue}</Text>
          </View>
        </View>
        <View style={d.actionRow}>
          {!isAtWar ? (
            <>
              <TouchableOpacity style={[d.actionBtn, d.giftBtn]} onPress={() => onAction(kingdom.id, 'gift')} activeOpacity={0.7}>
                <Gift size={14} color={Colors.gold.bright} /><Text style={d.giftText}>Gift (100g)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[d.actionBtn, d.threatenBtn]} onPress={() => onAction(kingdom.id, 'threaten')} activeOpacity={0.7}>
                <AlertTriangle size={14} color={Colors.crimson.bright} /><Text style={d.threatenText}>Threaten</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[d.actionBtn, d.allyBtn]} onPress={() => onAction(kingdom.id, 'ally')} activeOpacity={0.7}>
                <Handshake size={14} color={Colors.status.info} /><Text style={d.allyText}>Ally (200g)</Text>
              </TouchableOpacity>
              {hasProposal ? (
                <View style={[d.actionBtn, d.marriageProposedBtn]}>
                  <Heart size={14} color="#f472b6" /><Text style={d.marriageProposedText}>Awaiting Reply…</Text>
                </View>
              ) : canMarry ? (
                <TouchableOpacity style={[d.actionBtn, d.marriageBtn]} onPress={() => onAction(kingdom.id, 'propose_marriage')} activeOpacity={0.7}>
                  <Heart size={14} color="#f472b6" /><Text style={d.marriageText}>Propose (150g)</Text>
                </TouchableOpacity>
              ) : rulerMarried ? null : null}
            </>
          ) : (
            <>
              <TouchableOpacity style={[d.actionBtn, d.negotiateBtn]} onPress={() => onNegotiate(kingdom)} activeOpacity={0.7}>
                <Scale size={14} color={Colors.status.success} /><Text style={d.negotiateText}>Negotiate Peace</Text>
              </TouchableOpacity>
              {canDemandTribute && (
                <TouchableOpacity style={[d.actionBtn, d.tributeBtn]} onPress={() => onAction(kingdom.id, 'demand_tribute')} activeOpacity={0.7}>
                  <DollarSign size={14} color={Colors.gold.bright} /><Text style={d.tributeText}>Demand Tribute</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        {!isAtWar && kingdom.attitude === 'allied' && (
          <TouchableOpacity style={d.callWarBtn} onPress={() => onAction(kingdom.id, 'call_to_war')} activeOpacity={0.7}>
            <Megaphone size={14} color={Colors.gold.bright} /><Text style={d.callWarText}>Call Ally to War</Text>
          </TouchableOpacity>
        )}
        {!isAtWar && kingdom.attitude !== 'allied' && (
          <TouchableOpacity style={d.warBtn} onPress={() => onAction(kingdom.id, 'declare_war')} activeOpacity={0.7}>
            <Flame size={14} color="#ff4444" /><Text style={d.warBtnText}>Declare War</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

type PeaceTermType = 'white_peace' | 'reparations' | 'demand_province' | 'pay_reparations' | 'cede_province' | 'vassalize';

export default function DiplomacyScreen() {
  console.log("[RealmOfCrowns] Diplomacy render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, sendDiplomacy, negotiatePeace, activeWars } = useGame();
  const [peaceKingdom, setPeaceKingdom] = useState<Kingdom | null>(null);
  const [peaceTermType, setPeaceTermType] = useState<PeaceTermType>('white_peace');
  const [peaceProvinceId, setPeaceProvinceId] = useState<string | null>(null);

  const warScore = peaceKingdom?.warScore ?? 0;
  const isWinning = warScore < -25;
  const isLosing = warScore > 25;

  const enemyProvinces = state.provinces.filter(p => peaceKingdom && p.owner === peaceKingdom.id);
  const playerBorderProvinces = state.provinces.filter(p =>
    p.owner === 'player' &&
    p.connectedTo.some(c => {
      const cp = state.provinces.find(pr => pr.id === c);
      return cp && peaceKingdom && cp.owner === peaceKingdom.id;
    })
  );

  const openPeaceModal = useCallback((kingdom: Kingdom) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    setPeaceKingdom(kingdom);
    setPeaceTermType('white_peace');
    setPeaceProvinceId(null);
  }, []);

  const closePeaceModal = useCallback(() => {
    setPeaceKingdom(null);
    setPeaceProvinceId(null);
  }, []);

  const confirmPeace = useCallback(() => {
    if (!peaceKingdom) return;
    if ((peaceTermType === 'demand_province' || peaceTermType === 'cede_province') && !peaceProvinceId) {
      Alert.alert("Select a Province", "Please choose a province for the peace terms.");
      return;
    }
    if (peaceTermType === 'pay_reparations' && state.resources.gold < 300) {
      Alert.alert("Insufficient Gold", "You need 300 gold to pay reparations.");
      return;
    }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    negotiatePeace(peaceKingdom.id, {
      type: peaceTermType,
      provinceId: peaceProvinceId ?? undefined,
      gold: (peaceTermType === 'reparations' || peaceTermType === 'pay_reparations') ? 300 : undefined,
    });
    closePeaceModal();
  }, [peaceKingdom, peaceTermType, peaceProvinceId, state.resources.gold, negotiatePeace, closePeaceModal]);

  const handleAction = useCallback((kingdomId: string, action: DiplomacyAction) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    if (action === 'declare_war') {
      const kingdom = state.kingdoms.find(k => k.id === kingdomId);
      Alert.alert(
        "Declare War",
        `Are you sure you want to declare war on ${kingdom?.name ?? 'this kingdom'}? This will severely damage relations.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Declare War!", style: "destructive", onPress: () => sendDiplomacy(kingdomId, action) },
        ]
      );
      return;
    }
    const costs: Record<DiplomacyAction, number> = { gift: 100, threaten: 0, ally: 200, peace: 150, demand_tribute: 0, declare_war: 0, propose_marriage: 150, call_to_war: 0 };
    if (state.resources.gold < (costs[action] || 0)) {
      Alert.alert("Insufficient Gold", `You need ${costs[action]} gold.`);
      return;
    }
    sendDiplomacy(kingdomId, action);
  }, [sendDiplomacy, state.resources.gold, state.kingdoms]);

  const allies = state.kingdoms.filter(k => k.attitude === 'allied');

  const warScoreBarColor = warScore < -25 ? Colors.status.success : warScore > 25 ? Colors.crimson.bright : Colors.status.warning;
  const warScoreBarWidth = Math.min(100, Math.abs(warScore) * 1.2);
  const warScoreSide = warScore < 0 ? 'left' : 'right';

  const termOptions: Array<{ type: PeaceTermType; label: string; desc: string; color: string; available: boolean }> = [
    {
      type: 'white_peace',
      label: '🕊️ White Peace',
      desc: 'End the war with no conditions. Both sides return to pre-war borders.',
      color: Colors.text.secondary,
      available: warScore < 60,
    },
    {
      type: 'reparations',
      label: '💰 Demand Reparations (+300g)',
      desc: `${peaceKingdom?.name ?? 'Enemy'} pays 300 gold to end the war.`,
      color: Colors.gold.bright,
      available: isWinning,
    },
    {
      type: 'demand_province',
      label: '🏰 Demand Province',
      desc: `Claim one of ${peaceKingdom?.name ?? "enemy"}'s provinces as the price of peace.`,
      color: Colors.status.success,
      available: isWinning && enemyProvinces.length > 0,
    },
    {
      type: 'pay_reparations',
      label: '💸 Pay Reparations (-300g)',
      desc: 'Pay 300 gold to end the war on your terms.',
      color: Colors.status.warning,
      available: isLosing,
    },
    {
      type: 'cede_province',
      label: '📜 Cede Province',
      desc: 'Give up one of your border provinces to secure peace.',
      color: Colors.crimson.bright,
      available: isLosing && playerBorderProvinces.length > 0,
    },
    {
      type: 'vassalize',
      label: '👑 Demand Vassalization',
      desc: `${peaceKingdom?.name ?? 'Enemy'} becomes your vassal, paying tribute each turn. They keep their lands but serve your crown.`,
      color: Colors.gold.bright,
      available: warScore < -60 && enemyProvinces.length > 0,
    },
  ].filter(t => t.available);

  return (
    <View style={[d.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, '#161820', Colors.bg.primary]} style={StyleSheet.absoluteFill} />
      <View style={d.header}>
        <View style={d.headerLeft}>
          <GlobeIcon size={22} color={Colors.gold.bright} />
          <Text style={d.title}>Diplomacy</Text>
          {activeWars.length > 0 && (
            <View style={d.warCountBadge}><Text style={d.warCountText}>{activeWars.length} war{activeWars.length > 1 ? 's' : ''}</Text></View>
          )}
          {allies.length > 0 && (
            <View style={d.allyCountBadge}><Text style={d.allyCountText}>{allies.length} ally</Text></View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={d.closeBtn} testID="close-diplomacy"><X size={22} color={Colors.text.secondary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {state.kingdoms.map((kingdom, idx) => (
          <KingdomCard key={kingdom.id} kingdom={kingdom} onAction={handleAction} onNegotiate={openPeaceModal} index={idx}
            rulerMarried={!!state.ruler.spouse}
            hasPendingProposal={state.kingdoms.some(k => k.marriageProposal)}
          />
        ))}
      </ScrollView>

      <Modal visible={!!peaceKingdom} transparent animationType="slide" onRequestClose={closePeaceModal}>
        <View style={d.modalOverlay}>
          <View style={d.modalSheet}>
            <LinearGradient colors={['#0e1520', '#0a0d14']} style={StyleSheet.absoluteFill} />
            <View style={d.modalHandle} />

            <View style={d.modalHeader}>
              <Scale size={18} color={Colors.status.success} />
              <Text style={d.modalTitle}>Peace Negotiations</Text>
              <TouchableOpacity onPress={closePeaceModal} style={d.modalCloseBtn}>
                <X size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {peaceKingdom && (
              <>
                <View style={d.warSummaryCard}>
                  <View style={d.warSummaryRow}>
                    <View style={d.warSummaryKingdom}>
                      <View style={[d.warSummaryCrest, { backgroundColor: peaceKingdom.color + '30' }]}>
                        <Text style={[d.warSummaryCrestLetter, { color: peaceKingdom.color }]}>{peaceKingdom.name.charAt(0)}</Text>
                      </View>
                      <Text style={d.warSummaryName}>{peaceKingdom.name}</Text>
                    </View>
                    <View style={d.warSummaryVs}>
                      <Flame size={14} color="#ff4444" />
                      <Text style={d.warSummaryVsText}>vs</Text>
                    </View>
                    <View style={d.warSummaryKingdom}>
                      <View style={[d.warSummaryCrest, { backgroundColor: Colors.crimson.dark + '40' }]}>
                        <Text style={[d.warSummaryCrestLetter, { color: Colors.gold.bright }]}>Y</Text>
                      </View>
                      <Text style={d.warSummaryName}>You</Text>
                    </View>
                  </View>
                  <View style={d.warBarContainer}>
                    <Text style={d.warBarLabel}>{isWinning ? '⚔️ You are winning' : isLosing ? '💀 You are losing' : '⚖️ Stalemate'}</Text>
                    <View style={d.warBarBg}>
                      <View style={[
                        d.warBarFill,
                        {
                          width: `${warScoreBarWidth}%` as any,
                          backgroundColor: warScoreBarColor,
                          alignSelf: warScoreSide === 'left' ? 'flex-start' : 'flex-end',
                        }
                      ]} />
                    </View>
                    <Text style={[d.warBarScore, { color: warScoreBarColor }]}>
                      War Score: {warScore > 0 ? '+' : ''}{warScore}
                    </Text>
                  </View>
                </View>

                <Text style={d.termsSectionTitle}>Choose Peace Terms</Text>
                {termOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[d.termOption, peaceTermType === opt.type && { borderColor: opt.color, backgroundColor: opt.color + '12' }]}
                    onPress={() => { setPeaceTermType(opt.type); if (opt.type !== 'demand_province' && opt.type !== 'cede_province') setPeaceProvinceId(null); }}
                    activeOpacity={0.7}
                  >
                    <View style={d.termOptionLeft}>
                      <View style={[d.termRadio, peaceTermType === opt.type && { backgroundColor: opt.color, borderColor: opt.color }]} />
                      <View style={d.termOptionText}>
                        <Text style={[d.termOptionLabel, peaceTermType === opt.type && { color: opt.color }]}>{opt.label}</Text>
                        <Text style={d.termOptionDesc}>{opt.desc}</Text>
                      </View>
                    </View>
                    {peaceTermType === opt.type && (opt.type === 'demand_province' || opt.type === 'cede_province') && (
                      <ChevronRight size={16} color={opt.color} />
                    )}
                  </TouchableOpacity>
                ))}

                {peaceTermType === 'demand_province' && enemyProvinces.length > 0 && (
                  <View style={d.provincePickerSection}>
                    <Text style={d.provincePickerTitle}>Select Province to Claim</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={d.provinceScroll}>
                      {enemyProvinces.map(p => (
                        <TouchableOpacity
                          key={p.id}
                          style={[d.provinceChip, peaceProvinceId === p.id && d.provinceChipSelected]}
                          onPress={() => setPeaceProvinceId(p.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[d.provinceChipName, peaceProvinceId === p.id && d.provinceChipNameSelected]}>{p.name}</Text>
                          <Text style={d.provinceChipPop}>Pop {p.population}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {peaceTermType === 'cede_province' && playerBorderProvinces.length > 0 && (
                  <View style={d.provincePickerSection}>
                    <Text style={d.provincePickerTitle}>Select Province to Cede</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={d.provinceScroll}>
                      {playerBorderProvinces.map(p => (
                        <TouchableOpacity
                          key={p.id}
                          style={[d.provinceChip, d.provinceChipCede, peaceProvinceId === p.id && d.provinceChipCedeSelected]}
                          onPress={() => setPeaceProvinceId(p.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[d.provinceChipName, peaceProvinceId === p.id && { color: Colors.crimson.bright }]}>{p.name}</Text>
                          <Text style={d.provinceChipPop}>Pop {p.population}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {peaceTermType === 'vassalize' && peaceKingdom && (
                  <View style={d.vassalPreview}>
                    <Text style={d.vassalPreviewTitle}>Vassal Terms</Text>
                    <Text style={d.vassalPreviewDesc}>
                      {peaceKingdom.name} will pay{' '}
                      <Text style={d.vassalPreviewGold}>
                        {Math.max(40, Math.min(150, peaceKingdom.provinces.length * 20))}g
                      </Text>
                      {' '}each turn as tribute. They retain their provinces and armies but cannot declare war on you.
                    </Text>
                  </View>
                )}
                <View style={d.modalActions}>
                  <TouchableOpacity style={d.cancelBtn} onPress={closePeaceModal} activeOpacity={0.7}>
                    <Text style={d.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={d.confirmBtn} onPress={confirmPeace} activeOpacity={0.7}>
                    <Scale size={16} color="#fff" />
                    <Text style={d.confirmBtnText}>Sign Treaty</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GlobeIcon({ size, color }: { size: number; color: string }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: size * 0.5, color }}>🌍</Text></View>;
}

const d = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "800" as const, color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  warCountBadge: { backgroundColor: '#ff000020', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  warCountText: { fontSize: 10, fontWeight: "700" as const, color: '#ff4444' },
  allyCountBadge: { backgroundColor: Colors.status.success + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  allyCountText: { fontSize: 10, fontWeight: "700" as const, color: Colors.status.success },
  kingdomCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border.primary },
  warCard: { borderColor: '#ff000040' },
  vassalStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8, borderRadius: 6, backgroundColor: '#d4a02415' },
  vassalStripText: { fontSize: 10, fontWeight: "800" as const, color: Colors.gold.bright, letterSpacing: 2 },
  vassalTributeBadge: { backgroundColor: Colors.gold.bright + '25', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  vassalTributeText: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.bright },
  vassalPreview: { marginTop: 10, marginBottom: 6, padding: 12, borderRadius: 8, backgroundColor: Colors.gold.bright + '12', borderWidth: 1, borderColor: Colors.gold.bright + '30' },
  vassalPreviewTitle: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.bright, marginBottom: 4 },
  vassalPreviewDesc: { fontSize: 12, color: Colors.text.secondary, lineHeight: 18 },
  vassalPreviewGold: { color: Colors.gold.bright, fontWeight: "700" as const },
  warStrip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4, marginBottom: 8, borderRadius: 6, backgroundColor: '#ff000015' },
  warStripText: { fontSize: 10, fontWeight: "800" as const, color: '#ff4444', letterSpacing: 2 },
  warScoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.bg.tertiary },
  warScoreText: { fontSize: 10, fontWeight: "700" as const },
  kingdomHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  crest: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  crestLetter: { fontSize: 20, fontWeight: "800" as const },
  kingdomInfo: { flex: 1, gap: 2 },
  kingdomName: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  rulerName: { fontSize: 12, color: Colors.text.secondary },
  attBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  attText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.5 },
  detailRow: { flexDirection: "row", marginTop: 14, gap: 10 },
  detailItem: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 8, padding: 8, alignItems: "center", gap: 2 },
  detailLabel: { fontSize: 10, color: Colors.text.dim, textTransform: "uppercase" as const },
  detailValue: { fontSize: 16, fontWeight: "700" as const, color: Colors.text.primary },
  allyInfo: { marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: Colors.status.success + '10' },
  allyLabel: { fontSize: 10, color: Colors.status.success, fontWeight: "600" as const },
  intelSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  intelHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginBottom: 6 },
  intelTitle: { fontSize: 10, fontWeight: "700" as const, color: '#8b5cf6', letterSpacing: 0.5, textTransform: "uppercase" as const },
  intelGuesses: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6, marginBottom: 6 },
  intelChip: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  intelChipIcon: { fontSize: 12 },
  intelChipText: { fontSize: 10, fontWeight: "700" as const },
  intelRumor: { fontSize: 11, color: Colors.text.secondary, fontStyle: "italic" as const, lineHeight: 16 },
  rulerStats: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  rulerStatsLabel: { fontSize: 10, color: Colors.text.dim, marginBottom: 4 },
  rulerStatRow: { flexDirection: "row", gap: 12 },
  rulerStat: { fontSize: 12, color: Colors.text.secondary },
  actionRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  giftBtn: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + "15" },
  giftText: { fontSize: 11, fontWeight: "600" as const, color: Colors.gold.bright },
  threatenBtn: { borderColor: Colors.crimson.dark, backgroundColor: Colors.crimson.dark + "15" },
  threatenText: { fontSize: 11, fontWeight: "600" as const, color: Colors.crimson.bright },
  allyBtn: { borderColor: Colors.status.info + "40", backgroundColor: Colors.status.info + "10" },
  allyText: { fontSize: 11, fontWeight: "600" as const, color: Colors.status.info },
  negotiateBtn: { borderColor: Colors.status.success + '50', backgroundColor: Colors.status.success + '12' },
  negotiateText: { fontSize: 11, fontWeight: "700" as const, color: Colors.status.success },
  peaceBtn: { borderColor: Colors.status.success + '40', backgroundColor: Colors.status.success + '10' },
  peaceText: { fontSize: 11, fontWeight: "600" as const, color: Colors.status.success },
  tributeBtn: { borderColor: Colors.gold.dim, backgroundColor: Colors.gold.dim + '15' },
  tributeText: { fontSize: 11, fontWeight: "600" as const, color: Colors.gold.bright },
  marriageBtn: { borderColor: '#f472b650', backgroundColor: '#f472b615' },
  marriageText: { fontSize: 11, fontWeight: "600" as const, color: '#f472b6' },
  marriageProposedBtn: { borderColor: '#f472b630', backgroundColor: '#f472b608', opacity: 0.8 },
  marriageProposedText: { fontSize: 11, fontWeight: "600" as const, color: '#f472b6', fontStyle: 'italic' as const },
  callWarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.gold.bright + '40', backgroundColor: Colors.gold.bright + '12' },
  callWarText: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.bright },
  warBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ff000030', backgroundColor: '#ff000008' },
  warBtnText: { fontSize: 12, fontWeight: "600" as const, color: '#ff4444' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, overflow: 'hidden' as const, borderWidth: 1, borderColor: Colors.border.primary, borderBottomWidth: 0, maxHeight: '85%' as const },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border.primary, alignSelf: 'center' as const, marginTop: 12, marginBottom: 16 },
  modalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 16 },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '800' as const, color: Colors.text.primary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.tertiary, alignItems: 'center' as const, justifyContent: 'center' as const },
  warSummaryCard: { backgroundColor: Colors.bg.tertiary, borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#ff000025' },
  warSummaryRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 14 },
  warSummaryKingdom: { alignItems: 'center' as const, gap: 6 },
  warSummaryCrest: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const },
  warSummaryCrestLetter: { fontSize: 18, fontWeight: '800' as const },
  warSummaryName: { fontSize: 12, fontWeight: '600' as const, color: Colors.text.secondary },
  warSummaryVs: { alignItems: 'center' as const, gap: 2 },
  warSummaryVsText: { fontSize: 10, fontWeight: '700' as const, color: Colors.text.dim },
  warBarContainer: { gap: 6 },
  warBarLabel: { fontSize: 12, fontWeight: '700' as const, color: Colors.text.primary, textAlign: 'center' as const },
  warBarBg: { height: 8, borderRadius: 4, backgroundColor: Colors.bg.primary, overflow: 'hidden' as const },
  warBarFill: { height: '100%' as const, borderRadius: 4 },
  warBarScore: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const },
  termsSectionTitle: { fontSize: 12, fontWeight: '700' as const, color: Colors.text.dim, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 },
  termOption: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: Colors.border.primary },
  termOptionLeft: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12, flex: 1 },
  termRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border.primary, marginTop: 2 },
  termOptionText: { flex: 1, gap: 3 },
  termOptionLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.text.primary },
  termOptionDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 16 },
  provincePickerSection: { marginBottom: 14 },
  provincePickerTitle: { fontSize: 12, fontWeight: '700' as const, color: Colors.text.secondary, marginBottom: 8 },
  provinceScroll: { flexGrow: 0 },
  provinceChip: { backgroundColor: Colors.bg.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, borderWidth: 1.5, borderColor: Colors.status.success + '40', alignItems: 'center' as const },
  provinceChipSelected: { borderColor: Colors.status.success, backgroundColor: Colors.status.success + '15' },
  provinceChipCede: { borderColor: Colors.crimson.dark + '40' },
  provinceChipCedeSelected: { borderColor: Colors.crimson.bright, backgroundColor: Colors.crimson.bright + '15' },
  provinceChipName: { fontSize: 12, fontWeight: '700' as const, color: Colors.text.primary },
  provinceChipNameSelected: { color: Colors.status.success },
  provinceChipPop: { fontSize: 10, color: Colors.text.dim, marginTop: 2 },
  modalActions: { flexDirection: 'row' as const, gap: 12, marginTop: 6 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.bg.tertiary, alignItems: 'center' as const },
  cancelBtnText: { fontSize: 14, fontWeight: '700' as const, color: Colors.text.secondary },
  confirmBtn: { flex: 2, flexDirection: 'row' as const, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.status.success, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  confirmBtnText: { fontSize: 14, fontWeight: '800' as const, color: '#fff' },
});
