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
import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/services/apiClient';
import { COLORS, MONO_FONT, RADII } from '../../src/theme/theme';
import { validateAuthForm } from '../../src/utils/authValidation';

/**
 * Pantalla 2 · Registro de nueva cuenta.
 * Ejecuta `POST /api/auth/register` y guarda el token emitido en `expo-secure-store`.
 */
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'confirm' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    const validationError = validateAuthForm(email, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signUp({ email, password });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('No se pudo completar el registro. Intentá otra vez.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Text style={styles.eyebrow}>NUEVA CUENTA</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>JWT SYNC</Text>
            </View>
          </View>
          <Text style={styles.title}>Registrarse</Text>
          <Text style={styles.subtitle}>
            Creá tu usuario personal para administrar tus propias tareas en la nube.
          </Text>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              testID="register-email-input"
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
            <TextInput
              testID="register-password-input"
              accessibilityLabel="Contraseña"
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
            />

            <Text style={[styles.label, styles.fieldSpacing]}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput
              testID="register-confirm-input"
              accessibilityLabel="Confirmar contraseña"
              placeholder="Repetí tu contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="done"
              onSubmitEditing={() => void handleRegister()}
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
            />

            <Pressable
              testID="register-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Crear cuenta"
              disabled={submitting}
              onPress={() => void handleRegister()}
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.accentDarkInk} />
              ) : (
                <Text style={styles.primaryButtonText}>Crear cuenta  →</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerLinks}>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="button" style={styles.outlineButton}>
                <Text style={styles.outlineButtonText}>← Ya tengo cuenta, ir a Login</Text>
              </Pressable>
            </Link>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: MONO_FONT,
    letterSpacing: 1.6,
    color: COLORS.accent,
  },
  brandBadge: {
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.badge,
  },
  brandBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    fontFamily: MONO_FONT,
  },
  title: { fontSize: 30, fontWeight: '900', color: COLORS.textPrimary, marginTop: 8 },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
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
  footerLinks: { alignItems: 'center', marginTop: 20 },
  outlineButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  outlineButtonText: { color: COLORS.accent, fontWeight: '800', fontSize: 13 },
});
