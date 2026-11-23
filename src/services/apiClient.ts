import { DEFAULT_REQUEST_TIMEOUT_MS, getApiBaseUrl } from '../config/env';

/** Categorías de fallo contempladas por la interfaz móvil. */
export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'server'
  | 'unknown';

/** Error tipado emitido por el cliente REST para distinguir fallos de red, contrato o sesión. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registra un callback global para cerrar sesión automáticamente ante respuestas HTTP 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  triggerUnauthorizedHook?: boolean;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown };
    if (typeof first?.msg === 'string') {
      return first.msg;
    }
  }
  return fallback;
}

function classifyHttpStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Ejecuta una petición HTTP JSON contra la API configurada con soporte de timeout,
 * cancelación (`AbortSignal`), cabecera `Authorization` y manejo de respuestas `204` y `401`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    signal,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    triggerUnauthorizedHook = true,
  } = options;

  const controller = new AbortController();
  let timedOut = false;

  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', forwardAbort);
    }
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const rawText = await response.text();
    let parsed: unknown = null;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      const kind = classifyHttpStatus(response.status);
      const fallbackMsg =
        response.status === 401
          ? 'Tu sesión expiró o las credenciales son incorrectas.'
          : `Error HTTP ${response.status} al comunicarse con el servidor.`;
      const message = extractErrorMessage(parsed, fallbackMsg);

      if (response.status === 401 && triggerUnauthorizedHook && unauthorizedHandler) {
        unauthorizedHandler();
      }

      throw new ApiError(kind, message, response.status);
    }

    return parsed as T;
  } catch (caught) {
    if (caught instanceof ApiError) {
      throw caught;
    }
    if (timedOut) {
      throw new ApiError(
        'timeout',
        'El servidor tardó demasiado en responder. Verificá tu conexión e intentá nuevamente.',
      );
    }
    if (caught instanceof Error && caught.name === 'AbortError') {
      throw caught;
    }
    throw new ApiError(
      'network',
      'Sin conexión con el servidor. Comprobá tu red o activá el modo mock en Perfil.',
    );
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', forwardAbort);
    }
  }
}
