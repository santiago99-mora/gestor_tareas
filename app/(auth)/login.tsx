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
          <Text style={styles.eyebrow}>EDI · REACT NATIVE 2026</Text>
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
              placeholderTextColor="#8B98AD"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            <Text style={[styles.label, styles.fieldSpacing]}>CONTRASEÑA</Text>
            <View style={styles.passwordRow}>
              <TextInput
                testID="login-password-input"
                accessibilityLabel="Contraseña"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#8B98AD"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
                style={styles.passwordInput}
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Ingresar</Text>
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
              <Pressable accessibilityRole="button" style={styles.linkButton}>
                <Text style={styles.linkText}>Crear cuenta nueva →</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.envCard}>
            <Text style={styles.envTitle}>
              Modo actual: {useMock ? 'Mock contractual local' : 'API FastAPI'}
            </Text>
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
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#147D73' },
  title: { fontSize: 30, fontWeight: '900', color: '#172743', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#5A6B82', marginTop: 6, marginBottom: 20, lineHeight: 20 },
  noticeBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  noticeText: { color: '#92400E', fontSize: 13, fontWeight: '700' },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F2C6CC',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { color: '#A53342', fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4EAF2',
  },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: '#384E6D', marginBottom: 8 },
  fieldSpacing: { marginTop: 14 },
  input: {
    backgroundColor: '#F9FBFD',
    borderWidth: 1,
    borderColor: '#DCE4F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#172743',
    minHeight: 46,
  },
  passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  passwordInput: {
    flex: 1,
    backgroundColor: '#F9FBFD',
    borderWidth: 1,
    borderColor: '#DCE4F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#172743',
    minHeight: 46,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#E7ECF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: { color: '#172743', fontWeight: '800', fontSize: 12 },
  primaryButton: {
    backgroundColor: '#147D73',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  secondaryButton: {
    backgroundColor: '#E5F2EF',
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: { color: '#147D73', fontWeight: '800', fontSize: 13 },
  footerLinks: { alignItems: 'center', marginTop: 20, gap: 6 },
  footerHint: { color: '#5A6B82', fontSize: 13 },
  linkButton: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#172743', fontWeight: '900', fontSize: 14 },
  envCard: {
    marginTop: 18,
    backgroundColor: '#EEF2F8',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  envTitle: { fontSize: 12, fontWeight: '800', color: '#172743' },
  envUrl: { fontSize: 11, color: '#5A6B82' },
  modeButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  modeButtonText: { fontSize: 12, fontWeight: '800', color: '#147D73' },
});
