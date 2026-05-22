import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

interface GameToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  onDismiss: () => void;
  duration?: number;
  topOffset?: number;
}

const TYPE_CONFIG = {
  success: { bg: Colors.status.success + '20', border: Colors.status.success + '50', text: Colors.status.success, icon: '✅' },
  warning: { bg: Colors.status.warning + '20', border: Colors.status.warning + '50', text: Colors.status.warning, icon: '⚠️' },
  danger: { bg: '#ff000020', border: '#ff000050', text: '#ff4444', icon: '🔥' },
  info: { bg: Colors.status.info + '20', border: Colors.status.info + '50', text: Colors.status.info, icon: '📢' },
};

export default function GameToast({ visible, message, type = 'info', onDismiss, duration = 3000, topOffset = 62 }: GameToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible, duration]);

  if (!visible) return null;

  const config = TYPE_CONFIG[type];

  return (
    <Animated.View style={[s.container, { top: topOffset, transform: [{ translateY }], opacity }]}>
      <TouchableOpacity
        style={[s.toast, { backgroundColor: config.bg, borderColor: config.border }]}
        onPress={onDismiss}
        activeOpacity={0.8}
      >
        <Text style={s.icon}>{config.icon}</Text>
        <Text style={[s.message, { color: config.text }]} numberOfLines={2}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 400,
  },
  icon: {
    fontSize: 18,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
});
