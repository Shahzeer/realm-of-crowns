import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signInPending, signInError, resetSignInError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const crownScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(crownScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignIn = useCallback(async () => {
    setLocalError(null);
    resetSignInError();

    if (!email.trim()) { setLocalError('Please enter your email'); return; }
    if (!password.trim()) { setLocalError('Please enter your password'); return; }

    try {
      await signIn({ email: email.trim(), password });
      console.log('[SignIn] Success — auth state change will handle navigation');
    } catch (e: unknown) {
      console.log('[SignIn] Error:', e);
    }
  }, [email, password, signIn, resetSignInError]);

  const displayError = localError || signInError;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0a0e14', '#111820', '#0d1117']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[s.crownContainer, { transform: [{ scale: crownScale }] }]}>
              <View style={s.crownCircle}>
                <Crown size={36} color={Colors.gold.bright} />
              </View>
            </Animated.View>
            <Text style={s.title}>REALM OF CROWNS</Text>
            <Text style={s.subtitle}>Enter your credentials to reclaim your throne</Text>
          </Animated.View>

          <Animated.View style={[s.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {displayError && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>{displayError}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.label}>EMAIL</Text>
              <View style={s.inputRow}>
                <Mail size={18} color={Colors.text.dim} />
                <TextInput
                  style={s.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.text.dim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="email-input"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.inputRow}>
                <Lock size={18} color={Colors.text.dim} />
                <TextInput
                  style={s.input}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.text.dim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="password-input"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? <EyeOff size={18} color={Colors.text.dim} /> : <Eye size={18} color={Colors.text.dim} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.signInBtn, signInPending && s.btnDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={signInPending}
              testID="sign-in-button"
            >
              <LinearGradient colors={['#8b6914', '#d4a574', '#8b6914']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGradient}>
                {signInPending ? (
                  <ActivityIndicator size="small" color={Colors.bg.primary} />
                ) : (
                  <>
                    <Text style={s.btnText}>Enter the Realm</Text>
                    <ChevronRight size={20} color={Colors.bg.primary} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={s.switchBtn}
              onPress={() => router.push('/sign-up')}
              activeOpacity={0.7}
              testID="go-to-sign-up"
            >
              <Text style={s.switchText}>New to the realm? </Text>
              <Text style={s.switchTextHighlight}>Create an Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  crownContainer: { marginBottom: 16 },
  crownCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.bg.card,
    borderWidth: 2, borderColor: Colors.gold.dim,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '900' as const, color: Colors.gold.bright, letterSpacing: 3, textAlign: 'center' as const },
  subtitle: { fontSize: 13, color: Colors.text.secondary, textAlign: 'center' as const, marginTop: 8, lineHeight: 19 },
  formSection: { width: '100%' },
  errorBanner: {
    backgroundColor: Colors.crimson.dark + '30',
    borderWidth: 1, borderColor: Colors.crimson.bright + '40',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.crimson.bright, textAlign: 'center' as const },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '700' as const, color: Colors.text.dim, letterSpacing: 1.5, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border.primary,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text.primary },
  signInBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  btnDisabled: { opacity: 0.7 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnText: { fontSize: 17, fontWeight: '800' as const, color: Colors.bg.primary, letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border.primary },
  dividerText: { fontSize: 11, fontWeight: '700' as const, color: Colors.text.dim, letterSpacing: 1 },
  switchBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: Colors.text.secondary },
  switchTextHighlight: { fontSize: 14, fontWeight: '700' as const, color: Colors.gold.primary },
});
