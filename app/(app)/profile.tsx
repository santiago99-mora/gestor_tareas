import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiBaseUrl } from '../../src/config/env';
import { useAuth } from '../../src/context/AuthContext';
import { listTasks } from '../../src/services/taskService';
import { COLORS, MONO_FONT, RADII } from '../../src/theme/theme';

/**
 * Pantalla 6 · Perfil de usuario, diagnóstico de sesión/API y cierre de sesión (`logout`).
 */
export default function ProfileScreen() {
  const { user, token, useMock, setUseMock, signOut } = useAuth();
  const [testing401, setTesting401] = useState(false);

  async function handleSimulate401() {
    if (!token) return;
    setTesting401(true);
    try {
      await listTasks(token, { useMock: false, simulateError: 'unauthorized' });
    } catch {
      // El interceptor de apiClient ejecuta signOut ante HTTP 401 si el backend está activo.
      // En modo mock forzamos el mismo comportamiento para demostración en defensa.
      if (useMock) {
        await signOut('Tu sesión expiró (HTTP 401 simulado). Iniciá sesión nuevamente.');
      }
    } finally {
      setTesting401(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al tablero"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>← Volver al tablero</Text>
        </Pressable>

        <Text style={styles.eyebrow}>CUENTA Y ENTORNO</Text>
        <Text style={styles.title}>Perfil y sesión</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>USUARIO AUTENTICADO</Text>
          <Text style={styles.cardValue}>{user?.email ?? 'Sesión activa'}</Text>
          <Text style={styles.cardSub}>
            ID de cuenta: {user?.id ?? '—'} · Token protegido con SecureStore
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>CONEXIÓN CON BACKEND</Text>
          <View style={styles.connRow}>
            <View style={[styles.liveDot, useMock && styles.mockDot]} />
            <Text style={styles.cardValue}>
              {useMock ? 'Mock contractual local' : 'Servidor FastAPI (smora)'}
            </Text>
          </View>
          <Text style={styles.cardSub}>URL configurada: {getApiBaseUrl()}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alternar entre servidor real y mock contractual"
            onPress={() => void setUseMock(!useMock)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {useMock ? 'Conectar al servidor real' : 'Cambiar a mock contractual'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Probar expiración de sesión HTTP 401"
            disabled={testing401}
            onPress={() => void handleSimulate401()}
            style={styles.warnButton}
          >
            <Text style={styles.warnButtonText}>
              {testing401 ? 'Verificando…' : 'Probar cierre automático 401'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir guía del taller"
          onPress={() => router.push('/guia')}
          style={styles.guideButton}
        >
          <Text style={styles.guideButtonText}>Ver guía del proyecto ↗</Text>
        </Pressable>

        <Pressable
          testID="logout-button"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={() => void signOut()}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  back: { paddingVertical: 10, minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  backText: { color: COLORS.accent, fontWeight: '800', fontSize: 13, fontFamily: MONO_FONT },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    letterSpacing: 1.5,
    color: COLORS.accent,
  },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginTop: 6, marginBottom: 18 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    letterSpacing: 1.1,
    color: COLORS.textMuted,
  },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  mockDot: { backgroundColor: COLORS.warningText },
  cardValue: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, marginTop: 4 },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  secondaryButton: {
    marginTop: 14,
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: COLORS.accent, fontWeight: '800', fontSize: 13 },
  warnButton: {
    marginTop: 10,
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: RADII.control,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  warnButtonText: { color: COLORS.warningText, fontWeight: '800', fontSize: 13 },
  guideButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    marginBottom: 12,
  },
  guideButtonText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 },
  logoutButton: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADII.control,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: { color: COLORS.dangerText, fontWeight: '900', fontSize: 15 },
});
