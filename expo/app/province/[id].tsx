import React, { useCallback, useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, ArrowUpCircle, Shield, Users, TrendingUp, Swords, Hammer, ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { PROVINCE_TYPE_ICONS, BUILDING_BLUEPRINTS } from "@/mocks/gameData";

export default function ProvinceDetailScreen() {
  console.log("[RealmOfCrowns] Province detail render");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, upgradeBuilding, recruitArmy, constructBuilding, reinforceGarrison } = useGame();
  const province = state.provinces.find(p => p.id === id);
  const isOwned = province?.owner === 'player';
  const [showBuildMenu, setShowBuildMenu] = useState(false);
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
    if (!id) return;
    const troops = 200;
    const cost = troops * 2;
    if (state.resources.gold < cost) { Alert.alert("Insufficient Gold", `Need ${cost} gold.`); return; }
    if (state.resources.military < troops) { Alert.alert("Insufficient Military", `Need ${troops} military points.`); return; }
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    recruitArmy(id, troops);
    Alert.alert("Army Recruited", `200 soldiers levied at ${province?.name ?? 'this province'}.`);
  }, [id, state.resources, recruitArmy, province?.name]);

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
  const canBuild = isOwned && province.buildings.length < 5;
  const availableBlueprints = BUILDING_BLUEPRINTS.filter(bp => {
    if (!bp.requiredType) return true;
    return bp.requiredType.includes(province.type);
  }).filter(bp => {
    return !province.buildings.some(b => b.name === bp.name);
  });

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
          {province.underSiege && (
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
              <Users size={16} color={Colors.gold.primary} />
              <Text style={ps.statNum}>{(province.population / 1000).toFixed(1)}k</Text>
              <Text style={ps.statLbl}>Population</Text>
            </View>
            <View style={ps.statItem}>
              <TrendingUp size={16} color={Colors.food.light} />
              <Text style={ps.statNum}>{province.development}%</Text>
              <Text style={ps.statLbl}>Development</Text>
            </View>
            <View style={ps.statItem}>
              <Shield size={16} color={Colors.military.steel} />
              <Text style={ps.statNum}>{province.garrison}</Text>
              <Text style={ps.statLbl}>Garrison</Text>
            </View>
          </View>

          {isOwned && (
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

          {isOwned && province.buildings.length > 0 && (
            <>
              <Text style={ps.sectionTitle}>Buildings ({province.buildings.length}/5)</Text>
              {province.buildings.map(building => {
                const upgradeCost = (building.cost.gold ?? 100) * (building.level + 1);
                const canUpgrade = building.level < building.maxLevel && state.resources.gold >= upgradeCost;
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
                    <View style={ps.buildingProduction}>
                      {building.production.goldPerTurn ? <Text style={ps.prodText}>💰 +{building.production.goldPerTurn * building.level}/turn</Text> : null}
                      {building.production.foodPerTurn ? <Text style={ps.prodText}>🌾 +{building.production.foodPerTurn * building.level}/turn</Text> : null}
                      {building.production.militaryPerTurn ? <Text style={ps.prodText}>⚔️ +{building.production.militaryPerTurn * building.level}/turn</Text> : null}
                      {building.production.faithPerTurn ? <Text style={ps.prodText}>🙏 +{building.production.faithPerTurn * building.level}/turn</Text> : null}
                    </View>
                    {building.level < building.maxLevel && (
                      <TouchableOpacity style={[ps.upgradeBtn, !canUpgrade && ps.upgradeBtnDisabled]} onPress={() => handleUpgrade(building.id)} disabled={!canUpgrade} activeOpacity={0.7}>
                        <ArrowUpCircle size={16} color={canUpgrade ? Colors.bg.primary : Colors.text.dim} />
                        <Text style={[ps.upgradeBtnText, !canUpgrade && ps.upgradeBtnTextDisabled]}>Upgrade ({upgradeCost}g)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {canBuild && availableBlueprints.length > 0 && (
            <>
              <TouchableOpacity style={ps.buildToggle} onPress={() => setShowBuildMenu(!showBuildMenu)} activeOpacity={0.7}>
                <Hammer size={16} color={Colors.gold.bright} />
                <Text style={ps.buildToggleText}>Construct New Building</Text>
                {showBuildMenu ? <ChevronUp size={16} color={Colors.text.dim} /> : <ChevronDown size={16} color={Colors.text.dim} />}
              </TouchableOpacity>
              {showBuildMenu && (
                <View style={ps.buildMenu}>
                  {availableBlueprints.map(bp => {
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
                </View>
              )}
            </>
          )}

          {armiesHere.length > 0 && (
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

          {isOwned && (
            <View style={ps.actionSection}>
              <Text style={ps.sectionTitle}>Actions</Text>
              <TouchableOpacity style={ps.recruitBtn} onPress={handleRecruit} activeOpacity={0.7} testID="recruit-army">
                <LinearGradient colors={[Colors.military.blood, '#4a1a1a']} style={ps.recruitGradient}>
                  <Swords size={18} color={Colors.text.primary} />
                  <Text style={ps.recruitText}>Recruit Army (400g, 200 mil)</Text>
                </LinearGradient>
              </TouchableOpacity>
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

          {!isOwned && ownerKingdom && (
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
  armyCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bg.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.primary },
  armyHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  armyName: { flex: 1, fontSize: 14, fontWeight: "600" as const, color: Colors.text.primary },
  armyStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  armyStatusText: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.5 },
  armyStatsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  armyDetail: { fontSize: 12, color: Colors.text.secondary },
  actionSection: { marginTop: 8 },
  recruitBtn: { marginHorizontal: 16, borderRadius: 10, overflow: "hidden" },
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
});
