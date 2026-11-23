import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiBaseUrl } from '../../src/config/env';
import { useAuth } from '../../src/context/AuthContext';
import { listTasks } from '../../src/services/taskService';

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
          <Text style={styles.cardValue}>
            {useMock ? 'Mock contractual local' : 'Servidor FastAPI (smora)'}
          </Text>
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
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { padding: 20, paddingBottom: 40 },
  back: { paddingVertical: 10, minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  backText: { color: '#147D73', fontWeight: '800', fontSize: 14 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#147D73' },
  title: { fontSize: 28, fontWeight: '900', color: '#172743', marginTop: 6, marginBottom: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4EAF2',
    marginBottom: 14,
  },
  cardLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#5A6B82' },
  cardValue: { fontSize: 16, fontWeight: '900', color: '#172743', marginTop: 6 },
  cardSub: { fontSize: 12, color: '#5A6B82', marginTop: 4, lineHeight: 18 },
  secondaryButton: {
    marginTop: 14,
    backgroundColor: '#E5F2EF',
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: '#147D73', fontWeight: '800', fontSize: 13 },
  warnButton: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  warnButtonText: { color: '#92400E', fontWeight: '800', fontSize: 13 },
  guideButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE4F0',
    marginBottom: 12,
  },
  guideButtonText: { color: '#172743', fontWeight: '800', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#A53342',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
