import type { AuthCredentials, AuthTokenResponse, AuthUser } from '../types/auth';
import { apiRequest } from './apiClient';
import { mockContract } from './mockStore';

/** Inicia sesión contra `POST /api/auth/login` o mediante mock contractual. */
export async function loginWithEmail(
  credentials: AuthCredentials,
  useMock = false,
): Promise<AuthTokenResponse> {
  if (useMock) {
    return mockContract.login(credentials);
  }
  return apiRequest<AuthTokenResponse>('/api/auth/login', {
    method: 'POST',
    body: {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    },
    triggerUnauthorizedHook: false,
  });
}

/** Registra una cuenta nueva contra `POST /api/auth/register` o mediante mock contractual. */
export async function registerWithEmail(
  credentials: AuthCredentials,
  useMock = false,
): Promise<AuthTokenResponse> {
  if (useMock) {
    return mockContract.register(credentials);
  }
  return apiRequest<AuthTokenResponse>('/api/auth/register', {
    method: 'POST',
    body: {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    },
    triggerUnauthorizedHook: false,
  });
}

/** Valida el token guardado consultando `GET /api/auth/me`. */
export async function fetchCurrentUser(token: string, useMock = false): Promise<AuthUser> {
  if (useMock) {
    return mockContract.me(token);
  }
  return apiRequest<AuthUser>('/api/auth/me', {
    method: 'GET',
    token,
  });
}
