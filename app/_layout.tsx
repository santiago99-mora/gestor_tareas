import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootNavigator() {
  const { token, isRestoring } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isRestoring) return;
    const first = segments[0];
    const inAuthGroup = first === '(auth)';
    const inGuide = first === 'guia';
    const isRoot = !first;

    if (!token && !inAuthGroup && !inGuide && !isRoot) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(app)/tasks');
    }
  }, [token, isRestoring, segments, router]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
      {isRestoring ? (
        <View style={styles.restoringOverlay}>
          <ActivityIndicator size="large" color="#147D73" />
          <Text style={styles.restoringText}>Restaurando sesión segura…</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Layout raíz con `SafeAreaProvider`, `AuthProvider` y protección global de rutas. */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  restoringOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  restoringText: { color: '#4B5A75', fontSize: 13, fontWeight: '700' },
});
