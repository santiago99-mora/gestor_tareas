/** Tiempo límite por defecto para peticiones HTTP (contempla cold starts en Render Free). */
export const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;

/**
 * Obtiene la URL base configurada mediante `EXPO_PUBLIC_API_URL`,
 * eliminando barras finales sobrantes para componer rutas limpias.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://10.0.2.2:8000';
  return raw.replace(/\/+$/, '');
}

/** Indica si el entorno solicita iniciar directamente en modo mock contractual. */
export function getInitialMockMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK?.trim().toLowerCase() === 'true';
}
