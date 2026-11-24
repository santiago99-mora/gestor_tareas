import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme/theme';

/** Stack de rutas protegidas disponibles solo con sesión autenticada. */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    />
  );
}
