import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X,
  Crown,
  Shield,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  UserX,
  UserPlus,
  AlertTriangle,
  ChevronRight,
  Map,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";
import { Lord, Province } from "@/types/game";

function LoyaltyBar({ value }: { value: number }) {
  const color =
    value >= 60
      ? Colors.status.success
      : value >= 30
      ? Colors.status.warning
      : Colors.status.danger;
  return (
    <View style={dm.loyaltyBg}>
      <View
        style={[
          dm.loyaltyFill,
          { width: `${value}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function LordCard({
  lord,
  provinces,
  allPlayerProvinces,
  onDismissProvince,
  onGrantProvince,
  onAdjustTax,
}: {
  lord: Lord;
  provinces: Province[];
  allPlayerProvinces: Province[];
  onDismissProvince: (pid: string, lordName: string) => void;
  onGrantProvince: (lordId: string) => void;
  onAdjustTax: (lordId: string, delta: number) => void;
}) {
  const loyaltyColor =
    lord.loyalty >= 60
      ? Colors.status.success
      : lord.loyalty >= 30
      ? Colors.status.warning
      : Colors.status.danger;
  const taxPct = Math.round(lord.taxRate * 100);
  const levy = lord.skill * 3 * provinces.length;
  const isPeasant = lord.type === "peasant";
  const isLowLoyalty = lord.loyalty < 30;
  const typeColor = isPeasant ? Colors.text.secondary : Colors.gold.bright;

  const unassignedProvinces = allPlayerProvinces.filter(
    (p) => !lord.provinceIds.includes(p.id)
  );

  return (
    <View style={[dm.lordCard, isLowLoyalty && dm.lordCardDanger]}>
      <View style={dm.lordCardHeader}>
        <View style={[dm.lordAvatar, { backgroundColor: typeColor + "20" }]}>
          <Text style={dm.lordAvatarText}>{isPeasant ? "🧑‍🌾" : "🏰"}</Text>
        </View>
        <View style={dm.lordInfo}>
          <View style={dm.lordNameRow}>
            <Text style={dm.lordName}>{lord.name}</Text>
            <View
              style={[
                dm.lordTypeBadge,
                { backgroundColor: typeColor + "20", borderColor: typeColor + "40" },
              ]}
            >
              <Text style={[dm.lordTypeBadgeText, { color: typeColor }]}>
                {isPeasant ? "Peasant" : "Lord"}
              </Text>
            </View>
          </View>
          <Text style={dm.lordMeta}>
            Skill {lord.skill} · {lord.turnsAppointed} turns serving
          </Text>
        </View>
        <View style={dm.lordSkillBox}>
          <Text style={dm.lordSkillValue}>{lord.skill}</Text>
          <Text style={dm.lordSkillLabel}>SKL</Text>
        </View>
      </View>

      <View style={dm.loyaltyRow}>
        <Text style={[dm.loyaltyLabel, { color: loyaltyColor }]}>
          Loyalty {lord.loyalty}%
        </Text>
        <LoyaltyBar value={lord.loyalty} />
      </View>

      {isLowLoyalty && (
        <View style={dm.rebellionWarn}>
          <AlertTriangle size={12} color={Colors.status.danger} />
          <Text style={dm.rebellionWarnText}>
            Rebellion risk! Raise loyalty or dismiss.
          </Text>
        </View>
      )}

      <View style={dm.statsRow}>
        <View style={dm.statBox}>
          <Text style={dm.statBoxValue}>+{levy}</Text>
          <Text style={dm.statBoxLabel}>Garrison levy/turn</Text>
        </View>
        <View style={dm.statBox}>
          <Text style={dm.statBoxValue}>{provinces.length}</Text>
          <Text style={dm.statBoxLabel}>Provinces</Text>
        </View>
        <View style={dm.statBox}>
          <Text style={[dm.statBoxValue, { color: taxPct >= 85 ? Colors.status.warning : Colors.status.success }]}>
            {taxPct}%
          </Text>
          <Text style={dm.statBoxLabel}>Tax rate</Text>
        </View>
      </View>

      <View style={dm.taxRow}>
        <Text style={dm.taxLabel}>Crown Tax Rate</Text>
        <TouchableOpacity
          style={dm.taxBtn}
          onPress={() => onAdjustTax(lord.id, -0.05)}
          activeOpacity={0.7}
        >
          <Minus size={12} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={dm.taxValue}>{taxPct}%</Text>
        <TouchableOpacity
          style={dm.taxBtn}
          onPress={() => onAdjustTax(lord.id, 0.05)}
          activeOpacity={0.7}
        >
          <Plus size={12} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={dm.taxHint}>
          {taxPct >= 85
            ? "⚠️ loyalty risk"
            : taxPct <= 40
            ? "📈 boosts loyalty"
            : "✓ stable"}
        </Text>
      </View>

      <View style={dm.provincesSection}>
        <Text style={dm.provincesSectionLabel}>GOVERNED PROVINCES</Text>
        {provinces.map((p) => (
          <View key={p.id} style={dm.provinceRow}>
            <View style={dm.provinceRowLeft}>
              <Text style={dm.provinceIcon}>
                {p.type === "capital"
                  ? "👑"
                  : p.type === "city"
                  ? "🏙️"
                  : p.type === "castle"
                  ? "🏰"
                  : p.type === "temple"
                  ? "⛪"
                  : p.type === "farmland"
                  ? "🌾"
                  : "🌲"}
              </Text>
              <View>
                <Text style={dm.provinceName}>{p.name}</Text>
                <Text style={dm.provinceType}>{p.type}</Text>
              </View>
            </View>
            <View style={dm.provinceLoyaltyRow}>
              <Text
                style={[
                  dm.provinceLoyaltyText,
                  {
                    color:
                      (p.loyalty ?? 80) >= 60
                        ? Colors.status.success
                        : (p.loyalty ?? 80) >= 30
                        ? Colors.status.warning
                        : Colors.status.danger,
                  },
                ]}
              >
                ❤️ {p.loyalty ?? 80}
              </Text>
              <TouchableOpacity
                style={dm.revokeBtn}
                onPress={() => onDismissProvince(p.id, lord.name)}
                activeOpacity={0.7}
              >
                <UserX size={13} color={Colors.status.danger} />
                <Text style={dm.revokeBtnText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {unassignedProvinces.length > 0 && (
        <TouchableOpacity
          style={dm.grantBtn}
          onPress={() => onGrantProvince(lord.id)}
          activeOpacity={0.7}
        >
          <Plus size={14} color={Colors.status.success} />
          <Text style={dm.grantBtnText}>Grant Province to this Lord</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DomainsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    state,
    playerProvinces,
    assignLord,
    dismissLord,
    adjustLordTax,
  } = useGame();

  const lords = state.lords ?? [];

  const stewardshipCap = Math.floor((state.ruler.stewardship ?? 8) / 2) + 3;
  const crownProvinces = playerProvinces.filter(
    (p) => !lords.some((l) => (l.provinceIds ?? []).includes(p.id))
  );
  const isOverstretched = crownProvinces.length > stewardshipCap;

  const unassignedPlayerProvinces = playerProvinces.filter(
    (p) =>
      p.type !== "capital" &&
      !lords.some((l) => (l.provinceIds ?? []).includes(p.id))
  );

  const handleDismissProvince = useCallback(
    (provinceId: string, lordName: string) => {
      Alert.alert(
        "Revoke Province",
        `Remove ${lordName} from this province?\nUnrest +20 in the province.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Revoke",
            style: "destructive",
            onPress: () => {
              if (Platform.OS !== "web") {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              dismissLord?.(provinceId);
            },
          },
        ]
      );
    },
    [dismissLord]
  );

  const handleGrantProvince = useCallback(
    (lordId: string) => {
      const availableProvinces = playerProvinces.filter(
        (p) =>
          p.type !== "capital" &&
          !lords.some((l) => (l.provinceIds ?? []).includes(p.id))
      );
      if (availableProvinces.length === 0) {
        Alert.alert(
          "No Free Provinces",
          "All provinces are either the capital or already assigned to a lord."
        );
        return;
      }
      Alert.alert(
        "Grant Province",
        "Select a province to add to this lord's domain:",
        [
          ...availableProvinces.slice(0, 6).map((p) => ({
            text: `${p.name} (${p.type})`,
            onPress: () => {
              if (Platform.OS !== "web") {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              assignLord?.(p.id, lordId);
            },
          })),
          { text: "Cancel", style: "cancel" as const, onPress: () => {} },
        ]
      );
    },
    [playerProvinces, lords, assignLord]
  );

  const handleAppoint = useCallback(
    (provinceId: string) => {
      const existingLords = lords.filter((l) => l.provinceIds.length > 0);
      const options: any[] = [
        {
          text: "Appoint new Lord (50g)",
          onPress: () => {
            if (state.resources.gold < 50) {
              Alert.alert("Not enough gold", "Appointing a lord costs 50g.");
              return;
            }
            assignLord?.(provinceId, undefined, "lord");
          },
        },
        {
          text: "Appoint Peasant Overseer (free)",
          onPress: () => assignLord?.(provinceId, undefined, "peasant"),
        },
      ];
      if (existingLords.length > 0) {
        existingLords.slice(0, 4).forEach((l) => {
          options.push({
            text: `Extend to ${l.name}`,
            onPress: () => assignLord?.(provinceId, l.id),
          });
        });
      }
      options.push({ text: "Cancel", style: "cancel" as const, onPress: () => {} });
      Alert.alert("Appoint Governor", "How do you wish to govern this province?", options);
    },
    [lords, state.resources.gold, assignLord]
  );

  return (
    <View style={[dm.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.bg.primary, "#141820", Colors.bg.primary]}
        style={StyleSheet.absoluteFill}
      />
      <View style={dm.header}>
        <View style={dm.headerLeft}>
          <Map size={22} color={Colors.gold.bright} />
          <Text style={dm.title}>Domains & Lords</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={dm.closeBtn}
          testID="close-domains"
        >
          <X size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={dm.overstretchBar}>
        <View style={dm.overstretchLeft}>
          <Crown size={14} color={isOverstretched ? Colors.status.danger : Colors.gold.dim} />
          <Text
            style={[
              dm.overstretchText,
              isOverstretched && { color: Colors.status.danger },
            ]}
          >
            Crown Provinces: {crownProvinces.length} / {stewardshipCap} cap
          </Text>
          {isOverstretched && (
            <View style={dm.overstretchBadge}>
              <Text style={dm.overstretchBadgeText}>OVERSTRETCHED</Text>
            </View>
          )}
        </View>
        <Text style={dm.overstretchSub}>
          {lords.length} lord{lords.length !== 1 ? "s" : ""} · {playerProvinces.length} total provinces
        </Text>
      </View>

      {isOverstretched && (
        <View style={dm.overstretchWarning}>
          <AlertTriangle size={14} color={Colors.status.danger} />
          <Text style={dm.overstretchWarnText}>
            Too many direct provinces! Assign lords to reduce corruption &
            maintenance costs.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {lords.length === 0 && unassignedPlayerProvinces.length === 0 && (
          <View style={dm.emptyState}>
            <Text style={dm.emptyIcon}>🏰</Text>
            <Text style={dm.emptyTitle}>No Lords Appointed</Text>
            <Text style={dm.emptyDesc}>
              Conquer more provinces, then appoint lords to govern them and
              reduce overstretch.
            </Text>
          </View>
        )}

        {lords.map((lord) => {
          const lordProvinces = (lord.provinceIds ?? [])
            .map((pid) => state.provinces.find((p) => p.id === pid))
            .filter(Boolean) as Province[];
          return (
            <LordCard
              key={lord.id}
              lord={lord}
              provinces={lordProvinces}
              allPlayerProvinces={playerProvinces}
              onDismissProvince={handleDismissProvince}
              onGrantProvince={handleGrantProvince}
              onAdjustTax={(id, delta) => adjustLordTax?.(id, delta)}
            />
          );
        })}

        {unassignedPlayerProvinces.length > 0 && (
          <View style={dm.unassignedSection}>
            <Text style={dm.unassignedTitle}>Unassigned Provinces</Text>
            <Text style={dm.unassignedSub}>
              These provinces are under direct crown control. Appoint lords to
              reduce overstretch.
            </Text>
            {unassignedPlayerProvinces.map((p) => (
              <View key={p.id} style={dm.unassignedRow}>
                <View style={dm.unassignedLeft}>
                  <Text style={dm.unassignedIcon}>
                    {p.type === "city"
                      ? "🏙️"
                      : p.type === "castle"
                      ? "🏰"
                      : p.type === "temple"
                      ? "⛪"
                      : p.type === "farmland"
                      ? "🌾"
                      : "🌲"}
                  </Text>
                  <View>
                    <Text style={dm.unassignedName}>{p.name}</Text>
                    <View style={dm.unassignedMeta}>
                      <Text style={dm.unassignedType}>{p.type}</Text>
                      <Text
                        style={[
                          dm.unassignedLoyalty,
                          {
                            color:
                              (p.loyalty ?? 80) >= 60
                                ? Colors.status.success
                                : (p.loyalty ?? 80) >= 30
                                ? Colors.status.warning
                                : Colors.status.danger,
                          },
                        ]}
                      >
                        ❤️ {p.loyalty ?? 80}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={dm.appointBtn}
                  onPress={() => handleAppoint(p.id)}
                  activeOpacity={0.7}
                >
                  <UserPlus size={13} color={Colors.gold.bright} />
                  <Text style={dm.appointBtnText}>Appoint</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const dm = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
  },
  overstretchBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  overstretchLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  overstretchText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.gold.dim,
  },
  overstretchBadge: {
    backgroundColor: Colors.status.danger + "20",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.status.danger + "50",
  },
  overstretchBadgeText: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: Colors.status.danger,
    letterSpacing: 0.5,
  },
  overstretchSub: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: "600" as const,
  },
  overstretchWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.status.danger + "15",
    borderWidth: 1,
    borderColor: Colors.status.danger + "35",
  },
  overstretchWarnText: {
    fontSize: 12,
    color: Colors.status.danger,
    fontWeight: "600" as const,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.gold.bright,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
  lordCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  lordCardDanger: {
    borderColor: Colors.status.danger + "60",
    backgroundColor: Colors.status.danger + "08",
  },
  lordCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  lordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lordAvatarText: { fontSize: 22 },
  lordInfo: { flex: 1 },
  lordNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lordName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  lordTypeBadge: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
  },
  lordTypeBadgeText: { fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.5 },
  lordMeta: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },
  lordSkillBox: {
    alignItems: "center",
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  lordSkillValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.gold.bright,
  },
  lordSkillLabel: {
    fontSize: 9,
    color: Colors.text.dim,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  loyaltyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  loyaltyLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    minWidth: 80,
  },
  loyaltyBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bg.tertiary,
    overflow: "hidden",
  },
  loyaltyFill: { height: "100%", borderRadius: 2 },
  rebellionWarn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: Colors.status.danger + "18",
    borderWidth: 1,
    borderColor: Colors.status.danger + "40",
    marginBottom: 8,
  },
  rebellionWarnText: {
    fontSize: 11,
    color: Colors.status.danger,
    fontWeight: "600" as const,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statBoxValue: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.text.primary,
  },
  statBoxLabel: { fontSize: 9, color: Colors.text.dim, marginTop: 2 },
  taxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginBottom: 10,
  },
  taxLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: "600" as const,
    flex: 0,
  },
  taxBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.bg.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  taxValue: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.text.primary,
    minWidth: 36,
    textAlign: "center" as const,
  },
  taxHint: { fontSize: 10, color: Colors.text.secondary, flex: 1 },
  provincesSection: { marginBottom: 8 },
  provincesSectionLabel: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.text.dim,
    letterSpacing: 1,
    marginBottom: 6,
  },
  provinceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  provinceRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  provinceIcon: { fontSize: 16 },
  provinceName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  provinceType: { fontSize: 10, color: Colors.text.secondary },
  provinceLoyaltyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  provinceLoyaltyText: { fontSize: 11, fontWeight: "600" as const },
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.status.danger + "15",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.status.danger + "40",
  },
  revokeBtnText: {
    fontSize: 11,
    color: Colors.status.danger,
    fontWeight: "700" as const,
  },
  grantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.status.success + "50",
    backgroundColor: Colors.status.success + "10",
  },
  grantBtnText: {
    fontSize: 12,
    color: Colors.status.success,
    fontWeight: "700" as const,
  },
  unassignedSection: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gold.dim + "30",
  },
  unassignedTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.gold.dim,
    marginBottom: 4,
  },
  unassignedSub: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  unassignedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  unassignedLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  unassignedIcon: { fontSize: 18 },
  unassignedName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  unassignedMeta: { flexDirection: "row", gap: 8, marginTop: 2 },
  unassignedType: { fontSize: 10, color: Colors.text.secondary },
  unassignedLoyalty: { fontSize: 10, fontWeight: "600" as const },
  appointBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.gold.dim + "20",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold.dim + "50",
  },
  appointBtnText: {
    fontSize: 11,
    color: Colors.gold.bright,
    fontWeight: "700" as const,
  },
});
