/** Usuario autenticado devuelto por la API REST (`/api/auth/*`). */
export type AuthUser = {
  id: number;
  email: string;
  created_at: string;
};

/** Credenciales enviadas en login y registro. */
export type AuthCredentials = {
  email: string;
  password: string;
};

/** Respuesta estándar del backend al autenticar o registrar. */
export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};
