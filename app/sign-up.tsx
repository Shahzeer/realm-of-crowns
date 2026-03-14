import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Mail, Lock, Eye, EyeOff, User, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, signUpPending, signUpError, resetSignUpError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignUp = useCallback(async () => {
    setLocalError(null);
    resetSignUpError();

    if (!email.trim()) { setLocalError('Please enter your email'); return; }
    if (!password.trim()) { setLocalError('Please enter a password'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setLocalError('Passwords do not match'); return; }

    try {
      const result = await signUp({ email: email.trim(), password, displayName: displayName.trim() || undefined });
      console.log('[SignUp] Success:', result);
      if (result.user && !result.session) {
        setSuccess(true);
      }
    } catch (e: unknown) {
      console.log('[SignUp] Error:', e);
    }
  }, [email, password, confirmPassword, displayName, signUp, resetSignUpError]);

  const displayError = localError || signUpError;

  if (success) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#0a0e14', '#111820', '#0d1117']} style={StyleSheet.absoluteFill} />
        <View style={s.successContainer}>
          <Text style={s.successIcon}>📜</Text>
          <Text style={s.successTitle}>Check Your Email</Text>
          <Text style={s.successText}>
            A confirmation link has been sent to {email}. Verify your email to begin your reign.
          </Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.backBtnText}>Return to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0a0e14', '#111820', '#0d1117']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={s.crownCircle}>
              <Crown size={32} color={Colors.gold.bright} />
            </View>
            <Text style={s.title}>FORGE YOUR DYNASTY</Text>
            <Text style={s.subtitle}>Create an account to begin your conquest</Text>
          </Animated.View>

          <Animated.View style={[s.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {displayError && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>{displayError}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.label}>RULER NAME (OPTIONAL)</Text>
              <View style={s.inputRow}>
                <User size={18} color={Colors.text.dim} />
                <TextInput
                  style={s.input}
                  placeholder="Your display name"
                  placeholderTextColor={Colors.text.dim}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  testID="display-name-input"
                />
              </View>
            </View>

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
                  placeholder="Min. 6 characters"
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

            <View style={s.inputGroup}>
              <Text style={s.label}>CONFIRM PASSWORD</Text>
              <View style={s.inputRow}>
                <Lock size={18} color={Colors.text.dim} />
                <TextInput
                  style={s.input}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.text.dim}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  testID="confirm-password-input"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.signUpBtn, signUpPending && s.btnDisabled]}
              onPress={handleSignUp}
              activeOpacity={0.8}
              disabled={signUpPending}
              testID="sign-up-button"
            >
              <LinearGradient colors={['#8b6914', '#d4a574', '#8b6914']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGradient}>
                {signUpPending ? (
                  <ActivityIndicator size="small" color={Colors.bg.primary} />
                ) : (
                  <>
                    <Text style={s.btnText}>Forge Dynasty</Text>
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
              onPress={() => router.back()}
              activeOpacity={0.7}
              testID="go-to-sign-in"
            >
              <Text style={s.switchText}>Already have an account? </Text>
              <Text style={s.switchTextHighlight}>Sign In</Text>
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
  headerSection: { alignItems: 'center', marginBottom: 32 },
  crownCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.bg.card,
    borderWidth: 2, borderColor: Colors.gold.dim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '900' as const, color: Colors.gold.bright, letterSpacing: 2, textAlign: 'center' as const },
  subtitle: { fontSize: 13, color: Colors.text.secondary, textAlign: 'center' as const, marginTop: 8 },
  formSection: { width: '100%' },
  errorBanner: {
    backgroundColor: Colors.crimson.dark + '30',
    borderWidth: 1, borderColor: Colors.crimson.bright + '40',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.crimson.bright, textAlign: 'center' as const },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '700' as const, color: Colors.text.dim, letterSpacing: 1.5, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border.primary,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text.primary },
  signUpBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  btnDisabled: { opacity: 0.7 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnText: { fontSize: 17, fontWeight: '800' as const, color: Colors.bg.primary, letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border.primary },
  dividerText: { fontSize: 11, fontWeight: '700' as const, color: Colors.text.dim, letterSpacing: 1 },
  switchBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: Colors.text.secondary },
  switchTextHighlight: { fontSize: 14, fontWeight: '700' as const, color: Colors.gold.primary },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: { fontSize: 64, marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.gold.bright, marginBottom: 12 },
  successText: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' as const, lineHeight: 22, marginBottom: 32 },
  backBtn: {
    paddingVertical: 14, paddingHorizontal: 32,
    backgroundColor: Colors.bg.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border.gold,
  },
  backBtnText: { fontSize: 15, fontWeight: '700' as const, color: Colors.gold.primary },
});
