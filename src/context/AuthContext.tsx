import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getInitialMockMode } from '../config/env';
import { ApiError, setUnauthorizedHandler } from '../services/apiClient';
import { fetchCurrentUser, loginWithEmail, registerWithEmail } from '../services/authService';
import { clearSessionData, restoreSessionData, saveSessionData } from '../services/tokenStorage';
import type { AuthCredentials, AuthUser } from '../types/auth';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isRestoring: boolean;
  useMock: boolean;
  sessionNotice: string | null;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
  signOut: (notice?: string | null) => Promise<void>;
  setUseMock: (enabled: boolean) => Promise<void>;
  clearSessionNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Proveedor global de autenticación y sesión.
 * Restaura el JWT desde `expo-secure-store`, valida la sesión activa y expone
 * el cierre automático ante respuestas HTTP 401.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [useMock, setUseMockState] = useState<boolean>(getInitialMockMode);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const signOut = useCallback(async (notice: string | null = null) => {
    await clearSessionData();
    setToken(null);
    setUser(null);
    setSessionNotice(notice);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut('Tu sesión expiró (HTTP 401). Iniciá sesión nuevamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const stored = await restoreSessionData();
        if (!stored.token) {
          return;
        }
        const isMockToken = stored.token.startsWith('mock-jwt-user-');
        if (isMockToken) {
          if (active) {
            setUseMockState(true);
            setToken(stored.token);
            setUser(stored.user);
          }
          return;
        }

        if (active) {
          setToken(stored.token);
          setUser(stored.user);
        }

        try {
          const verifiedUser = await fetchCurrentUser(stored.token, false);
          if (active) {
            setUser(verifiedUser);
            await saveSessionData(stored.token, verifiedUser);
          }
        } catch (err) {
          if (err instanceof ApiError && err.kind === 'unauthorized') {
            if (active) {
              await signOut('Tu sesión anterior ya no es válida. Volvé a ingresar.');
            }
          }
          // Si falló por red al abrir offline, se mantiene la sesión restaurada hasta reintentar
        }
      } finally {
        if (active) {
          setIsRestoring(false);
        }
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, [signOut]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      setSessionNotice(null);
      const response = await loginWithEmail(credentials, useMock);
      await saveSessionData(response.access_token, response.user);
      setToken(response.access_token);
      setUser(response.user);
    },
    [useMock],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials) => {
      setSessionNotice(null);
      const response = await registerWithEmail(credentials, useMock);
      await saveSessionData(response.access_token, response.user);
      setToken(response.access_token);
      setUser(response.user);
    },
    [useMock],
  );

  const setUseMock = useCallback(
    async (enabled: boolean) => {
      setUseMockState(enabled);
      await signOut(
        enabled
          ? 'Modo mock contractual activado. Iniciá sesión con la cuenta demo o registrá una.'
          : 'Modo servidor real activado. Iniciá sesión contra tu API FastAPI.',
      );
    },
    [signOut],
  );

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isRestoring,
        useMock,
        sessionNotice,
        signIn,
        signUp,
        signOut,
        setUseMock,
        clearSessionNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el estado de autenticación desde pantallas y componentes. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return ctx;
}
