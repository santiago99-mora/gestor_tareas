import type { AuthCredentials, AuthTokenResponse, AuthUser } from '../types/auth';
import type { ApiTask, ApiTaskStatus, CreateTaskPayload, UpdateTaskPayload } from '../types/task';
import { ApiError } from './apiClient';

type MockAccount = {
  user: AuthUser;
  password: string;
};

const DEMO_USER: AuthUser = {
  id: 1,
  email: 'demo@gestortareas.app',
  created_at: '2026-11-23T12:00:00.000Z',
};

let accounts: MockAccount[] = [{ user: DEMO_USER, password: 'Demo1234!' }];
let nextUserId = 2;
let nextTaskId = 6;

let mockTasks: ApiTask[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Validar login JWT',
    description: 'Comprobar campos vacíos, credenciales incorrectas y guardado en SecureStore.',
    priority: 'alta',
    status: 'pendiente',
    created_at: '2026-11-23T12:00:00.000Z',
  },
  {
    id: 2,
    user_id: 1,
    title: 'Corregir navegación protegida',
    description: 'Validar redirección cuando no hay sesión y regreso desde el detalle.',
    priority: 'media',
    status: 'resuelta',
    created_at: '2026-11-23T12:05:00.000Z',
  },
  {
    id: 3,
    user_id: 1,
    title: 'Probar API lenta y reconexión',
    description: 'Verificar estados de carga, vacío, error HTTP, sin conexión y reintento.',
    priority: 'alta',
    status: 'pendiente',
    created_at: '2026-11-23T12:10:00.000Z',
  },
  {
    id: 4,
    user_id: 1,
    title: 'Generar reporte de incidencias',
    description: 'Documentar fallos, causa raíz, pruebas de regresión y uso responsable de IA.',
    priority: 'baja',
    status: 'pendiente',
    created_at: '2026-11-23T12:15:00.000Z',
  },
  {
    id: 5,
    user_id: 1,
    title: 'Compilar APK en perfil preview',
    description: 'Generar APK individual con EAS Build y probarla en dispositivo Android.',
    priority: 'media',
    status: 'resuelta',
    created_at: '2026-11-23T12:20:00.000Z',
  },
];

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tokenForUser(userId: number): string {
  return `mock-jwt-user-${userId}`;
}

function userFromToken(token: string | null): AuthUser {
  if (!token || !token.startsWith('mock-jwt-user-')) {
    throw new ApiError('unauthorized', 'Sesión mock expirada o inválida.', 401);
  }
  const id = Number(token.replace('mock-jwt-user-', ''));
  const found = accounts.find((acc) => acc.user.id === id);
  if (!found) {
    throw new ApiError('unauthorized', 'Usuario de sesión no encontrado.', 401);
  }
  return found.user;
}

/** Implementación mock contractual compatible 1:1 con los endpoints de `smora`. */
export const mockContract = {
  async login(credentials: AuthCredentials): Promise<AuthTokenResponse> {
    await delay();
    const email = credentials.email.trim().toLowerCase();
    const found = accounts.find(
      (acc) => acc.user.email === email && acc.password === credentials.password,
    );
    if (!found) {
      throw new ApiError('unauthorized', 'Correo o contraseña incorrectos.', 401);
    }
    return {
      access_token: tokenForUser(found.user.id),
      token_type: 'bearer',
      user: found.user,
    };
  },

  async register(credentials: AuthCredentials): Promise<AuthTokenResponse> {
    await delay();
    const email = credentials.email.trim().toLowerCase();
    if (accounts.some((acc) => acc.user.email === email)) {
      throw new ApiError('conflict', 'Ya existe una cuenta registrada con ese correo.', 409);
    }
    const user: AuthUser = {
      id: nextUserId++,
      email,
      created_at: new Date().toISOString(),
    };
    accounts.push({ user, password: credentials.password });
    return {
      access_token: tokenForUser(user.id),
      token_type: 'bearer',
      user,
    };
  },

  async me(token: string): Promise<AuthUser> {
    await delay(150);
    return userFromToken(token);
  },

  async listTasks(token: string, simulateMode?: 'server' | 'offline' | 'unauthorized'): Promise<ApiTask[]> {
    await delay(400);
    if (simulateMode === 'offline') {
      throw new ApiError(
        'network',
        'Sin conexión con el servidor (simulado). Verificá tu red e intentá nuevamente.',
      );
    }
    if (simulateMode === 'server') {
      throw new ApiError(
        'server',
        'HTTP 503: servidor temporalmente indisponible (simulado)',
        503,
      );
    }
    if (simulateMode === 'unauthorized') {
      throw new ApiError('unauthorized', 'Sesión expirada (HTTP 401 simulado).', 401);
    }
    const user = userFromToken(token);
    return mockTasks
      .filter((task) => task.user_id === user.id)
      .map((task) => ({ ...task }));
  },

  async getTask(token: string, taskId: number): Promise<ApiTask> {
    await delay(200);
    const user = userFromToken(token);
    const found = mockTasks.find((task) => task.id === taskId && task.user_id === user.id);
    if (!found) {
      throw new ApiError('not_found', 'Tarea no encontrada.', 404);
    }
    return { ...found };
  },

  async createTask(token: string, payload: CreateTaskPayload): Promise<ApiTask> {
    await delay(250);
    const user = userFromToken(token);
    const created: ApiTask = {
      id: nextTaskId++,
      user_id: user.id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      priority: payload.priority ?? 'media',
      status: 'pendiente',
      created_at: new Date().toISOString(),
    };
    mockTasks = [created, ...mockTasks];
    return { ...created };
  },

  async updateTask(token: string, taskId: number, payload: UpdateTaskPayload): Promise<ApiTask> {
    await delay(250);
    const user = userFromToken(token);
    const index = mockTasks.findIndex((task) => task.id === taskId && task.user_id === user.id);
    if (index === -1) {
      throw new ApiError('not_found', 'Tarea no encontrada.', 404);
    }
    const updated: ApiTask = {
      ...mockTasks[index],
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      priority: payload.priority,
      status: payload.status,
    };
    mockTasks[index] = updated;
    return { ...updated };
  },

  async updateStatus(token: string, taskId: number, status: ApiTaskStatus): Promise<ApiTask> {
    await delay(200);
    const user = userFromToken(token);
    const index = mockTasks.findIndex((task) => task.id === taskId && task.user_id === user.id);
    if (index === -1) {
      throw new ApiError('not_found', 'Tarea no encontrada.', 404);
    }
    const updated: ApiTask = { ...mockTasks[index], status };
    mockTasks[index] = updated;
    return { ...updated };
  },

  async deleteTask(token: string, taskId: number): Promise<void> {
    await delay(200);
    const user = userFromToken(token);
    const exists = mockTasks.some((task) => task.id === taskId && task.user_id === user.id);
    if (!exists) {
      throw new ApiError('not_found', 'Tarea no encontrada.', 404);
    }
    mockTasks = mockTasks.filter((task) => !(task.id === taskId && task.user_id === user.id));
  },
};
