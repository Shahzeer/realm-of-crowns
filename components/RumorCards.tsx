import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Alert, ScrollView } from 'react-native';
import { Search, X, Eye, ShieldAlert, Coins, Crown, Handshake, Swords } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Rumor, RumorCategory } from '@/types/game';

const CATEGORY_CONFIG: Record<RumorCategory, { icon: React.ComponentType<{ size: number; color: string }>; color: string; label: string }> = {
  war: { icon: Swords, color: '#c41e3a', label: 'Military' },
  economy: { icon: Coins, color: '#e8b94a', label: 'Economy' },
  politics: { icon: Crown, color: '#8b5cf6', label: 'Politics' },
  espionage: { icon: Eye, color: '#58a6ff', label: 'Espionage' },
  diplomacy: { icon: Handshake, color: '#3fb950', label: 'Diplomacy' },
};

interface RumorCardProps {
  rumor: Rumor;
  index: number;
  onInvestigate: (id: string) => void;
  onDismiss: (id: string) => void;
  onSendSpy: () => void;
}

const RumorCard = React.memo(function RumorCard({ rumor, index, onInvestigate, onDismiss, onSendSpy }: RumorCardProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 120, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const config = CATEGORY_CONFIG[rumor.category];
  const IconComponent = config.icon;
  const accuracyColor = rumor.accuracy >= 70 ? Colors.status.success : rumor.accuracy >= 40 ? Colors.status.warning : Colors.crimson.bright;

  const handleInvestigate = useCallback(() => {
    if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    if (rumor.investigated) {
      Alert.alert('Already Investigated', 'Your agents have already looked into this rumor.');
      return;
    }
    Alert.alert(
      'Investigate Rumor',
      `Spend 50 gold to investigate this rumor about ${rumor.kingdomName}?\n\nThis will improve the reliability of the intelligence.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Investigate (50g)', onPress: () => onInvestigate(rumor.id) },
      ]
    );
  }, [rumor, onInvestigate]);

  const handleTapCard = useCallback(() => {
    if (Platform.OS !== 'web') { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    Alert.alert(
      `Rumor: ${config.label}`,
      `${rumor.description}\n\nKingdom: ${rumor.kingdomName}\nReliability: ${rumor.accuracy}%\n${rumor.fromSpy ? '🕵️ Intelligence source' : '👂 Hearsay'}${rumor.investigated ? '\n✅ Investigated' : ''}`,
      [
        { text: 'Dismiss', style: 'cancel' },
        ...(!rumor.investigated ? [{ text: 'Investigate (50g)', onPress: () => onInvestigate(rumor.id) }] : []),
        { text: 'Send Spies', onPress: onSendSpy },
      ]
    );
  }, [rumor, config, onInvestigate, onSendSpy]);

  return (
    <Animated.View style={[s.cardOuter, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        style={s.card}
        onPress={handleTapCard}
        activeOpacity={0.8}
        testID={`rumor-card-${rumor.id}`}
      >
        <View style={s.parchmentEdgeTop} />
        <View style={s.cardContent}>
          <View style={s.cardTopRow}>
            <View style={[s.categoryBadge, { backgroundColor: config.color + '18' }]}>
              <IconComponent size={12} color={config.color} />
              <Text style={[s.categoryText, { color: config.color }]}>{config.label}</Text>
            </View>
            {rumor.fromSpy && (
              <View style={s.spyBadge}>
                <Eye size={10} color="#8b5cf6" />
                <Text style={s.spyBadgeText}>Intel</Text>
              </View>
            )}
            {rumor.investigated && (
              <View style={s.investigatedBadge}>
                <Search size={10} color={Colors.status.success} />
              </View>
            )}
            <TouchableOpacity
              style={s.dismissBtn}
              onPress={() => onDismiss(rumor.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={12} color={Colors.text.dim} />
            </TouchableOpacity>
          </View>

          <Text style={s.rumorText} numberOfLines={3}>{rumor.description}</Text>

          <View style={s.cardFooter}>
            <View style={s.kingdomTag}>
              <View style={[s.kingdomDot, { backgroundColor: config.color }]} />
              <Text style={s.kingdomName}>{rumor.kingdomName}</Text>
            </View>
            <View style={s.accuracyContainer}>
              <Text style={s.accuracyLabel}>Reliability</Text>
              <View style={s.accuracyBarBg}>
                <View style={[s.accuracyBarFill, { width: `${rumor.accuracy}%`, backgroundColor: accuracyColor }]} />
              </View>
              <Text style={[s.accuracyValue, { color: accuracyColor }]}>{rumor.accuracy}%</Text>
            </View>
          </View>

          {!rumor.investigated && (
            <TouchableOpacity style={s.investigateBtn} onPress={handleInvestigate} activeOpacity={0.7}>
              <Search size={12} color={Colors.gold.bright} />
              <Text style={s.investigateBtnText}>Investigate · 50g</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={s.parchmentEdgeBottom} />
      </TouchableOpacity>
    </Animated.View>
  );
});

interface RumorCardsProps {
  rumors: Rumor[];
  onInvestigate: (id: string) => void;
  onDismiss: (id: string) => void;
  onSendSpy: () => void;
}

export default React.memo(function RumorCards({ rumors, onInvestigate, onDismiss, onSendSpy }: RumorCardsProps) {
  const currentRumors = rumors.slice(0, 3);

  if (currentRumors.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <ShieldAlert size={14} color={Colors.gold.dim} />
          <Text style={s.sectionTitle}>Rumors & Intelligence</Text>
        </View>
        <Text style={s.rumorCount}>{currentRumors.length} report{currentRumors.length !== 1 ? 's' : ''}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        decelerationRate="fast"
        snapToInterval={264}
        snapToAlignment="start"
      >
        {currentRumors.map((rumor, index) => (
          <RumorCard
            key={rumor.id}
            rumor={rumor}
            index={index}
            onInvestigate={onInvestigate}
            onDismiss={onDismiss}
            onSendSpy={onSendSpy}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gold.dim,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  rumorCount: {
    fontSize: 11,
    color: Colors.text.dim,
    fontWeight: '600' as const,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardOuter: {
    width: 252,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1c1a14',
    borderWidth: 1,
    borderColor: Colors.gold.dim + '40',
  },
  parchmentEdgeTop: {
    height: 3,
    backgroundColor: Colors.gold.dim + '25',
  },
  parchmentEdgeBottom: {
    height: 3,
    backgroundColor: Colors.gold.dim + '15',
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  spyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#8b5cf612',
  },
  spyBadgeText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#8b5cf6',
  },
  investigatedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.status.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtn: {
    marginLeft: 'auto',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rumorText: {
    fontSize: 12,
    color: Colors.parchment.primary,
    lineHeight: 17,
    fontStyle: 'italic' as const,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  kingdomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  kingdomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kingdomName: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accuracyLabel: {
    fontSize: 8,
    color: Colors.text.dim,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  accuracyBarBg: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bg.tertiary,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  accuracyValue: {
    fontSize: 10,
    fontWeight: '700' as const,
    minWidth: 28,
    textAlign: 'right' as const,
  },
  investigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold.dim + '40',
    backgroundColor: Colors.gold.dim + '10',
  },
  investigateBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.gold.bright,
  },
});
