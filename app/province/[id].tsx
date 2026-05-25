import React, { useCallback, useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, ArrowUpCircle, Shield, Users, TrendingUp, Swords, Hammer, ChevronDown, ChevronUp, Eye, Lock, Crown, UserX, Minus, Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { PROVINCE_TYPE_ICONS, BUILDING_BLUEPRINTS, BLUEPRINT_UNLOCK_MAP, INITIAL_TECHNOLOGIES } from "@/mocks/gameData";

export default function ProvinceDetailScreen() {
  console.log("[RealmOfCrowns] Province detail render");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, upgradeBuilding, recruitArmy, constructBuilding, reinforceGarrison, visibilityMap, assignLord, dismissLord, adjustLordTax } = useGame();
  const province = state.provinces.find(p => p.id === id);
  const isOwned = province?.owner === 'player';
  const isFogged = province ? !visibilityMap[province.id] : false;
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [recruitTroops, setRecruitTroops] = useState(50);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleUpgrade = useCallback((buildingId: string) => {
    if (!id) return;
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    upgradeBuilding(id, buildingId);
  }, [id, upgradeBuilding]);

  const handleRecruit = useCallback(() => {
    if (!id || !province) return;
    const garrison = province.garrison ?? 0;
    if (garrison < 50) { Alert.alert("Insufficient Garrison", `Need at least 50 garrison troops to raise an army. Current garrison: ${garrison}.`); return; }
    const troops = recruitTroops;
    const goldCost = Math.max(1, Math.floor(troops * 0.5));
    if (state.resources.gold < goldCost) { Alert.alert("Insufficient Gold", `Need ${goldCost} gold to equip ${troops} soldiers.`); return; }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    recruitArmy(id, troops);
    Alert.alert("Army Raised", `${troops} soldiers levied from ${province.name} garrison (${goldCost}g equipping).`);
  }, [id, province, recruitTroops, state.resources.gold, recruitArmy]);

  const handleConstruct = useCallback((blueprintId: string) => {
    if (!id) return;
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    constructBuilding(id, blueprintId);
    setShowBuildMenu(false);
  }, [id, constructBuilding]);

  if (!province) {
    return (
      <View style={[ps.root, { paddingTop: insets.top }]}>
        <Text style={ps.errorText}>Province not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={ps.backLink}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const armiesHere = state.armies.filter(a => a.location === province.id);
  const ownerKingdom = !isOwned ? state.kingdoms.find(k => k.id === province.owner) : null;
  const assignedLord = isOwned ? (state.lords ?? []).find(l => (l.provinceIds ?? []).includes(province?.id ?? '')) : null;
  const stewardshipCap = Math.floor(state.ruler.stewardship / 2) + 3;
  const crownProvinceCount = (state.provinces ?? []).filter(p => p.owner === 'player' && !(state.lords ?? []).some(l => (l.provinceIds ?? []).includes(p.id))).length;
  const otherLords = (state.lords ?? []).filter(l => !(l.provinceIds ?? []).includes(province?.id ?? ''));
  const canBuild = isOwned && province.buildings.length < 5;
  const unlockedIds = state.unlockedBlueprints ?? [];
  const typeFilteredBlueprints = BUILDING_BLUEPRINTS.filter(bp => {
    if (!bp.requiredType) return true;
    return bp.requiredType.includes(province.type);
  }).filter(bp => {
    return !province.buildings.some(b => b.name === bp.name);
  });
  const unlockedBlueprints = typeFilteredBlueprints.filter(bp => unlockedIds.includes(bp.id));
  const lockedBlueprints = typeFilteredBlueprints.filter(bp => !unlockedIds.includes(bp.id));
  const getRequiredTechName = (bpId: string): string => {
    const techId = BLUEPRINT_UNLOCK_MAP[bpId];
    if (!techId) return 'Unknown';
    const tech = INITIAL_TECHNOLOGIES.find(t => t.id === techId);
    return tech?.name ?? 'Unknown';
  };

  return (
    <View style={[ps.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[Colors.bg.primary, Colors.bg.secondary]} style={StyleSheet.absoluteFill} />
      <View style={ps.header}>
        <View style={ps.headerLeft}>
          <Text style={ps.typeIcon}>{PROVINCE_TYPE_ICONS[province.type] ?? '🏠'}</Text>
          <View>
            <Text style={ps.provinceName}>{province.name}</Text>
            <Text style={ps.provinceType}>
              {province.type.charAt(0).toUpperCase() + province.type.slice(1)} — {isOwned ? 'Your Territory' : ownerKingdom ? ownerKingdom.name : 'Foreign Land'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={ps.closeBtn} testID="close-province"><X size={22} color={Colors.text.secondary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {isFogged && (
            <View style={ps.fogBanner}>
              <Eye size={18} color="#4a4d58" />
              <View style={ps.fogBannerText}>
                <Text style={ps.fogTitle}>Fog of War</Text>
                <Text style={ps.fogDesc}>This territory is shrouded. Send spies or move armies nearby to reveal intel.</Text>
              </View>
            </View>
          )}

          {!isFogged && province.underSiege && (
            <View style={ps.siegeBanner}>
              <Swords size={16} color="#ff4444" />
              <Text style={ps.siegeText}>UNDER SIEGE — {province.siegeProgress ?? 0}% complete</Text>
              <View style={ps.siegeBarBg}>
                <View style={[ps.siegeBarFill, { width: `${province.siegeProgress ?? 0}%` }]} />
              </View>
            </View>
          )}

          <View style={ps.statsGrid}>
            <View style={ps.statItem}>
              <Users size={16} color={isFogged ? '#2a2d38' : Colors.gold.primary} />
              <Text style={[ps.statNum, isFogged && ps.foggedNum]}>{isFogged ? '?' : (province.population / 1000).toFixed(1) + 'k'}</Text>
              <Text style={ps.statLbl}>Population</Text>
            </View>
            <View style={ps.statItem}>
              <TrendingUp size={16} color={isFogged ? '#2a2d38' : Colors.food.light} />
              <Text style={[ps.statNum, isFogged && ps.foggedNum]}>{isFogged ? '?' : province.development + '%'}</Text>
              <Text style={ps.statLbl}>Development</Text>
            </View>
            <View style={ps.statItem}>
              <Shield size={16} color={isFogged ? '#2a2d38' : Colors.military.steel} />
              <Text style={[ps.statNum, isFogged && ps.foggedNum]}>{isFogged ? '?' : province.garrison}</Text>
              <Text style={ps.statLbl}>Garrison</Text>
            </View>
          </View>

          {isOwned && !isFogged && (
            <View style={ps.loyaltySection}>
              <View style={ps.loyaltyRow}>
                <View style={ps.loyaltyItem}>
                  <Text style={ps.loyaltyLabel}>Loyalty</Text>
                  <View style={ps.loyaltyBarBg}>
                    <View style={[ps.loyaltyBarFill, {
                      width: `${province.loyalty ?? 80}%`,
                      backgroundColor: (province.loyalty ?? 80) > 60 ? Colors.status.success : (province.loyalty ?? 80) > 30 ? Colors.status.warning : Colors.status.danger
                    }]} />
                  </View>
                  <Text style={[ps.loyaltyValue, {
                    color: (province.loyalty ?? 80) > 60 ? Colors.status.success : (province.loyalty ?? 80) > 30 ? Colors.status.warning : Colors.status.danger
                  }]}>{province.loyalty ?? 80}%</Text>
                </View>
                <View style={ps.loyaltyItem}>
                  <Text style={ps.loyaltyLabel}>Unrest</Text>
                  <View style={ps.loyaltyBarBg}>
                    <View style={[ps.loyaltyBarFill, {
                      width: `${province.unrest ?? 0}%`,
                      backgroundColor: (province.unrest ?? 0) > 50 ? '#ff4444' : (province.unrest ?? 0) > 20 ? Colors.status.warning : Colors.status.success
                    }]} />
                  </View>
                  <Text style={[ps.loyaltyValue, {
                    color: (province.unrest ?? 0) > 50 ? '#ff4444' : (province.unrest ?? 0) > 20 ? Colors.status.warning : Colors.status.success
                  }]}>{province.unrest ?? 0}%</Text>
                </View>
              </View>
              {(province.unrest ?? 0) > 50 && (
                <View style={ps.unrestWarning}>
                  <Text style={ps.unrestWarningText}>⚠️ High unrest! Risk of revolt. Reinforce garrison or consecrate.</Text>
                </View>
              )}
              {(province.loyalty ?? 80) < 40 && (
                <View style={ps.loyaltyWarning}>
                  <Text style={ps.loyaltyWarningText}>⚠️ Low loyalty! Province may rebel. Use faith actions to restore order.</Text>
                </View>
              )}
            </View>
          )}

          {isOwned && !isFogged && (
            <View style={ps.lordSection}>
              <Text style={ps.sectionTitle}>Governance</Text>
              {assignedLord ? (
                <View style={ps.lordCard}>
                  <View style={ps.lordCardHeader}>
                    <Crown size={16} color={assignedLord.type === 'peasant' ? Colors.text.secondary : Colors.gold.primary} />
                    <Text style={ps.lordName}>{assignedLord.name}</Text>
                    <View style={[ps.lordBadge, assignedLord.type === 'peasant' && { backgroundColor: Colors.bg.tertiary }]}>
                      <Text style={ps.lordBadgeText}>{assignedLord.type === 'peasant' ? 'Peasant' : 'Lord'}</Text>
                    </View>
                  </View>
                  {assignedLord.provinceIds.length > 1 && (
                    <Text style={ps.lordProvinceList}>
                      Governs: {assignedLord.provinceIds.map(pid => state.provinces.find(p => p.id === pid)?.name ?? pid).join(' · ')} ({assignedLord.provinceIds.length} provinces)
                    </Text>
                  )}
                  <View style={ps.lordStatsRow}>
                    <View style={ps.lordStat}>
                      <Text style={ps.lordStatNum}>{assignedLord.skill}</Text>
                      <Text style={ps.lordStatLbl}>Skill</Text>
                    </View>
                    <View style={ps.lordStat}>
                      <Text style={[ps.lordStatNum, { color: assignedLord.loyalty > 60 ? Colors.status.success : assignedLord.loyalty > 30 ? Colors.status.warning : Colors.status.danger }]}>
                        {assignedLord.loyalty}
                      </Text>
                      <Text style={ps.lordStatLbl}>Loyalty</Text>
                    </View>
                    <View style={ps.lordStat}>
                      <Text style={ps.lordStatNum}>+{assignedLord.skill * 3}</Text>
                      <Text style={ps.lordStatLbl}>Levy/turn</Text>
                    </View>
                    <View style={ps.lordStat}>
                      <Text style={ps.lordStatNum}>{assignedLord.turnsAppointed}t</Text>
                      <Text style={ps.lordStatLbl}>Tenure</Text>
                    </View>
                  </View>
                  <View style={ps.taxAdjustRow}>
                    <Text style={ps.taxAdjustLabel}>Tax Rate</Text>
                    <TouchableOpacity
                      style={ps.taxStepBtn}
                      onPress={() => { adjustLordTax?.(assignedLord.id, -0.05); }}
                      activeOpacity={0.7}
                    >
                      <Minus size={12} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={ps.taxAdjustValue}>{Math.round(assignedLord.taxRate * 100)}%</Text>
                    <TouchableOpacity
                      style={ps.taxStepBtn}
                      onPress={() => { adjustLordTax?.(assignedLord.id, 0.05); }}
                      activeOpacity={0.7}
                    >
                      <Plus size={12} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={ps.taxAdjustHint}>
                      {assignedLord.taxRate >= 0.85 ? '⚠️ High — loyalty risk' : assignedLord.taxRate <= 0.40 ? '⬆️ Low — boost loyalty' : ''}
                    </Text>
                  </View>
                  {assignedLord.loyalty < 30 && (
                    <View style={ps.lordWarning}>
                      <Text style={ps.lordWarningText}>⚠️ Low loyalty — risk of rebellion!</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={ps.dismissBtn}
                    onPress={() => {
                      Alert.alert(
                        'Remove from Province',
                        `Remove ${assignedLord.name} from governing ${province.name}? Unrest +20.${assignedLord.provinceIds.length > 1 ? `\n\nThey still govern ${assignedLord.provinceIds.length - 1} other province(s).` : ''}`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => {
                            if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
                            dismissLord(province.id);
                          }},
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <UserX size={14} color={Colors.status.danger} />
                    <Text style={ps.dismissBtnText}>Remove from Province</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={ps.crownLandCard}>
                  <View style={ps.crownLandHeader}>
                    <Crown size={15} color={Colors.text.dim} />
                    <Text style={ps.crownLandTitle}>Crown Land</Text>
                    {crownProvinceCount > stewardshipCap && (
                      <View style={ps.overCapBadge}>
                        <Text style={ps.overCapText}>Over cap!</Text>
                      </View>
                    )}
                  </View>
                  <Text style={ps.crownLandDesc}>
                    Direct royal control. No lord's cut, but counts toward your stewardship cap ({crownProvinceCount}/{stewardshipCap} crown provinces).
                  </Text>
                  <View style={ps.assignBtnRow}>
                    <TouchableOpacity
                      style={[ps.assignBtn, { flex: 1 }, state.resources.gold < 50 && ps.assignBtnDisabled]}
                      onPress={() => {
                        if (state.resources.gold < 50) { Alert.alert('Insufficient Gold', 'Appointing a lord costs 50 gold.'); return; }
                        if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
                        assignLord(province.id, undefined, 'lord');
                      }}
                      disabled={state.resources.gold < 50}
                      activeOpacity={0.7}
                    >
                      <Crown size={13} color={state.resources.gold < 50 ? Colors.text.dim : Colors.bg.primary} />
                      <Text style={[ps.assignBtnText, state.resources.gold < 50 && ps.assignBtnTextDisabled]}>Appoint Lord (50g)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[ps.assignBtnAlt, { flex: 1 }]}
                      onPress={() => {
                        if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
                        assignLord(province.id, undefined, 'peasant');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={ps.assignBtnAltText}>👨‍🌾 Peasant Overseer (free)</Text>
                    </TouchableOpacity>
                  </View>
                  {otherLords.length > 0 && (
                    <View style={ps.extendSection}>
                      <Text style={ps.extendTitle}>Extend existing lord's domain:</Text>
                      {otherLords.map(lord => (
                        <TouchableOpacity
                          key={lord.id}
                          style={ps.extendRow}
                          onPress={() => {
                            if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
                            assignLord(province.id, lord.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={ps.extendInfo}>
                            <Text style={ps.extendName}>{lord.name}</Text>
                            <Text style={ps.extendSub}>{lord.provinceIds.length} province{lord.provinceIds.length !== 1 ? 's' : ''} · skill {lord.skill}</Text>
                          </View>
                          <Text style={ps.extendArrow}>Extend →</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {isOwned && !isFogged && province.buildings.length > 0 && (
            <>
              <Text style={ps.sectionTitle}>Buildings ({province.buildings.length}/5)</Text>
              {province.buildings.map(building => {
                const upgradeCost = Math.floor((building.cost.gold ?? 100) * (1 + building.level * 0.5));
                const canUpgrade = building.level < building.maxLevel && state.resources.gold >= upgradeCost;
                const levelPercent = (building.level / building.maxLevel) * 100;
                return (
                  <View key={building.id} style={ps.buildingCard}>
                    <View style={ps.buildingHeader}>
                      <Text style={ps.buildingIcon}>{building.icon}</Text>
                      <View style={ps.buildingInfo}>
                        <Text style={ps.buildingName}>{building.name}</Text>
                        <Text style={ps.buildingDesc}>{building.description}</Text>
                      </View>
                      <View style={ps.levelBadge}>
                        <Text style={ps.levelText}>Lv {building.level}/{building.maxLevel}</Text>
                      </View>
                    </View>
                    <View style={ps.levelBarBg}>
                      <View style={[ps.levelBarFill, { width: `${levelPercent}%` }]} />
                    </View>
                    <View style={ps.buildingProduction}>
                      {building.production.goldPerTurn ? <Text style={ps.prodText}>💰 +{building.production.goldPerTurn * building.level}/turn</Text> : null}
                      {building.production.foodPerTurn ? <Text style={ps.prodText}>🌾 +{building.production.foodPerTurn * building.level}/turn</Text> : null}
                      {building.production.militaryPerTurn ? <Text style={ps.prodText}>⚔️ +{building.production.militaryPerTurn * building.level}/turn</Text> : null}
                      {building.production.faithPerTurn ? <Text style={ps.prodText}>🙏 +{building.production.faithPerTurn * building.level}/turn</Text> : null}
                    </View>
                    {building.level < building.maxLevel ? (
                      <TouchableOpacity style={[ps.upgradeBtn, !canUpgrade && ps.upgradeBtnDisabled]} onPress={() => handleUpgrade(building.id)} disabled={!canUpgrade} activeOpacity={0.7}>
                        <ArrowUpCircle size={16} color={canUpgrade ? Colors.bg.primary : Colors.text.dim} />
                        <Text style={[ps.upgradeBtnText, !canUpgrade && ps.upgradeBtnTextDisabled]}>Upgrade to Lv {building.level + 1} ({upgradeCost}g)</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={ps.maxLevelBadge}>
                        <Text style={ps.maxLevelText}>✨ MAX LEVEL</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {!isFogged && canBuild && (unlockedBlueprints.length > 0 || lockedBlueprints.length > 0) && (
            <>
              <TouchableOpacity style={ps.buildToggle} onPress={() => setShowBuildMenu(!showBuildMenu)} activeOpacity={0.7}>
                <Hammer size={16} color={Colors.gold.bright} />
                <Text style={ps.buildToggleText}>Construct New Building</Text>
                {showBuildMenu ? <ChevronUp size={16} color={Colors.text.dim} /> : <ChevronDown size={16} color={Colors.text.dim} />}
              </TouchableOpacity>
              {showBuildMenu && (
                <View style={ps.buildMenu}>
                  {unlockedBlueprints.map(bp => {
                    const canAfford = state.resources.gold >= bp.baseCost;
                    return (
                      <TouchableOpacity
                        key={bp.id}
                        style={[ps.buildOption, !canAfford && ps.buildOptionDisabled]}
                        onPress={() => handleConstruct(bp.id)}
                        disabled={!canAfford}
                        activeOpacity={0.7}
                      >
                        <Text style={ps.buildOptionIcon}>{bp.icon}</Text>
                        <View style={ps.buildOptionInfo}>
                          <Text style={ps.buildOptionName}>{bp.name}</Text>
                          <Text style={ps.buildOptionDesc}>{bp.description}</Text>
                        </View>
                        <Text style={[ps.buildOptionCost, !canAfford && { color: Colors.crimson.bright }]}>{bp.baseCost}g</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {lockedBlueprints.length > 0 && (
                    <View style={ps.lockedSection}>
                      <Text style={ps.lockedHeader}>Locked Blueprints</Text>
                      {lockedBlueprints.map(bp => (
                        <TouchableOpacity
                          key={bp.id}
                          style={ps.lockedOption}
                          onPress={() => Alert.alert('Blueprint Locked', `Research "${getRequiredTechName(bp.id)}" to unlock ${bp.name}.`)}
                          activeOpacity={0.7}
                        >
                          <View style={ps.lockedIconWrap}>
                            <Text style={ps.lockedBpIcon}>{bp.icon}</Text>
                            <View style={ps.lockBadge}>
                              <Lock size={10} color="#6b6e7a" />
                            </View>
                          </View>
                          <View style={ps.buildOptionInfo}>
                            <Text style={ps.lockedName}>{bp.name}</Text>
                            <Text style={ps.lockedRequires}>Requires: {getRequiredTechName(bp.id)}</Text>
                          </View>
                          <Lock size={14} color="#4a4d58" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {!isFogged && armiesHere.length > 0 && (
            <>
              <Text style={ps.sectionTitle}>Armies Stationed</Text>
              {armiesHere.map(army => {
                const moraleColor = army.morale > 70 ? Colors.status.success : army.morale > 40 ? Colors.status.warning : Colors.status.danger;
                return (
                  <View key={army.id} style={ps.armyCard}>
                    <View style={ps.armyHeader}>
                      <Shield size={16} color={Colors.crimson.bright} />
                      <Text style={ps.armyName}>{army.name}</Text>
                      <View style={[ps.armyStatusBadge, { backgroundColor: (army.status === 'idle' ? Colors.status.success : Colors.status.warning) + '20' }]}>
                        <Text style={[ps.armyStatusText, { color: army.status === 'idle' ? Colors.status.success : Colors.status.warning }]}>{army.status}</Text>
                      </View>
                    </View>
                    <View style={ps.armyStatsRow}>
                      <Text style={ps.armyDetail}>🗡️ {army.troops}/{army.maxTroops}</Text>
                      <Text style={[ps.armyDetail, { color: moraleColor }]}>💪 {army.morale}%</Text>
                      <Text style={ps.armyDetail}>👤 {army.commander}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {isOwned && !isFogged && (
            <View style={ps.actionSection}>
              <Text style={ps.sectionTitle}>Actions</Text>
              <View style={ps.recruitPanel}>
                <View style={ps.recruitHeader}>
                  <Swords size={15} color={Colors.crimson.bright} />
                  <Text style={ps.recruitPanelTitle}>Raise Army from Garrison</Text>
                  <Text style={ps.garrisonAvail}>Available: {province.garrison}</Text>
                </View>
                {province.garrison < 50 ? (
                  <View style={ps.recruitDisabledMsg}>
                    <Text style={ps.recruitDisabledText}>⚠️ Garrison too low to raise an army (need 50+)</Text>
                  </View>
                ) : (
                  <>
                    <View style={ps.troopPickerRow}>
                      <TouchableOpacity
                        style={ps.troopStepBtn}
                        onPress={() => setRecruitTroops(t => Math.max(50, t - 50))}
                        disabled={recruitTroops <= 50}
                        activeOpacity={0.7}
                      >
                        <Text style={ps.troopStepBtnText}>−</Text>
                      </TouchableOpacity>
                      <View style={ps.troopCountBox}>
                        <Text style={ps.troopCount}>{recruitTroops}</Text>
                        <Text style={ps.troopCountLabel}>troops</Text>
                      </View>
                      <TouchableOpacity
                        style={ps.troopStepBtn}
                        onPress={() => setRecruitTroops(t => Math.min(province.garrison, t + 50))}
                        disabled={recruitTroops >= province.garrison}
                        activeOpacity={0.7}
                      >
                        <Text style={ps.troopStepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={ps.troopCostHint}>Equipping cost: {Math.max(1, Math.floor(recruitTroops * 0.5))}g · Garrison -{recruitTroops}</Text>
                    <TouchableOpacity
                      style={[ps.recruitBtn, state.resources.gold < Math.max(1, Math.floor(recruitTroops * 0.5)) && ps.recruitBtnDisabled]}
                      onPress={handleRecruit}
                      disabled={state.resources.gold < Math.max(1, Math.floor(recruitTroops * 0.5))}
                      activeOpacity={0.7}
                      testID="recruit-army"
                    >
                      <LinearGradient
                        colors={state.resources.gold < Math.max(1, Math.floor(recruitTroops * 0.5)) ? ['#2a1a1a', '#1a1010'] : [Colors.military.blood, '#4a1a1a']}
                        style={ps.recruitGradient}
                      >
                        <Swords size={18} color={Colors.text.primary} />
                        <Text style={ps.recruitText}>Raise {recruitTroops} Soldiers ({Math.max(1, Math.floor(recruitTroops * 0.5))}g)</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              {province.garrison < 1000 && (
                <TouchableOpacity
                  style={[ps.garrisonBtn, (state.resources.gold < 100 || state.resources.military < 100) && ps.garrisonBtnDisabled]}
                  onPress={() => {
                    const amount = 100;
                    if (state.resources.gold < amount || state.resources.military < amount) {
                      Alert.alert("Insufficient Resources", `Need ${amount} gold and ${amount} military.`);
                      return;
                    }
                    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
                    reinforceGarrison(id!, amount);
                    Alert.alert("Garrison Reinforced", `+${amount} garrison at ${province.name}`);
                  }}
                  disabled={state.resources.gold < 100 || state.resources.military < 100}
                  activeOpacity={0.7}
                  testID="reinforce-garrison"
                >
                  <Shield size={16} color={(state.resources.gold < 100 || state.resources.military < 100) ? Colors.text.dim : Colors.military.steel} />
                  <Text style={[ps.garrisonBtnText, (state.resources.gold < 100 || state.resources.military < 100) && { color: Colors.text.dim }]}>
                    Reinforce Garrison +100 (100g, 100 mil)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!isFogged && !isOwned && ownerKingdom && (
            <View style={ps.foreignInfo}>
              <Text style={ps.foreignLabel}>Controlled by</Text>
              <View style={[ps.foreignCrest, { backgroundColor: ownerKingdom.color + '20' }]}>
                <Text style={[ps.foreignCrestText, { color: ownerKingdom.color }]}>{ownerKingdom.name}</Text>
              </View>
              <Text style={ps.foreignRelation}>Relations: {ownerKingdom.relation > 0 ? '+' : ''}{ownerKingdom.relation} ({ownerKingdom.attitude})</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  errorText: { color: Colors.text.primary, fontSize: 18, textAlign: "center" as const, marginTop: 100 },
  backLink: { color: Colors.gold.primary, fontSize: 16, textAlign: "center" as const, marginTop: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  typeIcon: { fontSize: 28 },
  provinceName: { fontSize: 18, fontWeight: "700" as const, color: Colors.text.primary },
  provinceType: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg.card, alignItems: "center", justifyContent: "center" },
  siegeBanner: { marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#ff000015', borderWidth: 1, borderColor: '#ff000030', gap: 6, alignItems: "center" },
  siegeText: { fontSize: 12, fontWeight: "700" as const, color: '#ff4444', letterSpacing: 1 },
  siegeBarBg: { height: 4, width: "100%", borderRadius: 2, backgroundColor: Colors.bg.tertiary, overflow: "hidden" },
  siegeBarFill: { height: "100%", borderRadius: 2, backgroundColor: '#ff4444' },
  statsGrid: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  statItem: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 12, alignItems: "center", gap: 4, borderWidth: 1, borderColor: Colors.border.primary },
  statNum: { fontSize: 18, fontWeight: "800" as const, color: Colors.text.primary },
  statLbl: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const },
  sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.gold.dim, textTransform: "uppercase" as const, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  buildingCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  buildingHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  buildingIcon: { fontSize: 24 },
  buildingInfo: { flex: 1, gap: 2 },
  buildingName: { fontSize: 15, fontWeight: "600" as const, color: Colors.text.primary },
  buildingDesc: { fontSize: 11, color: Colors.text.secondary },
  levelBadge: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  levelText: { fontSize: 11, fontWeight: "700" as const, color: Colors.gold.primary },
  buildingProduction: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8, paddingLeft: 34 },
  prodText: { fontSize: 12, color: Colors.text.secondary },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, backgroundColor: Colors.gold.primary, paddingVertical: 8, borderRadius: 8 },
  upgradeBtnDisabled: { backgroundColor: Colors.bg.tertiary },
  upgradeBtnText: { fontSize: 13, fontWeight: "700" as const, color: Colors.bg.primary },
  upgradeBtnTextDisabled: { color: Colors.text.dim },
  buildToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.gold.dim + '40', borderStyle: "dashed" as const, backgroundColor: Colors.gold.dim + '08' },
  buildToggleText: { fontSize: 13, fontWeight: "600" as const, color: Colors.gold.bright },
  buildMenu: { marginHorizontal: 16, marginTop: 8, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: Colors.border.primary, gap: 4 },
  buildOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, backgroundColor: Colors.bg.tertiary },
  buildOptionDisabled: { opacity: 0.5 },
  buildOptionIcon: { fontSize: 22 },
  buildOptionInfo: { flex: 1, gap: 2 },
  buildOptionName: { fontSize: 13, fontWeight: "600" as const, color: Colors.text.primary },
  buildOptionDesc: { fontSize: 10, color: Colors.text.secondary },
  buildOptionCost: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.bright },
  lockedSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.border.primary, paddingTop: 8, gap: 4 },
  lockedHeader: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1.2, marginBottom: 4, paddingHorizontal: 4 },
  lockedOption: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, padding: 10, borderRadius: 8, backgroundColor: '#0d0e14', opacity: 0.6 },
  lockedIconWrap: { position: "relative" as const },
  lockedBpIcon: { fontSize: 22, opacity: 0.4 },
  lockBadge: { position: "absolute" as const, bottom: -2, right: -4, backgroundColor: '#1a1d28', borderRadius: 6, padding: 2 },
  lockedName: { fontSize: 13, fontWeight: "600" as const, color: '#4a4d58' },
  lockedRequires: { fontSize: 10, color: '#3a3d48', fontStyle: "italic" as const },
  armyCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.primary },
  armyHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  armyName: { flex: 1, fontSize: 14, fontWeight: "600" as const, color: Colors.text.primary },
  armyStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  armyStatusText: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5 },
  armyStatsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  armyDetail: { fontSize: 12, color: Colors.text.secondary },
  actionSection: { marginTop: 8 },
  recruitPanel: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary, gap: 10 },
  recruitHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  recruitPanelTitle: { flex: 1, fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  garrisonAvail: { fontSize: 11, color: Colors.military.steel },
  recruitDisabledMsg: { paddingVertical: 8 },
  recruitDisabledText: { fontSize: 12, color: Colors.status.warning, textAlign: "center" as const },
  troopPickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  troopStepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg.tertiary, borderWidth: 1, borderColor: Colors.border.primary, alignItems: "center", justifyContent: "center" },
  troopStepBtnText: { fontSize: 22, fontWeight: "700" as const, color: Colors.text.primary },
  troopCountBox: { alignItems: "center", minWidth: 70 },
  troopCount: { fontSize: 28, fontWeight: "800" as const, color: Colors.text.primary },
  troopCountLabel: { fontSize: 10, color: Colors.text.secondary, textTransform: "uppercase" as const },
  troopCostHint: { fontSize: 11, color: Colors.text.secondary, textAlign: "center" as const },
  recruitBtn: { borderRadius: 10, overflow: "hidden" },
  recruitBtnDisabled: { opacity: 0.5 },
  recruitGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  recruitText: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  foreignInfo: { marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 16, alignItems: "center", gap: 8, borderWidth: 1, borderColor: Colors.border.primary },
  foreignLabel: { fontSize: 10, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1 },
  foreignCrest: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  foreignCrestText: { fontSize: 16, fontWeight: "700" as const },
  foreignRelation: { fontSize: 12, color: Colors.text.secondary },
  garrisonBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, marginHorizontal: 16, marginTop: 10, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.military.steel + '50', backgroundColor: Colors.military.steel + '15' },
  garrisonBtnDisabled: { opacity: 0.4 },
  garrisonBtnText: { fontSize: 13, fontWeight: "600" as const, color: Colors.military.steel },
  fogBanner: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, backgroundColor: '#0a0c14', borderWidth: 1, borderColor: '#1a1d28' },
  fogBannerText: { flex: 1, gap: 4 },
  fogTitle: { fontSize: 14, fontWeight: "700" as const, color: '#4a4d58' },
  fogDesc: { fontSize: 11, color: '#3a3d48', lineHeight: 16 },
  foggedNum: { color: '#2a2d38', fontSize: 20 },
  loyaltySection: { marginHorizontal: 16, marginTop: 4, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary },
  loyaltyRow: { flexDirection: "row" as const, gap: 12 },
  loyaltyItem: { flex: 1, gap: 6 },
  loyaltyLabel: { fontSize: 10, fontWeight: "700" as const, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 1 },
  loyaltyBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.tertiary, overflow: "hidden" as const },
  loyaltyBarFill: { height: "100%" as const, borderRadius: 3 },
  loyaltyValue: { fontSize: 12, fontWeight: "700" as const },
  unrestWarning: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#ff000012', borderWidth: 1, borderColor: '#ff000025' },
  unrestWarningText: { fontSize: 11, color: '#ff4444', fontWeight: "600" as const },
  loyaltyWarning: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: Colors.status.warning + '12', borderWidth: 1, borderColor: Colors.status.warning + '25' },
  loyaltyWarningText: { fontSize: 11, color: Colors.status.warning, fontWeight: "600" as const },
  lordSection: { marginTop: 4 },
  lordCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.gold.dim + '40', gap: 10 },
  lordCardHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  lordName: { flex: 1, fontSize: 15, fontWeight: "700" as const, color: Colors.text.primary },
  lordBadge: { backgroundColor: Colors.gold.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: Colors.gold.primary + '40' },
  lordBadgeText: { fontSize: 10, fontWeight: "700" as const, color: Colors.gold.bright, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  lordStatsRow: { flexDirection: "row" as const, gap: 8 },
  lordStat: { flex: 1, backgroundColor: Colors.bg.tertiary, borderRadius: 8, padding: 8, alignItems: "center" as const, gap: 2 },
  lordStatNum: { fontSize: 16, fontWeight: "800" as const, color: Colors.text.primary },
  lordStatLbl: { fontSize: 9, color: Colors.text.dim, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  lordWarning: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#ff000012', borderWidth: 1, borderColor: '#ff000025' },
  lordWarningText: { fontSize: 11, color: Colors.status.danger, fontWeight: "600" as const },
  dismissBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: Colors.status.danger + '40', backgroundColor: Colors.status.danger + '10' },
  dismissBtnText: { fontSize: 13, fontWeight: "600" as const, color: Colors.status.danger },
  crownLandCard: { marginHorizontal: 16, backgroundColor: Colors.bg.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.primary, gap: 10 },
  crownLandHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  crownLandTitle: { flex: 1, fontSize: 14, fontWeight: "700" as const, color: Colors.text.secondary },
  overCapBadge: { backgroundColor: Colors.status.danger + '20', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: Colors.status.danger + '40' },
  overCapText: { fontSize: 10, fontWeight: "700" as const, color: Colors.status.danger },
  crownLandDesc: { fontSize: 11, color: Colors.text.dim, lineHeight: 16 },
  assignBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.gold.primary },
  assignBtnDisabled: { backgroundColor: Colors.bg.tertiary },
  assignBtnText: { fontSize: 12, fontWeight: "700" as const, color: Colors.bg.primary },
  assignBtnTextDisabled: { color: Colors.text.dim },
  assignBtnRow: { flexDirection: "row" as const, gap: 8 },
  assignBtnAlt: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.bg.tertiary, borderWidth: 1, borderColor: Colors.border.primary },
  assignBtnAltText: { fontSize: 12, fontWeight: "600" as const, color: Colors.text.secondary },
  extendSection: { borderTopWidth: 1, borderTopColor: Colors.border.primary, paddingTop: 8, gap: 6 },
  extendTitle: { fontSize: 11, color: Colors.text.dim, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  extendRow: { flexDirection: "row" as const, alignItems: "center" as const, backgroundColor: Colors.bg.tertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  extendInfo: { flex: 1 },
  extendName: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  extendSub: { fontSize: 10, color: Colors.text.dim, marginTop: 1 },
  extendArrow: { fontSize: 12, color: Colors.gold.primary, fontWeight: "700" as const },
  lordProvinceList: { fontSize: 11, color: Colors.text.dim, fontStyle: "italic" as const },
  taxAdjustRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingVertical: 4 },
  taxAdjustLabel: { fontSize: 12, color: Colors.text.secondary, fontWeight: "600" as const, width: 68 },
  taxStepBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: Colors.bg.tertiary, alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 1, borderColor: Colors.border.primary },
  taxAdjustValue: { fontSize: 15, fontWeight: "800" as const, color: Colors.text.primary, width: 40, textAlign: "center" as const },
  taxAdjustHint: { flex: 1, fontSize: 10, color: Colors.status.warning },
  levelBarBg: { height: 3, borderRadius: 2, backgroundColor: Colors.bg.tertiary, marginTop: 8, marginLeft: 34, overflow: "hidden" as const },
  levelBarFill: { height: "100%" as const, borderRadius: 2, backgroundColor: Colors.gold.primary },
  maxLevelBadge: { marginTop: 10, alignItems: "center" as const, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.gold.primary + '15', borderWidth: 1, borderColor: Colors.gold.primary + '30' },
  maxLevelText: { fontSize: 12, fontWeight: "700" as const, color: Colors.gold.bright, letterSpacing: 1 },
});
