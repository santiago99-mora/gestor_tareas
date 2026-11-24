import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/theme/theme';

/**
 * Ruta raíz (`/`) que resuelve la pantalla inicial según el estado de sesión.
 */
export default function IndexRedirect() {
  const { token, isRestoring } = useAuth();

  if (isRestoring) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  }

  return <Redirect href={token ? '/(app)/tasks' : '/(auth)/login'} />;
}
