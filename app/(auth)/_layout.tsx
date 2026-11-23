import { Stack } from 'expo-router';

/** Stack de rutas públicas de autenticación (Login y Registro). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
