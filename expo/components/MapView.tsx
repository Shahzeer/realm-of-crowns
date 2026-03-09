import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { Province, Army } from '@/types/game';
import Colors from '@/constants/colors';
import { PROVINCE_TYPE_ICONS } from '@/mocks/gameData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = Math.max(SCREEN_WIDTH - 40, 340);
const MAP_HEIGHT = 520;

interface MapViewProps {
  provinces: Province[];
  armies: Army[];
  onProvincePress: (province: Province) => void;
}

const OWNER_COLORS: Record<string, string> = {
  player: Colors.gold.primary,
  ironforge: '#d4a574',
  valkorian: '#c41e3a',
  solarian: '#e8a832',
  nordheim: '#58a6ff',
  crimsonhorde: '#cc5533',
  emeraldleague: '#33aa66',
};

const OWNER_LABELS: Record<string, string> = {
  player: 'Your Realm',
  ironforge: 'Ironforge',
  valkorian: 'Valkorian',
  solarian: 'Solarian',
  nordheim: 'Nordheim',
  crimsonhorde: 'Crimson Horde',
  emeraldleague: 'Emerald League',
};

function ConnectionLine({ from, to }: { from: Province; to: Province }) {
  const x1 = from.x * (MAP_WIDTH - 20);
  const y1 = from.y * MAP_HEIGHT;
  const x2 = to.x * (MAP_WIDTH - 20);
  const y2 = to.y * MAP_HEIGHT;

  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  const isWarZone = from.owner !== to.owner && from.owner !== '' && to.owner !== '';

  return (
    <View
      style={[
        styles.connection,
        {
          width: length,
          left: x1,
          top: y1,
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: isWarZone ? Colors.crimson.bright + '40' : Colors.border.primary + '60',
          height: isWarZone ? 2 : 1,
        },
      ]}
    />
  );
}

function ProvinceNode({ province, onPress, index, armyCount, isUnderSiege, _totalTroops }: {
  province: Province;
  onPress: () => void;
  index: number;
  armyCount: number;
  isUnderSiege: boolean;
  _totalTroops: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const siegePulse = useRef(new Animated.Value(1)).current;
  const isPlayer = province.owner === 'player';

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 40,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, []);

  useEffect(() => {
    if (isUnderSiege) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(siegePulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(siegePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUnderSiege]);

  const borderColor = OWNER_COLORS[province.owner] || '#666';
  const bgColor = (OWNER_COLORS[province.owner] || '#444') + '33';
  const isCapital = province.type === 'capital';

  return (
    <Animated.View
      style={[
        styles.provinceContainer,
        {
          left: province.x * (MAP_WIDTH - 20) - (isCapital ? 30 : 24),
          top: province.y * MAP_HEIGHT - (isCapital ? 30 : 24),
          transform: [{ scale: Animated.multiply(scaleAnim, isUnderSiege ? siegePulse : new Animated.Value(1)) }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.provinceNode,
          {
            backgroundColor: bgColor,
            borderColor: isUnderSiege ? '#ff4444' : borderColor,
            width: isCapital ? 60 : 48,
            height: isCapital ? 60 : 48,
            borderRadius: isCapital ? 30 : 24,
            borderWidth: isCapital ? 3 : 2,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={`province-${province.id}`}
      >
        <Text style={[styles.provinceIcon, { fontSize: isCapital ? 16 : 13 }]}>
          {PROVINCE_TYPE_ICONS[province.type] ?? '🏠'}
        </Text>
        <Text
          style={[
            styles.provinceName,
            { color: isPlayer ? Colors.text.primary : Colors.text.dim, fontSize: isCapital ? 8 : 7 },
          ]}
          numberOfLines={1}
        >
          {province.name}
        </Text>
        {isPlayer && (
          <View style={[styles.ownerDot, { backgroundColor: Colors.gold.primary }]} />
        )}
        {armyCount > 0 && (
          <View style={[styles.armyBadge, isPlayer ? { backgroundColor: Colors.status.info } : { backgroundColor: Colors.crimson.bright }]}>
            <Text style={styles.armyBadgeText}>{armyCount}</Text>
          </View>
        )}
        {isPlayer && province.garrison > 0 && (
          <View style={[styles.garrisonBadge, {
            backgroundColor: province.garrison >= 400 ? Colors.status.success + '90' : province.garrison >= 200 ? Colors.status.warning + '90' : Colors.status.danger + '90'
          }]}>
            <Text style={styles.garrisonBadgeText}>{province.garrison}</Text>
          </View>
        )}
        {isUnderSiege && (
          <View style={styles.siegeIndicator}>
            <Text style={styles.siegeIndicatorText}>⚔️</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(function MapView({ provinces, armies, onProvincePress }: MapViewProps) {
  const connections = useMemo(() => {
    const result: Array<{ from: Province; to: Province; key: string }> = [];
    const drawn = new Set<string>();

    provinces.forEach(p => {
      p.connectedTo.forEach(targetId => {
        const key = [p.id, targetId].sort().join('-');
        if (!drawn.has(key)) {
          drawn.add(key);
          const target = provinces.find(t => t.id === targetId);
          if (target) {
            result.push({ from: p, to: target, key });
          }
        }
      });
    });
    return result;
  }, [provinces]);

  const armyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    armies.forEach(a => {
      counts[a.location] = (counts[a.location] || 0) + 1;
    });
    return counts;
  }, [armies]);

  const troopCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    armies.forEach(a => {
      counts[a.location] = (counts[a.location] || 0) + a.troops;
    });
    return counts;
  }, [armies]);

  const legendOwners = useMemo(() => {
    const owners = new Set<string>();
    provinces.forEach(p => owners.add(p.owner));
    return Array.from(owners).filter(o => OWNER_COLORS[o]);
  }, [provinces]);

  return (
    <View style={styles.mapContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.mapBg}>
          {connections.map(c => (
            <ConnectionLine key={c.key} from={c.from} to={c.to} />
          ))}
          {provinces.map((province, index) => (
            <ProvinceNode
              key={province.id}
              province={province}
              index={index}
              onPress={() => onProvincePress(province)}
              armyCount={armyCounts[province.id] || 0}
              isUnderSiege={province.underSiege === true}
              _totalTroops={troopCounts[province.id] || 0}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.legendRow}>
        {legendOwners.map(owner => (
          <View key={owner} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: OWNER_COLORS[owner] }]} />
            <Text style={styles.legendText}>{OWNER_LABELS[owner] || owner}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  mapContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  mapBg: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    padding: 10,
    position: 'relative',
  },
  connection: {
    position: 'absolute',
    height: 1,
    backgroundColor: Colors.border.primary,
    transformOrigin: 'left center',
  },
  provinceContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  provinceNode: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  provinceIcon: {
    fontSize: 13,
  },
  provinceName: {
    fontSize: 7,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginTop: 1,
  },
  ownerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    top: 1,
    right: 1,
  },
  armyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bg.tertiary,
  },
  armyBadgeText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#fff',
  },
  garrisonBadge: {
    position: 'absolute',
    top: -2,
    left: -6,
    minWidth: 18,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.bg.tertiary,
  },
  garrisonBadgeText: {
    fontSize: 6,
    fontWeight: '800' as const,
    color: '#fff',
  },
  siegeIndicator: {
    position: 'absolute',
    top: -5,
    left: -5,
  },
  siegeIndicatorText: {
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: Colors.text.secondary,
  },
});
