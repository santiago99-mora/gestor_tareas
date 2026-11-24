import { useState } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getApiBaseUrl } from '../../src/config/env';
import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/services/apiClient';
import { COLORS, MONO_FONT, RADII } from '../../src/theme/theme';
import { validateAuthForm } from '../../src/utils/authValidation';

/**
 * Pantalla 1 · Inicio de sesión.
 * Valida credenciales, realiza `POST /api/auth/login`, almacena el JWT en
 * `expo-secure-store` mediante `AuthContext` y muestra avisos ante errores 401 o de red.
 */
export default function LoginScreen() {
  const { signIn, useMock, setUseMock, sessionNotice, clearSessionNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    clearSessionNotice();
    const validationError = validateAuthForm(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn({ email, password });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('No se pudo iniciar sesión. Intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemoCredentials() {
    setEmail('demo@gestortareas.app');
    setPassword('Demo1234!');
    setError(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>GESTOR TAREAS</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>EDI 2026</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>ACCESO AL SISTEMA</Text>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>
            Accedé a tus tareas sincronizadas con autenticación JWT segura.
          </Text>

          {sessionNotice ? (
            <View accessibilityRole="alert" style={styles.noticeBox}>
              <Text style={styles.noticeText}>{sessionNotice}</Text>
            </View>
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              testID="login-email-input"
              accessibilityLabel="Correo electrónico"
              placeholder="usuario@correo.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
            />

            <Text style={[styles.label, styles.fieldSpacing]}>CONTRASEÑA</Text>
            <View style={styles.passwordRow}>
              <TextInput
                testID="login-password-input"
                accessibilityLabel="Contraseña"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
                style={[styles.passwordInput, focusedField === 'password' && styles.inputFocused]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
              </Pressable>
            </View>

            <Pressable
              testID="login-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Ingresar a mi cuenta"
              disabled={submitting}
              onPress={() => void handleSubmit()}
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.accentDarkInk} />
              ) : (
                <Text style={styles.primaryButtonText}>Ingresar  →</Text>
              )}
            </Pressable>

            <Pressable
              testID="login-demo-button"
              accessibilityRole="button"
              accessibilityLabel="Completar credenciales de demostración"
              onPress={fillDemoCredentials}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cargar usuario demo</Text>
            </Pressable>
          </View>

          <View style={styles.footerLinks}>
            <Text style={styles.footerHint}>¿Todavía no tenés cuenta?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable accessibilityRole="button" style={styles.outlineButton}>
                <Text style={styles.outlineButtonText}>Crear cuenta nueva  →</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.envCard}>
            <View style={styles.envHeader}>
              <View style={[styles.statusDot, !useMock && styles.statusDotLive]} />
              <Text style={styles.envTitle}>
                Modo actual: {useMock ? 'Mock contractual local' : 'API FastAPI'}
              </Text>
            </View>
            <Text style={styles.envUrl}>
              {useMock ? 'Simulación local compatible 1:1 con smora' : getApiBaseUrl()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar entre servidor real y mock local"
              onPress={() => void setUseMock(!useMock)}
              style={styles.modeButton}
            >
              <Text style={styles.modeButtonText}>
                {useMock ? 'Cambiar a servidor real' : 'Usar modo mock sin servidor'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: MONO_FONT,
    letterSpacing: 1.8,
    color: COLORS.accent,
  },
  brandBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.badge,
  },
  brandBadgeText: {
    color: COLORS.accentDarkInk,
    fontSize: 10,
    fontWeight: '900',
    fontFamily: MONO_FONT,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: MONO_FONT,
    letterSpacing: 1.6,
    color: COLORS.textSecondary,
  },
  title: { fontSize: 30, fontWeight: '900', color: COLORS.textPrimary, marginTop: 6 },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  noticeBox: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: RADII.control,
    marginBottom: 14,
  },
  noticeText: { color: COLORS.warningText, fontSize: 13, fontWeight: '700' },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: RADII.control,
    marginBottom: 14,
  },
  errorText: { color: COLORS.dangerText, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: MONO_FONT,
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  fieldSpacing: { marginTop: 14 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 46,
  },
  inputFocused: { borderColor: COLORS.accent },
  passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  passwordInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 46,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    minHeight: 46,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 12 },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.control,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: COLORS.accentDarkInk, fontWeight: '900', fontSize: 15 },
  secondaryButton: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: { color: COLORS.textSecondary, fontWeight: '800', fontSize: 13 },
  footerLinks: { alignItems: 'center', marginTop: 20, gap: 10 },
  footerHint: { color: COLORS.textMuted, fontSize: 12 },
  outlineButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentTint,
    borderRadius: RADII.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  outlineButtonText: { color: COLORS.accent, fontWeight: '800', fontSize: 13 },
  envCard: {
    marginTop: 18,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.card,
    padding: 14,
    gap: 6,
  },
  envHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warningText,
  },
  statusDotLive: { backgroundColor: COLORS.accent },
  envTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  envUrl: { fontSize: 11, color: COLORS.textMuted, fontFamily: MONO_FONT },
  modeButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    minHeight: 38,
    justifyContent: 'center',
  },
  modeButtonText: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
});
