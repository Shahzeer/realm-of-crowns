import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Hammer, Users, Shield, Eye, Swords, Globe, ArrowRightLeft, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Province, Army, Kingdom } from '@/types/game';
import { PROVINCE_TYPE_ICONS } from '@/mocks/gameData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ProvinceAction =
  | 'build'
  | 'recruit'
  | 'reinforce'
  | 'details'
  | 'attack'
  | 'spy'
  | 'diplomacy'
  | 'trade'
  | 'info';

interface ProvinceActionPopupProps {
  province: Province | null;
  armies: Army[];
  kingdoms: Kingdom[];
  onAction: (action: ProvinceAction, province: Province) => void;
  onClose: () => void;
}

interface ActionButtonConfig {
  id: ProvinceAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function getOwnershipType(province: Province, kingdoms: Kingdom[]): 'player' | 'enemy' | 'neutral' {
  if (province.owner === 'player') return 'player';
  const kingdom = kingdoms.find(k => k.id === province.owner);
  if (!kingdom) return 'neutral';
  if (kingdom.attitude === 'war' || kingdom.attitude === 'hostile') return 'enemy';
  return 'neutral';
}

function getActionsForProvince(
  province: Province,
  kingdoms: Kingdom[],
  armiesHere: Army[]
): ActionButtonConfig[] {
  const ownership = getOwnershipType(province, kingdoms);

  if (ownership === 'player') {
    const actions: ActionButtonConfig[] = [
      {
        id: 'build',
        label: 'Build',
        icon: <Hammer size={18} color={Colors.gold.bright} />,
        color: Colors.gold.bright,
        bgColor: Colors.gold.dim + '25',
      },
      {
        id: 'recruit',
        label: 'Recruit',
        icon: <Users size={18} color={Colors.military.steel} />,
        color: Colors.military.steel,
        bgColor: Colors.military.steel + '20',
      },
    ];

    if (armiesHere.length > 0) {
      actions.push({
        id: 'reinforce',
        label: 'Reinforce',
        icon: <Shield size={18} color={Colors.status.info} />,
        color: Colors.status.info,
        bgColor: Colors.status.info + '20',
      });
    }

    actions.push({
      id: 'details',
      label: 'Details',
      icon: <Info size={18} color={Colors.text.secondary} />,
      color: Colors.text.secondary,
      bgColor: Colors.bg.tertiary,
    });

    return actions;
  }

  if (ownership === 'enemy') {
    return [
      {
        id: 'attack',
        label: 'Attack',
        icon: <Swords size={18} color={Colors.crimson.bright} />,
        color: Colors.crimson.bright,
        bgColor: Colors.crimson.dark + '30',
      },
      {
        id: 'spy',
        label: 'Spy',
        icon: <Eye size={18} color="#8b5cf6" />,
        color: '#8b5cf6',
        bgColor: '#8b5cf620',
      },
      {
        id: 'info',
        label: 'View Info',
        icon: <Info size={18} color={Colors.text.secondary} />,
        color: Colors.text.secondary,
        bgColor: Colors.bg.tertiary,
      },
    ];
  }

  return [
    {
      id: 'diplomacy',
      label: 'Diplomacy',
      icon: <Globe size={18} color={Colors.gold.primary} />,
      color: Colors.gold.primary,
      bgColor: Colors.gold.dim + '20',
    },
    {
      id: 'trade',
      label: 'Trade',
      icon: <ArrowRightLeft size={18} color={Colors.gold.bright} />,
      color: Colors.gold.bright,
      bgColor: Colors.gold.bright + '15',
    },
    {
      id: 'spy',
      label: 'Spy',
      icon: <Eye size={18} color="#8b5cf6" />,
      color: '#8b5cf6',
      bgColor: '#8b5cf620',
    },
  ];
}

export default React.memo(function ProvinceActionPopup({
  province,
  armies,
  kingdoms,
  onAction,
  onClose,
}: ProvinceActionPopupProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (province) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [province, fadeAnim, scaleAnim, slideAnim]);

  const handleAction = useCallback((action: ProvinceAction) => {
    if (!province) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAction(action, province);
  }, [province, onAction]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      onClose();
    });
  }, [onClose, fadeAnim]);

  if (!province) return null;

  const armiesHere = armies.filter(a => a.location === province.id && a.owner === 'player');
  const allArmiesHere = armies.filter(a => a.location === province.id);
  const totalTroops = allArmiesHere.reduce((sum, a) => sum + a.troops, 0);
  const actions = getActionsForProvince(province, kingdoms, armiesHere);
  const ownership = getOwnershipType(province, kingdoms);
  const ownerKingdom = kingdoms.find(k => k.id === province.owner);

  const ownerLabel =
    ownership === 'player'
      ? 'Your Territory'
      : ownerKingdom
        ? ownerKingdom.name
        : 'Unclaimed';

  const ownerColor =
    ownership === 'player'
      ? Colors.gold.primary
      : ownership === 'enemy'
        ? Colors.crimson.bright
        : Colors.text.secondary;

  const borderAccent =
    ownership === 'player'
      ? Colors.gold.dim
      : ownership === 'enemy'
        ? Colors.crimson.dark
        : Colors.border.primary;

  return (
    <Animated.View
      style={[
        styles.backdrop,
        { opacity: fadeAnim },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.backdropTouch}
        activeOpacity={1}
        onPress={handleClose}
      />
      <Animated.View
        style={[
          styles.popupCard,
          {
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            borderColor: borderAccent,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.provinceInfo}>
            <Text style={styles.provinceIcon}>
              {PROVINCE_TYPE_ICONS[province.type] ?? '🏠'}
            </Text>
            <View style={styles.provinceTextGroup}>
              <Text style={styles.provinceName} numberOfLines={1}>
                {province.name}
              </Text>
              <View style={styles.ownerRow}>
                <View style={[styles.ownerDot, { backgroundColor: ownerColor }]} />
                <Text style={[styles.ownerLabel, { color: ownerColor }]}>
                  {ownerLabel}
                </Text>
                {province.underSiege && (
                  <View style={styles.siegeTag}>
                    <Text style={styles.siegeTagText}>SIEGE</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={Colors.text.dim} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{(province.population / 1000).toFixed(1)}k</Text>
            <Text style={styles.quickStatLabel}>Pop</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{province.garrison}</Text>
            <Text style={styles.quickStatLabel}>Garrison</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{totalTroops || '—'}</Text>
            <Text style={styles.quickStatLabel}>Troops</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{province.development}%</Text>
            <Text style={styles.quickStatLabel}>Dev</Text>
          </View>
        </View>

        {province.underSiege && (
          <View style={styles.siegeBar}>
            <View style={styles.siegeBarHeader}>
              <Swords size={12} color="#ff4444" />
              <Text style={styles.siegeBarLabel}>Siege Progress</Text>
              <Text style={styles.siegeBarPercent}>{province.siegeProgress ?? 0}%</Text>
            </View>
            <View style={styles.siegeBarBg}>
              <View style={[styles.siegeBarFill, { width: `${province.siegeProgress ?? 0}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionBtn, { backgroundColor: action.bgColor, borderColor: action.color + '30' }]}
              onPress={() => handleAction(action.id)}
              activeOpacity={0.7}
              testID={`popup-action-${action.id}`}
            >
              {action.icon}
              <Text style={[styles.actionLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  popupCard: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
    backgroundColor: Colors.bg.card,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  provinceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  provinceIcon: {
    fontSize: 28,
  },
  provinceTextGroup: {
    flex: 1,
    gap: 3,
  },
  provinceName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text.primary,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ownerLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  siegeTag: {
    backgroundColor: '#ff000025',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  siegeTagText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#ff4444',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text.primary,
  },
  quickStatLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.text.dim,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border.primary,
    alignSelf: 'center' as const,
  },
  siegeBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ff000010',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ff000020',
  },
  siegeBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  siegeBarLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#ff6666',
    flex: 1,
  },
  siegeBarPercent: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#ff4444',
  },
  siegeBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bg.primary,
    overflow: 'hidden',
  },
  siegeBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#ff4444',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
