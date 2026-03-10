import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Resources } from '@/types/game';

interface ResourceBarProps {
  resources: Resources;
}

function ResourceItem({ icon, value, perTurn, color, onPress }: { icon: string; value: number; perTurn: number; color: string; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      prevValue.current = value;
    }
  }, [value]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.item, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.value, { color }]}>{Math.floor(value)}</Text>
        <Text style={[styles.perTurn, { color: perTurn >= 0 ? Colors.text.secondary : Colors.crimson.bright }]}>
          {perTurn >= 0 ? '+' : ''}{perTurn}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default React.memo(function ResourceBar({ resources }: ResourceBarProps) {
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  const breakdownData: Record<string, { icon: string; name: string; total: number; perTurn: number; color: string }> = {
    gold: { icon: '💰', name: 'Gold', total: resources.gold, perTurn: resources.goldPerTurn, color: Colors.gold.bright },
    food: { icon: '🌾', name: 'Food', total: resources.food, perTurn: resources.foodPerTurn, color: Colors.food.light },
    military: { icon: '⚔️', name: 'Military', total: resources.military, perTurn: resources.militaryPerTurn, color: Colors.military.steel },
    faith: { icon: '🙏', name: 'Faith', total: resources.faith, perTurn: resources.faithPerTurn, color: Colors.faith.light },
  };

  return (
    <View style={styles.container}>
      <ResourceItem icon="💰" value={resources.gold} perTurn={resources.goldPerTurn} color={Colors.gold.bright} onPress={() => setShowBreakdown('gold')} />
      <ResourceItem icon="🌾" value={resources.food} perTurn={resources.foodPerTurn} color={Colors.food.light} onPress={() => setShowBreakdown('food')} />
      <ResourceItem icon="⚔️" value={resources.military} perTurn={resources.militaryPerTurn} color={Colors.military.steel} onPress={() => setShowBreakdown('military')} />
      <ResourceItem icon="🙏" value={resources.faith} perTurn={resources.faithPerTurn} color={Colors.faith.light} onPress={() => setShowBreakdown('faith')} />

      <Modal visible={showBreakdown !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowBreakdown(null)} activeOpacity={1}>
          <View style={styles.breakdownCard}>
            {showBreakdown && breakdownData[showBreakdown] && (
              <>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownIcon}>{breakdownData[showBreakdown].icon}</Text>
                  <Text style={[styles.breakdownTitle, { color: breakdownData[showBreakdown].color }]}>{breakdownData[showBreakdown].name}</Text>
                  <TouchableOpacity onPress={() => setShowBreakdown(null)} style={styles.breakdownClose}>
                    <X size={16} color={Colors.text.dim} />
                  </TouchableOpacity>
                </View>
                <View style={styles.breakdownTotal}>
                  <Text style={styles.breakdownTotalLabel}>Current Reserve</Text>
                  <Text style={[styles.breakdownTotalValue, { color: breakdownData[showBreakdown].color }]}>{Math.floor(breakdownData[showBreakdown].total)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownRowLabel}>Income per turn</Text>
                  <Text style={[styles.breakdownRowValue, { color: breakdownData[showBreakdown].perTurn >= 0 ? Colors.status.success : Colors.crimson.bright }]}>
                    {breakdownData[showBreakdown].perTurn >= 0 ? '+' : ''}{breakdownData[showBreakdown].perTurn}
                  </Text>
                </View>
                <View style={styles.breakdownHint}>
                  <Text style={styles.breakdownHintText}>Income comes from buildings, trade deals, council bonuses, technology, and seasonal effects. Upgrade buildings and research tech to increase income.</Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  perTurn: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  breakdownCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  breakdownIcon: {
    fontSize: 22,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    flex: 1,
  },
  breakdownClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  breakdownTotalValue: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownRowLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  breakdownRowValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  breakdownHint: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  breakdownHintText: {
    fontSize: 11,
    color: Colors.text.dim,
    lineHeight: 16,
  },
});
