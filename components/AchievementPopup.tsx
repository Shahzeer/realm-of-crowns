import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { Achievement } from '@/types/game';

interface AchievementPopupProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

export default function AchievementPopup({ achievements, onDismiss }: AchievementPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const visible = achievements.length > 0;
  const current = achievements[currentIndex];

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      shineAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(shineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ])
        ),
      ]).start();
    }
  }, [visible, currentIndex]);

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
      onDismiss();
    }
  };

  if (!visible || !current) return null;

  const categoryColors: Record<string, string> = {
    military: Colors.crimson.bright,
    economy: Colors.gold.bright,
    diplomacy: Colors.status.info,
    expansion: Colors.status.success,
    survival: Colors.faith.light,
  };

  const accentColor = categoryColors[current.category] || Colors.gold.bright;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <Animated.View style={[s.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#1a1508', '#0d1117', '#0d0a14']} style={StyleSheet.absoluteFill} />
          <View style={[s.glowBorder, { borderColor: accentColor + '60' }]} />

          <Animated.View style={[s.iconContainer, { opacity: Animated.add(0.7, Animated.multiply(shineAnim, 0.3)) }]}>
            <View style={[s.iconBg, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
              <Text style={s.achievementIcon}>{current.icon}</Text>
            </View>
          </Animated.View>

          <Text style={s.unlockLabel}>ACHIEVEMENT UNLOCKED</Text>
          <Text style={[s.achievementName, { color: accentColor }]}>{current.name}</Text>
          <Text style={s.achievementDesc}>{current.description}</Text>

          <View style={[s.categoryBadge, { backgroundColor: accentColor + '15', borderColor: accentColor + '30' }]}>
            <Text style={[s.categoryText, { color: accentColor }]}>{current.category.toUpperCase()}</Text>
          </View>

          {achievements.length > 1 && (
            <Text style={s.countText}>{currentIndex + 1} of {achievements.length}</Text>
          )}

          <TouchableOpacity style={[s.dismissBtn, { backgroundColor: accentColor }]} onPress={handleNext} activeOpacity={0.8}>
            <Text style={s.dismissText}>
              {currentIndex < achievements.length - 1 ? 'Next' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 2,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  achievementIcon: {
    fontSize: 42,
  },
  unlockLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold.dim,
    letterSpacing: 3,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 22,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  achievementDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: 260,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  countText: {
    fontSize: 11,
    color: Colors.text.dim,
    marginBottom: 16,
  },
  dismissBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.bg.primary,
  },
});
