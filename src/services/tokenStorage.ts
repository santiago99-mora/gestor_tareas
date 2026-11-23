import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'gestor_tareas_jwt_token';
const USER_KEY = 'gestor_tareas_auth_user';

let memoryToken: string | null = null;
let memoryUser: string | null = null;

async function writeSecureValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (key === TOKEN_KEY) memoryToken = value;
    if (key === USER_KEY) memoryUser = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function readSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (key === TOKEN_KEY) return memoryToken;
    if (key === USER_KEY) return memoryUser;
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function removeSecureValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (key === TOKEN_KEY) memoryToken = null;
    if (key === USER_KEY) memoryUser = null;
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** Guarda el token JWT y la ficha mínima del usuario en almacenamiento seguro. */
export async function saveSessionData(token: string, user: AuthUser): Promise<void> {
  await Promise.all([
    writeSecureValue(TOKEN_KEY, token),
    writeSecureValue(USER_KEY, JSON.stringify(user)),
  ]);
}

/** Recupera el token JWT y el usuario almacenado en `expo-secure-store`. */
export async function restoreSessionData(): Promise<{
  token: string | null;
  user: AuthUser | null;
}> {
  const [token, rawUser] = await Promise.all([
    readSecureValue(TOKEN_KEY),
    readSecureValue(USER_KEY),
  ]);

  if (!token) {
    return { token: null, user: null };
  }

  let parsedUser: AuthUser | null = null;
  if (rawUser) {
    try {
      parsedUser = JSON.parse(rawUser) as AuthUser;
    } catch {
      parsedUser = null;
    }
  }
  return { token, user: parsedUser };
}

/** Elimina el token JWT y los datos de sesión almacenados. */
export async function clearSessionData(): Promise<void> {
  await Promise.all([
    removeSecureValue(TOKEN_KEY),
    removeSecureValue(USER_KEY),
  ]);
}
