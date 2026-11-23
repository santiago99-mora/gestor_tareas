import { Stack } from 'expo-router';

/** Stack de rutas protegidas disponibles solo con sesión autenticada. */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
