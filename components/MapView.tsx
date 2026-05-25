import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { Province, Army } from '@/types/game';
import { VisibilityMap } from '@/utils/fogOfWar';
import Colors from '@/constants/colors';
import { PROVINCE_TYPE_ICONS } from '@/mocks/gameData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = Math.max(SCREEN_WIDTH * 1.4, 520);
const MAP_HEIGHT = 820;

export { MAP_WIDTH, MAP_HEIGHT, OWNER_COLORS, OWNER_LABELS };

interface MapViewProps {
  provinces: Province[];
  armies: Army[];
  onProvincePress: (province: Province) => void;
  selectedProvinceId?: string | null;
  visibilityMap: VisibilityMap;
}

const OWNER_COLORS: Record<string, string> = {
  player: Colors.gold.primary,
  ironforge: '#d4a574',
  valkorian: '#c41e3a',
  solarian: '#e8a832',
  nordheim: '#58a6ff',
  crimsonhorde: '#cc5533',
  emeraldleague: '#33aa66',
  neutral: '#1e2030',
  greymarchers: '#7a7060',
  dusklords: '#4a5e3a',
  ironvale: '#6a6070',
  obsidiancrown: '#7c2d12',
  moonveil: '#7c3aed',
  riverlands: '#0f766e',
  stormcoast: '#0369a1',
  ivoryorder: '#d6d3d1',
};

const OWNER_LABELS: Record<string, string> = {
  player: 'Your Realm',
  ironforge: 'Ironforge',
  valkorian: 'Valkorian',
  solarian: 'Solarian',
  nordheim: 'Nordheim',
  crimsonhorde: 'Crimson Horde',
  emeraldleague: 'Emerald League',
  neutral: 'Unclaimed',
  greymarchers: 'Grey March',
  dusklords: 'Duskwood Hold',
  ironvale: 'Iron Vale',
  obsidiancrown: 'Obsidian Crown',
  moonveil: 'Moonveil Realm',
  riverlands: 'Riverland Marches',
  stormcoast: 'Stormcoast Thanes',
  ivoryorder: 'Ivory Order',
};

const FOG_COLOR = '#080a10';
const FOG_BORDER = '#1a1d28';

function TerritoryGlow({ provinces, visibilityMap }: { provinces: Province[]; visibilityMap: VisibilityMap }) {
  const ownerGroups = useMemo(() => {
    const groups: Record<string, Province[]> = {};
    provinces.forEach(p => {
      if (!visibilityMap[p.id]) return;
      if (p.owner === 'neutral') return;
      if (!groups[p.owner]) groups[p.owner] = [];
      groups[p.owner].push(p);
    });
    return groups;
  }, [provinces, visibilityMap]);

  return (
    <>
      {Object.entries(ownerGroups).map(([owner, ownerProvinces]) => {
        const color = OWNER_COLORS[owner] || '#555';
        return ownerProvinces.map(p => {
          const cx = p.x * (MAP_WIDTH - 20);
          const cy = p.y * MAP_HEIGHT;
          const isCapital = p.type === 'capital';
          const isPlayerOwned = p.owner === 'player';
          const radius = isPlayerOwned
            ? (isCapital ? 42 : 34)
            : (isCapital ? 30 : 24);
          return (
            <View
              key={`glow-${p.id}`}
              style={[
                styles.territoryGlow,
                {
                  left: cx - radius,
                  top: cy - radius,
                  width: radius * 2,
                  height: radius * 2,
                  borderRadius: radius,
                  backgroundColor: color + '14',
                  borderColor: color + '25',
                },
              ]}
            />
          );
        });
      })}
    </>
  );
}

function ConnectionLine({ from, to, fogged }: { from: Province; to: Province; fogged: boolean }) {
  const x1 = from.x * (MAP_WIDTH - 20);
  const y1 = from.y * MAP_HEIGHT;
  const x2 = to.x * (MAP_WIDTH - 20);
  const y2 = to.y * MAP_HEIGHT;

  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  const sameOwner = from.owner === to.owner && from.owner !== '';
  const isWarZone = from.owner !== to.owner && from.owner !== '' && to.owner !== '';
  const ownerColor = sameOwner ? (OWNER_COLORS[from.owner] || Colors.border.primary) : null;

  const bgColor = fogged
    ? FOG_BORDER + '30'
    : isWarZone
      ? Colors.crimson.bright + '40'
      : sameOwner
        ? ownerColor + '50'
        : Colors.border.primary + '40';

  return (
    <View
      style={[
        styles.connection,
        {
          width: length,
          left: x1,
          top: y1,
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: bgColor,
          height: fogged ? 0.5 : isWarZone ? 2 : sameOwner ? 1.5 : 1,
        },
      ]}
    />
  );
}

function MarchRoutePreview({ army, provinces }: { army: Army; provinces: Province[] }) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!army.marchPath || army.marchPath.length === 0) return null;

  const waypoints = [army.location, ...army.marchPath];
  const dots: React.ReactNode[] = [];

  for (let seg = 0; seg < waypoints.length - 1; seg++) {
    const from = provinces.find(p => p.id === waypoints[seg]);
    const to = provinces.find(p => p.id === waypoints[seg + 1]);
    if (!from || !to) continue;

    const x1 = from.x * (MAP_WIDTH - 20);
    const y1 = from.y * MAP_HEIGHT;
    const x2 = to.x * (MAP_WIDTH - 20);
    const y2 = to.y * MAP_HEIGHT;
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const numDots = Math.max(2, Math.floor(length / 13));

    for (let d = 1; d < numDots; d++) {
      const t = d / numDots;
      const cx = x1 + t * (x2 - x1);
      const cy = y1 + t * (y2 - y1);
      const dotSize = d % 3 === 0 ? 5 : 3;
      dots.push(
        <Animated.View
          key={`dot-${army.id}-${seg}-${d}`}
          style={{
            position: 'absolute' as const,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: Colors.gold.bright,
            left: cx - dotSize / 2,
            top: cy - dotSize / 2,
            opacity: pulseAnim,
          }}
        />
      );
    }
  }

  const destId = army.marchPath[army.marchPath.length - 1];
  const dest = provinces.find(p => p.id === destId);
  if (dest) {
    const dx = dest.x * (MAP_WIDTH - 20);
    const dy = dest.y * MAP_HEIGHT;
    dots.push(
      <Animated.View
        key={`dest-${army.id}`}
        style={{ position: 'absolute' as const, left: dx - 9, top: dy - 22, opacity: pulseAnim }}
      >
        <Text style={{ fontSize: 14 }}>🎯</Text>
      </Animated.View>
    );
  }

  return <>{dots}</>;
}

function MarchingIndicator({ from, to, armyName }: { from: Province; to: Province; armyName: string }) {
  const dashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(dashAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();
  }, []);

  const x1 = from.x * (MAP_WIDTH - 20);
  const y1 = from.y * MAP_HEIGHT;
  const x2 = to.x * (MAP_WIDTH - 20);
  const y2 = to.y * MAP_HEIGHT;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <Animated.View
      style={[
        styles.marchIndicator,
        {
          left: midX - 28,
          top: midY - 10,
          opacity: Animated.add(0.6, Animated.multiply(dashAnim, 0.4)),
        },
      ]}
    >
      <Text style={styles.marchIcon}>🚶</Text>
      <Text style={styles.marchLabel} numberOfLines={1}>{armyName.slice(0, 8)}</Text>
    </Animated.View>
  );
}

function SiegeProgressBar({ province }: { province: Province }) {
  const cx = province.x * (MAP_WIDTH - 20);
  const cy = province.y * MAP_HEIGHT;
  const isCapital = province.type === 'capital';
  const nodeOffset = isCapital ? 34 : 28;
  const barWidth = 40;
  const progress = province.siegeProgress ?? 0;

  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.siegeProgressContainer,
        {
          left: cx - barWidth / 2,
          top: cy + nodeOffset,
          width: barWidth,
          opacity: pulseAnim,
        },
      ]}
    >
      <View style={styles.siegeProgressBg}>
        <View style={[styles.siegeProgressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.siegeProgressText}>{progress}%</Text>
    </Animated.View>
  );
}

function TroopCountLabel({ province, troops }: { province: Province; troops: number }) {
  const cx = province.x * (MAP_WIDTH - 20);
  const cy = province.y * MAP_HEIGHT;
  const isCapital = province.type === 'capital';

  return (
    <View
      style={[
        styles.troopCountContainer,
        {
          left: cx + (isCapital ? 24 : 18),
          top: cy - 8,
        },
      ]}
    >
      <Text style={styles.troopCountIcon}>⚔️</Text>
      <Text style={styles.troopCountText}>{troops >= 1000 ? `${(troops / 1000).toFixed(1)}k` : troops}</Text>
    </View>
  );
}

function FogOverlay({ province }: { province: Province }) {
  const cx = province.x * (MAP_WIDTH - 20);
  const cy = province.y * MAP_HEIGHT;
  const isCapital = province.type === 'capital';
  const radius = isCapital ? 36 : 30;

  const fogPulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fogPulse, { toValue: 0.7, duration: 3000, useNativeDriver: true }),
        Animated.timing(fogPulse, { toValue: 0.55, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.fogOverlay,
        {
          left: cx - radius,
          top: cy - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          opacity: fogPulse,
        },
      ]}
    />
  );
}

function ProvinceNode({ province, onPress, index, armyCount, isUnderSiege, _totalTroops, isSelected, isFogged }: {
  province: Province;
  onPress: () => void;
  index: number;
  armyCount: number;
  isUnderSiege: boolean;
  _totalTroops: number;
  isSelected: boolean;
  isFogged: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const siegePulse = useRef(new Animated.Value(1)).current;
  const selectGlow = useRef(new Animated.Value(0)).current;
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
    if (isUnderSiege && !isFogged) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(siegePulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(siegePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUnderSiege, isFogged]);

  useEffect(() => {
    Animated.timing(selectGlow, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const borderColor = isFogged ? FOG_BORDER : (OWNER_COLORS[province.owner] || '#666');
  const bgColor = isFogged ? FOG_COLOR + 'cc' : (OWNER_COLORS[province.owner] || '#444') + '33';
  const isCapital = province.type === 'capital';

  return (
    <Animated.View
      style={[
        styles.provinceContainer,
        {
          left: province.x * (MAP_WIDTH - 20) - (isCapital ? 30 : 24),
          top: province.y * MAP_HEIGHT - (isCapital ? 30 : 24),
          transform: [{ scale: Animated.multiply(scaleAnim, (isUnderSiege && !isFogged) ? siegePulse : new Animated.Value(1)) }],
        },
      ]}
    >
      {isSelected && !isFogged && (
        <Animated.View
          style={[
            styles.selectedRing,
            {
              width: isPlayer ? (isCapital ? 68 : 56) : (isCapital ? 50 : 40),
              height: isPlayer ? (isCapital ? 68 : 56) : (isCapital ? 50 : 40),
              borderRadius: isPlayer ? (isCapital ? 34 : 28) : (isCapital ? 25 : 20),
              borderColor: Colors.gold.bright,
              opacity: selectGlow,
            },
          ]}
        />
      )}
      <TouchableOpacity
        style={[
          styles.provinceNode,
          {
            backgroundColor: isFogged
              ? FOG_COLOR + 'ee'
              : isSelected
                ? (OWNER_COLORS[province.owner] || '#444') + '55'
                : bgColor,
            borderColor: isFogged
              ? FOG_BORDER
              : isSelected
                ? Colors.gold.bright
                : isUnderSiege
                  ? '#ff4444'
                  : borderColor,
            width: isPlayer ? (isCapital ? 60 : 48) : (isCapital ? 42 : 34),
            height: isPlayer ? (isCapital ? 60 : 48) : (isCapital ? 42 : 34),
            borderRadius: isPlayer ? (isCapital ? 30 : 24) : (isCapital ? 21 : 17),
            borderWidth: isFogged ? 1 : isSelected ? 3 : isCapital ? 3 : 2,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={`province-${province.id}`}
      >
        <Text style={[
          styles.provinceIcon,
          { fontSize: isCapital ? 16 : 13, opacity: isFogged ? 0.25 : 1 },
        ]}>
          {isFogged ? '❓' : (PROVINCE_TYPE_ICONS[province.type] ?? '🏠')}
        </Text>
        <Text
          style={[
            styles.provinceName,
            {
              color: isFogged ? '#2a2d38' : isPlayer ? Colors.text.primary : Colors.text.dim,
              fontSize: isCapital ? 8 : 7,
            },
          ]}
          numberOfLines={1}
        >
          {isFogged ? '???' : province.name}
        </Text>
        {!isFogged && isPlayer && !isSelected && (
          <View style={[styles.ownerDot, { backgroundColor: Colors.gold.primary }]} />
        )}
        {!isFogged && armyCount > 0 && (
          <View style={[styles.armyBadge, isPlayer ? { backgroundColor: Colors.status.info } : { backgroundColor: Colors.crimson.bright }]}>
            <Text style={styles.armyBadgeText}>{armyCount}</Text>
          </View>
        )}
        {!isFogged && isPlayer && province.garrison > 0 && (
          <View style={[styles.garrisonBadge, {
            backgroundColor: province.garrison >= 400 ? Colors.status.success + '90' : province.garrison >= 200 ? Colors.status.warning + '90' : Colors.status.danger + '90'
          }]}>
            <Text style={styles.garrisonBadgeText}>{province.garrison}</Text>
          </View>
        )}
        {!isFogged && isUnderSiege && (
          <View style={styles.siegeIndicator}>
            <Text style={styles.siegeIndicatorText}>⚔️</Text>
          </View>
        )}
        {isFogged && (
          <View style={styles.fogBadge}>
            <Text style={styles.fogBadgeText}>👁️</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(function MapView({ provinces, armies, onProvincePress, selectedProvinceId, visibilityMap }: MapViewProps) {
  const innerScrollRef = useRef<ScrollView>(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (hasCenteredRef.current) return;
    const playerProvs = provinces.filter(p => p.owner === 'player');
    if (playerProvs.length === 0) return;
    const avgX = playerProvs.reduce((sum, p) => sum + p.x * (MAP_WIDTH - 20), 0) / playerProvs.length;
    const scrollX = Math.max(0, avgX - SCREEN_WIDTH / 2);
    const timer = setTimeout(() => {
      innerScrollRef.current?.scrollTo({ x: scrollX, animated: false });
      hasCenteredRef.current = true;
    }, 120);
    return () => clearTimeout(timer);
  }, [provinces]);

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

  const siegeProvinces = useMemo(() => {
    return provinces.filter(p => p.underSiege === true && visibilityMap[p.id]);
  }, [provinces, visibilityMap]);

  const provincesWithTroops = useMemo(() => {
    return provinces.filter(p => (troopCounts[p.id] || 0) > 0 && visibilityMap[p.id]);
  }, [provinces, troopCounts, visibilityMap]);

  const foggedProvinces = useMemo(() => {
    return provinces.filter(p => !visibilityMap[p.id]);
  }, [provinces, visibilityMap]);

  const fogCount = foggedProvinces.length;
  const totalCount = provinces.length;

  const legendOwners = useMemo(() => {
    const owners = new Set<string>();
    provinces.forEach(p => {
      if (visibilityMap[p.id]) owners.add(p.owner);
    });
    return Array.from(owners).filter(o => OWNER_COLORS[o]);
  }, [provinces, visibilityMap]);

  return (
    <View style={styles.mapContainer}>
      <ScrollView ref={innerScrollRef} horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.mapBg}>
          <TerritoryGlow provinces={provinces} visibilityMap={visibilityMap} />
          {foggedProvinces.map(p => (
            <FogOverlay key={`fog-${p.id}`} province={p} />
          ))}
          {connections.map(c => {
            const bothFogged = !visibilityMap[c.from.id] && !visibilityMap[c.to.id];
            const anyFogged = !visibilityMap[c.from.id] || !visibilityMap[c.to.id];
            return (
              <ConnectionLine key={c.key} from={c.from} to={c.to} fogged={bothFogged || anyFogged} />
            );
          })}
          {armies
            .filter(a => a.owner === 'player' && a.status === 'marching' && a.marchPath && a.marchPath.length > 0)
            .map(army => (
              <MarchRoutePreview key={`route-${army.id}`} army={army} provinces={provinces} />
            ))
          }
          {provinces.map((province, index) => (
            <ProvinceNode
              key={province.id}
              province={province}
              index={index}
              onPress={() => onProvincePress(province)}
              armyCount={armyCounts[province.id] || 0}
              isUnderSiege={province.underSiege === true}
              _totalTroops={troopCounts[province.id] || 0}
              isSelected={selectedProvinceId === province.id}
              isFogged={!visibilityMap[province.id]}
            />
          ))}
          {provincesWithTroops.map(p => (
            <TroopCountLabel
              key={`troops-${p.id}`}
              province={p}
              troops={troopCounts[p.id] || 0}
            />
          ))}
          {siegeProvinces.map(p => (
            <SiegeProgressBar key={`siege-${p.id}`} province={p} />
          ))}
          {armies.filter(a => a.owner === 'player' && a.status === 'marching' && a.destination).map(army => {
            const fromProv = provinces.find(p => p.id === army.location);
            const toProv = provinces.find(p => p.id === army.destination);
            if (!fromProv || !toProv) return null;
            return <MarchingIndicator key={`march-${army.id}`} from={fromProv} to={toProv} armyName={army.name} />;
          })}
        </View>
      </ScrollView>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Text style={styles.fogLegendIcon}>👁️</Text>
          <Text style={styles.legendText}>Fog: {fogCount}/{totalCount}</Text>
        </View>
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
  territoryGlow: {
    position: 'absolute',
    borderWidth: 1,
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
    zIndex: 10,
  },
  selectedRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    alignSelf: 'center',
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
  siegeProgressContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 1,
    zIndex: 50,
  },
  siegeProgressBg: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#1a0505',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#ff000040',
  },
  siegeProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#ff4444',
  },
  siegeProgressText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#ff6666',
  },
  troopCountContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.bg.primary + 'cc',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.border.primary,
    zIndex: 40,
  },
  troopCountIcon: {
    fontSize: 7,
  },
  troopCountText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.text.primary,
  },
  fogOverlay: {
    position: 'absolute',
    backgroundColor: FOG_COLOR,
    borderWidth: 1,
    borderColor: FOG_BORDER,
    zIndex: 5,
  },
  fogBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: FOG_COLOR,
    borderWidth: 0.5,
    borderColor: FOG_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogBadgeText: {
    fontSize: 6,
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
  fogLegendIcon: {
    fontSize: 9,
  },
  marchIndicator: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.status.warning + '40',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.status.warning + '60',
    zIndex: 60,
  },
  marchIcon: {
    fontSize: 10,
  },
  marchLabel: {
    fontSize: 7,
    fontWeight: '700' as const,
    color: Colors.status.warning,
    maxWidth: 40,
  },
});
