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
          <Text style={styles.eyebrow}>NUEVA CUENTA</Text>
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
              placeholderTextColor="#8B98AD"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            <Text style={[styles.label, styles.fieldSpacing]}>CONTRASEÑA</Text>
            <TextInput
              testID="register-password-input"
              accessibilityLabel="Contraseña"
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#8B98AD"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <Text style={[styles.label, styles.fieldSpacing]}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput
              testID="register-confirm-input"
              accessibilityLabel="Confirmar contraseña"
              placeholder="Repetí tu contraseña"
              placeholderTextColor="#8B98AD"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={() => void handleRegister()}
              style={styles.input}
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerLinks}>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="button" style={styles.linkButton}>
                <Text style={styles.linkText}>← Ya tengo cuenta, ir a Login</Text>
              </Pressable>
            </Link>
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
  primaryButton: {
    backgroundColor: '#172743',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  footerLinks: { alignItems: 'center', marginTop: 20 },
  linkButton: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#147D73', fontWeight: '900', fontSize: 14 },
});
