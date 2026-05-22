import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
  Platform, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Shield, Star, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";

import { useGame } from "@/providers/GameProvider";
import { KINGDOM_CHOICES } from "@/mocks/gameData";
import { KingdomChoice } from "@/types/game";

const CREST_OPTIONS = ['🏰', '🦅', '🌙', '🐉', '🗡️', '⚡', '🦁', '🌹'];
const COLOR_OPTIONS = [
  { value: '#d4a574', label: 'Gold' },
  { value: '#e05252', label: 'Crimson' },
  { value: '#5b9bd5', label: 'Azure' },
  { value: '#4caf8a', label: 'Emerald' },
  { value: '#9b6dcc', label: 'Violet' },
  { value: '#e8932a', label: 'Amber' },
];
const CUSTOM_START_PROVINCES = [
  { id: 'thecrossing', name: 'The Crossing', typeIcon: '🏘️', typeLabel: 'City', desc: 'A bustling crossroads. Good gold income.' },
  { id: 'greymarch', name: 'Greymarch', typeIcon: '🌾', typeLabel: 'Farmland', desc: 'Fertile fields. Best food production.' },
  { id: 'hollowmere', name: 'Hollowmere', typeIcon: '🌲', typeLabel: 'Forest', desc: 'Hidden woodland realm. Easier to defend.' },
  { id: 'stonehearth', name: 'Stonehearth', typeIcon: '⛰️', typeLabel: 'Mountain', desc: 'Mountain stronghold. Hardest to siege.' },
  { id: 'wyrmrest', name: 'Wyrmrest', typeIcon: '⛪', typeLabel: 'Temple', desc: 'Ancient holy grounds. Strong faith income.' },
  { id: 'oldwatch', name: 'Oldwatch', typeIcon: '🏰', typeLabel: 'Castle', desc: 'Old fortress. High starting garrison.' },
];

function KingdomCard({ kingdom, onSelect, index }: { kingdom: KingdomChoice; onSelect: () => void; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 120, useNativeDriver: true, tension: 50, friction: 10 }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  const ruler = kingdom.ruler;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={ks.card}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`kingdom-${kingdom.id}`}
      >
        <LinearGradient
          colors={[kingdom.color + '25', Colors.bg.card, Colors.bg.card]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={ks.cardTop}>
          <View style={[ks.crestCircle, { backgroundColor: kingdom.color + '30', borderColor: kingdom.color }]}>
            <Text style={ks.crestText}>{kingdom.crest}</Text>
          </View>
          <View style={ks.cardTitleArea}>
            <Text style={ks.kingdomName}>{kingdom.name}</Text>
            <Text style={ks.dynastyText}>{kingdom.dynasty}</Text>
          </View>
        </View>
        <Text style={ks.description}>{kingdom.description}</Text>
        <View style={ks.rulerSection}>
          <Text style={ks.rulerLabel}>RULER</Text>
          <View style={ks.rulerRow}>
            <Text style={ks.rulerName}>{ruler.name}</Text>
            <Text style={ks.rulerAge}>Age {ruler.age}</Text>
          </View>
          <View style={ks.statsRow}>
            <View style={ks.statItem}><Text style={ks.statEmoji}>🗣️</Text><Text style={ks.statVal}>{ruler.diplomacy}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>⚔️</Text><Text style={ks.statVal}>{ruler.martial}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>💰</Text><Text style={ks.statVal}>{ruler.stewardship}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>🗡️</Text><Text style={ks.statVal}>{ruler.intrigue}</Text></View>
            <View style={ks.statItem}><Text style={ks.statEmoji}>📖</Text><Text style={ks.statVal}>{ruler.learning}</Text></View>
          </View>
        </View>
        <View style={ks.infoRow}>
          <View style={ks.infoItem}>
            <Shield size={12} color={Colors.text.dim} />
            <Text style={ks.infoText}>{kingdom.startingProvinces.length} provinces</Text>
          </View>
          <View style={ks.infoItem}>
            <Star size={12} color={Colors.gold.dim} />
            <Text style={ks.infoText}>{kingdom.bonuses}</Text>
          </View>
        </View>
        <View style={[ks.selectRow, { borderTopColor: kingdom.color + '30' }]}>
          <Text style={[ks.selectText, { color: kingdom.color }]}>Select Kingdom</Text>
          <ChevronRight size={18} color={kingdom.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CustomKingdomCard({ onPress, index }: { onPress: () => void; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 120, useNativeDriver: true, tension: 50, friction: 10 }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={ks.customCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID="custom-kingdom-card"
      >
        <LinearGradient
          colors={['#2a1550', '#1a0e35', '#110b26']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={ks.customBorderAccent} />
        <View style={ks.customCardTop}>
          <View style={ks.customCrestCircle}>
            <Text style={ks.customCrestText}>✨</Text>
          </View>
          <View style={ks.cardTitleArea}>
            <View style={ks.customBadgeRow}>
              <View style={ks.customBadge}><Text style={ks.customBadgeText}>YOUR STORY</Text></View>
            </View>
            <Text style={ks.customKingdomName}>Build Your Own Kingdom</Text>
            <Text style={ks.customDynastyText}>Forge a dynasty from scratch</Text>
          </View>
        </View>

        <Text style={ks.customDescription}>
          Start with a single province, a small levy, and nothing but ambition. Name your ruler, choose your crest, and grow from obscure lord to legendary high king.
        </Text>

        <View style={ks.customFeatureRow}>
          <View style={ks.customFeature}><Text style={ks.customFeatureIcon}>👑</Text><Text style={ks.customFeatureText}>Lord → King → High King</Text></View>
          <View style={ks.customFeature}><Text style={ks.customFeatureIcon}>🗺️</Text><Text style={ks.customFeatureText}>Choose your starting province</Text></View>
          <View style={ks.customFeature}><Text style={ks.customFeatureIcon}>⚔️</Text><Text style={ks.customFeatureText}>Hardest challenge in the realm</Text></View>
        </View>

        <View style={ks.customSelectRow}>
          <Text style={ks.customSparkle}>✨</Text>
          <Text style={ks.customSelectText}>Begin Your Story</Text>
          <ChevronRight size={18} color='#c084fc' />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CustomKingdomSetupModal({
  visible, onClose, onConfirm, difficulty,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: {
    rulerName: string; dynastyName: string; realmName: string;
    gender: 'male' | 'female'; crest: string; color: string; startProvinceId: string;
  }) => void;
  difficulty: 'easy' | 'normal' | 'hard';
}) {
  const [rulerName, setRulerName] = useState('');
  const [dynastyName, setDynastyName] = useState('');
  const [realmName, setRealmName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [selectedCrest, setSelectedCrest] = useState('🏰');
  const [selectedColor, setSelectedColor] = useState('#d4a574');
  const [selectedProvince, setSelectedProvince] = useState('thecrossing');

  const isValid = rulerName.trim().length > 0 && dynastyName.trim().length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm({
      rulerName: rulerName.trim(),
      dynastyName: dynastyName.trim(),
      realmName: realmName.trim() || `${dynastyName.trim()} Realm`,
      gender,
      crest: selectedCrest,
      color: selectedColor,
      startProvinceId: selectedProvince,
    });
  };

  const titleLabel = gender === 'male' ? 'Lord → King → High King' : 'Lady → Queen → High Queen';
  const chosenProvince = CUSTOM_START_PROVINCES.find(p => p.id === selectedProvince);

  if (!visible) return null;

  return (
    <View style={cm.overlay}>
      <TouchableOpacity style={cm.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={cm.sheet}>
            <LinearGradient colors={['#1a1030', '#110a20', '#0d0918']} style={StyleSheet.absoluteFill} />

            <View style={cm.handle} />

            <View style={cm.headerRow}>
              <View>
                <Text style={cm.title}>Build Your Kingdom</Text>
                <Text style={cm.subtitle}>Forge your dynasty from nothing</Text>
              </View>
              <TouchableOpacity style={cm.closeBtn} onPress={onClose}>
                <Text style={cm.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={cm.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>RULER NAME</Text>
                <TextInput
                  style={cm.textInput}
                  value={rulerName}
                  onChangeText={setRulerName}
                  placeholder="Enter your ruler's name…"
                  placeholderTextColor={Colors.text.dim}
                  maxLength={24}
                  autoCorrect={false}
                />
              </View>

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>DYNASTY NAME</Text>
                <TextInput
                  style={cm.textInput}
                  value={dynastyName}
                  onChangeText={setDynastyName}
                  placeholder="House Stonefell, Clan Ashborn…"
                  placeholderTextColor={Colors.text.dim}
                  maxLength={28}
                  autoCorrect={false}
                />
              </View>

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>REALM NAME  <Text style={cm.optionalLabel}>(optional)</Text></Text>
                <TextInput
                  style={cm.textInput}
                  value={realmName}
                  onChangeText={setRealmName}
                  placeholder="The Iron Marches, Realm of…"
                  placeholderTextColor={Colors.text.dim}
                  maxLength={32}
                  autoCorrect={false}
                />
              </View>

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>GENDER &amp; TITLE PATH</Text>
                <View style={cm.toggleRow}>
                  <TouchableOpacity
                    style={[cm.toggleBtn, gender === 'male' && cm.toggleBtnActive]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={[cm.toggleBtnText, gender === 'male' && cm.toggleBtnTextActive]}>♂ Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[cm.toggleBtn, gender === 'female' && cm.toggleBtnActive]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={[cm.toggleBtnText, gender === 'female' && cm.toggleBtnTextActive]}>♀ Female</Text>
                  </TouchableOpacity>
                </View>
                <View style={cm.titlePathRow}>
                  <Text style={cm.titlePathIcon}>👑</Text>
                  <Text style={cm.titlePathText}>{titleLabel}</Text>
                </View>
              </View>

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>REALM CREST</Text>
                <View style={cm.gridRow}>
                  {CREST_OPTIONS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[cm.crestOption, selectedCrest === c && { borderColor: selectedColor, backgroundColor: selectedColor + '20' }]}
                      onPress={() => setSelectedCrest(c)}
                    >
                      <Text style={cm.crestOptionText}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>BANNER COLOR</Text>
                <View style={cm.colorRow}>
                  {COLOR_OPTIONS.map(c => (
                    <TouchableOpacity
                      key={c.value}
                      style={[cm.colorSwatch, { backgroundColor: c.value }, selectedColor === c.value && cm.colorSwatchSelected]}
                      onPress={() => setSelectedColor(c.value)}
                    >
                      {selectedColor === c.value && <View style={cm.colorCheckmark} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={cm.section}>
                <Text style={cm.sectionLabel}>STARTING PROVINCE</Text>
                <Text style={cm.sectionHint}>You begin with only this land — choose wisely.</Text>
                {CUSTOM_START_PROVINCES.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[cm.provinceRow, selectedProvince === p.id && { borderColor: selectedColor, backgroundColor: selectedColor + '12' }]}
                    onPress={() => setSelectedProvince(p.id)}
                  >
                    <Text style={cm.provinceIcon}>{p.typeIcon}</Text>
                    <View style={cm.provinceInfo}>
                      <View style={cm.provinceNameRow}>
                        <Text style={cm.provinceName}>{p.name}</Text>
                        <View style={[cm.typeTag, selectedProvince === p.id && { backgroundColor: selectedColor + '30' }]}>
                          <Text style={[cm.typeTagText, selectedProvince === p.id && { color: selectedColor }]}>{p.typeLabel}</Text>
                        </View>
                      </View>
                      <Text style={cm.provinceDesc}>{p.desc}</Text>
                    </View>
                    {selectedProvince === p.id && (
                      <View style={[cm.provinceDot, { backgroundColor: selectedColor }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={cm.previewSection}>
                <Text style={cm.sectionLabel}>PREVIEW</Text>
                <View style={[cm.previewCard, { borderColor: selectedColor + '50' }]}>
                  <LinearGradient colors={[selectedColor + '18', Colors.bg.card]} style={StyleSheet.absoluteFill} />
                  <View style={cm.previewTop}>
                    <View style={[cm.previewCrest, { borderColor: selectedColor, backgroundColor: selectedColor + '25' }]}>
                      <Text style={cm.previewCrestText}>{selectedCrest}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={cm.previewRealm}>{realmName || (dynastyName ? `${dynastyName} Realm` : 'Your Realm')}</Text>
                      <Text style={cm.previewDynasty}>{dynastyName || 'House —'}</Text>
                    </View>
                  </View>
                  <Text style={[cm.previewRuler, { color: selectedColor }]}>
                    {gender === 'male' ? 'Lord' : 'Lady'} {rulerName || '—'}
                  </Text>
                  <Text style={cm.previewProvince}>
                    Starting in {chosenProvince ? `${chosenProvince.typeIcon} ${chosenProvince.name}` : '—'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={cm.footer}>
              <TouchableOpacity
                style={[cm.confirmBtn, !isValid && cm.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!isValid}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isValid ? ['#7c3aed', '#9b6dcc', '#7c3aed'] : ['#333', '#333']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={cm.confirmGradient}
                >
                  <Text style={{ fontSize: 16 }}>✨</Text>
                  <Text style={[cm.confirmText, !isValid && cm.confirmTextDisabled]}>Begin Your Story</Text>
                </LinearGradient>
              </TouchableOpacity>
              {!isValid && <Text style={cm.validationHint}>Enter a ruler name and dynasty to continue</Text>}
            </View>
          </View>
    </View>
  );
}

const GAME_DIFFICULTY_COLORS: Record<string, string> = {
  easy: Colors.status.success,
  normal: Colors.status.warning,
  hard: Colors.crimson.bright,
};

export default function KingdomSelectGuard() {
  return <KingdomSelectScreen />;
}

function KingdomSelectScreen() {
  console.log("[RealmOfCrowns] Kingdom Select render");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectKingdom, startCustomKingdom, state, isLoaded } = useGame();
  const titleAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-20)).current;
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [showCustomSetup, setShowCustomSetup] = useState(false);
  const hasSavedGame = isLoaded && state.gameStarted;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelect = useCallback((kingdomId: string) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    selectKingdom(kingdomId, difficulty);
    router.replace('/');
  }, [selectKingdom, router, difficulty]);

  const handleContinue = useCallback(() => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    router.replace('/');
  }, [router]);

  const handleCustomConfirm = useCallback((data: {
    rulerName: string; dynastyName: string; realmName: string;
    gender: 'male' | 'female'; crest: string; color: string; startProvinceId: string;
  }) => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }
    startCustomKingdom(data.rulerName, data.dynastyName, data.realmName, data.gender, data.crest, data.color, data.startProvinceId, difficulty);
    setShowCustomSetup(false);
    router.replace('/');
  }, [startCustomKingdom, router, difficulty]);

  return (
    <View style={[ks.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0a0e14', '#111820', '#0d1117']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[ks.headerSection, { opacity: titleAnim, transform: [{ translateY: titleSlide }] }]}>
        <Text style={ks.crownEmoji}>👑</Text>
        <Text style={ks.mainTitle}>REALM OF CROWNS</Text>
        {hasSavedGame ? (
          <TouchableOpacity style={ks.continueButton} onPress={handleContinue} activeOpacity={0.8} testID="continue-game-btn">
            <LinearGradient
              colors={['#8b6914', '#d4a574', '#8b6914']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={ks.continueGradient}
            >
              <ChevronRight size={18} color={Colors.bg.primary} />
              <Text style={ks.continueText}>Continue — Turn {state.turn}, {state.year} AD</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
        <Text style={ks.subtitle}>{hasSavedGame ? 'Or start a new game below:' : 'Choose your kingdom wisely. Each realm offers unique strengths and challenges.'}</Text>
        <View style={ks.difficultyRow}>
          {(['easy', 'normal', 'hard'] as const).map(d => (
            <TouchableOpacity
              key={d}
              style={[ks.difficultyBtn, difficulty === d && { borderColor: GAME_DIFFICULTY_COLORS[d], backgroundColor: GAME_DIFFICULTY_COLORS[d] + '15' }]}
              onPress={() => setDifficulty(d)}
              activeOpacity={0.7}
            >
              <Text style={[ks.difficultyBtnText, difficulty === d && { color: GAME_DIFFICULTY_COLORS[d] }]}>
                {d.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ks.difficultyHint}>
          {difficulty === 'easy' ? 'More resources, weaker AI' : difficulty === 'hard' ? 'Fewer resources, aggressive AI' : 'Balanced experience'}
        </Text>
      </Animated.View>

      <ScrollView
        style={ks.scrollArea}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {KINGDOM_CHOICES.map((kingdom, idx) => (
          <KingdomCard
            key={kingdom.id}
            kingdom={kingdom}
            index={idx}
            onSelect={() => handleSelect(kingdom.id)}
          />
        ))}
        <CustomKingdomCard
          index={KINGDOM_CHOICES.length}
          onPress={() => setShowCustomSetup(true)}
        />
      </ScrollView>

      <CustomKingdomSetupModal
        visible={showCustomSetup}
        onClose={() => setShowCustomSetup(false)}
        onConfirm={handleCustomConfirm}
        difficulty={difficulty}
      />
    </View>
  );
}

const ks = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  headerSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 32 },
  crownEmoji: { fontSize: 48, marginBottom: 8 },
  mainTitle: { fontSize: 26, fontWeight: "900" as const, color: Colors.gold.bright, letterSpacing: 3, textAlign: "center" as const },
  subtitle: { fontSize: 13, color: Colors.text.secondary, textAlign: "center" as const, lineHeight: 19, marginTop: 8 },
  continueButton: { width: '100%', borderRadius: 14, overflow: 'hidden' as const, marginTop: 12, marginBottom: 4 },
  continueGradient: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 16, gap: 8 },
  continueText: { fontSize: 16, fontWeight: '800' as const, color: Colors.bg.primary, letterSpacing: 0.5 },
  scrollArea: { flex: 1 },
  card: { marginBottom: 16, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border.primary, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  crestCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  crestText: { fontSize: 26 },
  cardTitleArea: { flex: 1, gap: 2 },
  kingdomName: { fontSize: 17, fontWeight: "800" as const, color: Colors.text.primary },
  dynastyText: { fontSize: 12, color: Colors.text.secondary },
  description: { fontSize: 12, color: Colors.text.secondary, lineHeight: 18, marginTop: 12 },
  rulerSection: { marginTop: 14, backgroundColor: Colors.bg.tertiary, borderRadius: 10, padding: 10 },
  rulerLabel: { fontSize: 9, fontWeight: "700" as const, color: Colors.text.dim, letterSpacing: 1.5, marginBottom: 6 },
  rulerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rulerName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text.primary },
  rulerAge: { fontSize: 11, color: Colors.text.dim },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: Colors.bg.card, borderRadius: 6, paddingVertical: 5 },
  statEmoji: { fontSize: 11 },
  statVal: { fontSize: 13, fontWeight: "700" as const, color: Colors.text.primary },
  infoRow: { flexDirection: "row", gap: 12, marginTop: 12, flexWrap: "wrap" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 11, color: Colors.text.dim },
  selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  selectText: { fontSize: 14, fontWeight: "700" as const },
  difficultyRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  difficultyBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: Colors.border.primary, backgroundColor: Colors.bg.card },
  difficultyBtnText: { fontSize: 11, fontWeight: "800" as const, color: Colors.text.dim, letterSpacing: 1 },
  difficultyHint: { fontSize: 11, color: Colors.text.dim, marginTop: 6 },
  // Custom kingdom card
  customCard: { marginBottom: 16, borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: '#5b21b640', padding: 16 },
  customBorderAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#7c3aed' },
  customCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  customCrestCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: '#7c3aed', backgroundColor: '#4c1d9520' },
  customCrestText: { fontSize: 26 },
  customBadgeRow: { flexDirection: "row", marginBottom: 3 },
  customBadge: { backgroundColor: '#7c3aed', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  customBadgeText: { fontSize: 9, fontWeight: "800" as const, color: '#fff', letterSpacing: 1.5 },
  customKingdomName: { fontSize: 17, fontWeight: "800" as const, color: '#e9d5ff' },
  customDynastyText: { fontSize: 12, color: '#a78bfa' },
  customDescription: { fontSize: 12, color: Colors.text.secondary, lineHeight: 18, marginTop: 12 },
  customFeatureRow: { marginTop: 12, gap: 6 },
  customFeature: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: '#4c1d9520', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  customFeatureIcon: { fontSize: 14 },
  customFeatureText: { fontSize: 12, color: '#c4b5fd', fontWeight: "600" as const },
  customSelectRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#5b21b630' },
  customSelectText: { fontSize: 14, fontWeight: "700" as const, color: '#c084fc' },
  customSparkle: { fontSize: 16 },
});

const cm = StyleSheet.create({
  overlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', flexDirection: 'column' as const, justifyContent: 'flex-end' as const, zIndex: 1000 },
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' as const, maxHeight: '90%', backgroundColor: '#0d0918' },
  handle: { width: 40, height: 4, backgroundColor: '#4a3a6a', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#2d1f4a' },
  title: { fontSize: 20, fontWeight: '800' as const, color: '#e9d5ff' },
  subtitle: { fontSize: 12, color: '#a78bfa', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2d1f4a', alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800' as const, color: '#7c5cbf', letterSpacing: 1.5, marginBottom: 8 },
  optionalLabel: { fontSize: 10, fontWeight: '400' as const, color: '#5a4a7a', letterSpacing: 0 },
  sectionHint: { fontSize: 11, color: Colors.text.dim, marginBottom: 10 },
  textInput: { backgroundColor: '#1a1030', borderRadius: 10, borderWidth: 1, borderColor: '#3d2a6a', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#e9d5ff' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#3d2a6a', backgroundColor: '#1a1030', alignItems: 'center' },
  toggleBtnActive: { borderColor: '#7c3aed', backgroundColor: '#4c1d9530' },
  toggleBtnText: { fontSize: 14, fontWeight: '700' as const, color: Colors.text.dim },
  toggleBtnTextActive: { color: '#c084fc' },
  titlePathRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#1a1030', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  titlePathIcon: { fontSize: 16 },
  titlePathText: { fontSize: 13, color: '#c4b5fd', fontWeight: '600' as const },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  crestOption: { width: 54, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: '#3d2a6a', backgroundColor: '#1a1030', alignItems: 'center', justifyContent: 'center' },
  crestOptionText: { fontSize: 26 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorSwatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  colorSwatchSelected: { borderColor: '#fff', borderWidth: 2.5 },
  colorCheckmark: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.7)' },
  provinceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1030', borderRadius: 10, borderWidth: 1.5, borderColor: '#2d1f4a', padding: 12, marginBottom: 8 },
  provinceIcon: { fontSize: 22 },
  provinceInfo: { flex: 1 },
  provinceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  provinceName: { fontSize: 14, fontWeight: '700' as const, color: '#e9d5ff' },
  typeTag: { backgroundColor: '#2d1f4a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeTagText: { fontSize: 9, fontWeight: '700' as const, color: '#a78bfa', letterSpacing: 0.5 },
  provinceDesc: { fontSize: 11, color: Colors.text.dim, lineHeight: 15 },
  provinceDot: { width: 10, height: 10, borderRadius: 5 },
  previewSection: { marginTop: 20 },
  previewCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, padding: 14 },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  previewCrest: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  previewCrestText: { fontSize: 22 },
  previewRealm: { fontSize: 16, fontWeight: '800' as const, color: '#e9d5ff' },
  previewDynasty: { fontSize: 12, color: '#a78bfa' },
  previewRuler: { fontSize: 14, fontWeight: '700' as const, marginBottom: 4 },
  previewProvince: { fontSize: 12, color: Colors.text.dim },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#2d1f4a' },
  confirmBtn: { borderRadius: 14, overflow: 'hidden' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  confirmText: { fontSize: 16, fontWeight: '800' as const, color: '#fff', letterSpacing: 0.3 },
  confirmTextDisabled: { color: Colors.text.dim },
  validationHint: { fontSize: 12, color: Colors.text.dim, textAlign: 'center' as const, marginTop: 8 },
  closeBtnText: { fontSize: 18, color: Colors.text.secondary, fontWeight: '700' as const },
});
