import type {
  ApiTask,
  ApiTaskStatus,
  CreateTaskPayload,
  Task,
  UpdateTaskPayload,
} from '../types/task';
import { ApiError, apiRequest } from './apiClient';
import { mockContract } from './mockStore';

export type ServiceRequestOptions = {
  useMock?: boolean;
  signal?: AbortSignal;
  simulateError?: 'server' | 'offline' | 'unauthorized';
};

/** Convierte una tarea del esquema REST (`smora`) al modelo usado por la UI móvil. */
export function mapApiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: String(apiTask.id),
    title: apiTask.title,
    description: apiTask.description ?? '',
    priority: apiTask.priority ?? 'media',
    completed: apiTask.status === 'resuelta',
    status: apiTask.status,
    createdAt: apiTask.created_at,
  };
}

/** Obtiene las tareas del usuario autenticado vía `GET /api/tasks`. */
export async function listTasks(
  token: string,
  options: ServiceRequestOptions = {},
): Promise<Task[]> {
  const { useMock = false, signal, simulateError } = options;

  if (simulateError) {
    if (simulateError === 'unauthorized' && !useMock) {
      // Dispara el flujo estándar de 401 sobre el cliente HTTP para pruebas de defensa
      return apiRequest<Task[]>('/api/tasks', {
        method: 'GET',
        token: 'token-expirado-simulado',
        signal,
      }).catch((err) => {
        throw err;
      });
    }
    const simulated = await mockContract.listTasks(token, simulateError);
    return simulated.map(mapApiTaskToTask);
  }

  if (useMock) {
    const records = await mockContract.listTasks(token);
    return records.map(mapApiTaskToTask);
  }

  const records = await apiRequest<ApiTask[]>('/api/tasks', {
    method: 'GET',
    token,
    signal,
  });
  return records.map(mapApiTaskToTask);
}

/** Obtiene el detalle de una tarea puntual vía `GET /api/tasks/:id`. */
export async function getTaskById(
  token: string,
  id: string,
  options: ServiceRequestOptions = {},
): Promise<Task> {
  const { useMock = false, signal } = options;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    throw new ApiError('not_found', 'Identificador de tarea inválido.', 404);
  }

  if (useMock) {
    const record = await mockContract.getTask(token, numericId);
    return mapApiTaskToTask(record);
  }

  const record = await apiRequest<ApiTask>(`/api/tasks/${numericId}`, {
    method: 'GET',
    token,
    signal,
  });
  return mapApiTaskToTask(record);
}

/** Crea una tarea nueva mediante `POST /api/tasks`. */
export async function createTask(
  token: string,
  payload: CreateTaskPayload,
  options: ServiceRequestOptions = {},
): Promise<Task> {
  const { useMock = false } = options;
  if (useMock) {
    const record = await mockContract.createTask(token, payload);
    return mapApiTaskToTask(record);
  }

  const record = await apiRequest<ApiTask>('/api/tasks', {
    method: 'POST',
    token,
    body: {
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      priority: payload.priority ?? 'media',
    },
  });
  return mapApiTaskToTask(record);
}

/** Actualiza los datos completos de una tarea vía `PUT /api/tasks/:id`. */
export async function updateTask(
  token: string,
  id: string,
  payload: UpdateTaskPayload,
  options: ServiceRequestOptions = {},
): Promise<Task> {
  const { useMock = false } = options;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    throw new ApiError('not_found', 'Identificador de tarea inválido.', 404);
  }

  if (useMock) {
    const record = await mockContract.updateTask(token, numericId, payload);
    return mapApiTaskToTask(record);
  }

  const record = await apiRequest<ApiTask>(`/api/tasks/${numericId}`, {
    method: 'PUT',
    token,
    body: {
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      priority: payload.priority,
      status: payload.status,
    },
  });
  return mapApiTaskToTask(record);
}

/** Alterna el estado (`pendiente` / `resuelta`) vía `PATCH /api/tasks/:id/status`. */
export async function updateTaskStatus(
  token: string,
  id: string,
  completed: boolean,
  options: ServiceRequestOptions = {},
): Promise<Task> {
  const { useMock = false } = options;
  const numericId = Number(id);
  const nextStatus: ApiTaskStatus = completed ? 'resuelta' : 'pendiente';

  if (Number.isNaN(numericId)) {
    throw new ApiError('not_found', 'Identificador de tarea inválido.', 404);
  }

  if (useMock) {
    const record = await mockContract.updateStatus(token, numericId, nextStatus);
    return mapApiTaskToTask(record);
  }

  const record = await apiRequest<ApiTask>(`/api/tasks/${numericId}/status`, {
    method: 'PATCH',
    token,
    body: { status: nextStatus },
  });
  return mapApiTaskToTask(record);
}

/** Elimina una tarea del usuario vía `DELETE /api/tasks/:id`. */
export async function deleteTaskById(
  token: string,
  id: string,
  options: ServiceRequestOptions = {},
): Promise<void> {
  const { useMock = false } = options;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    throw new ApiError('not_found', 'Identificador de tarea inválido.', 404);
  }

  if (useMock) {
    await mockContract.deleteTask(token, numericId);
    return;
  }

  await apiRequest<void>(`/api/tasks/${numericId}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Compatibilidad con pruebas unitarias base del servicio mock sin sesión.
 * @deprecated Usar `listTasks(token, { useMock })` en las pantallas autenticadas.
 */
export async function fetchTasks(simulateFailure = false): Promise<Task[]> {
  const records = await mockContract.listTasks(
    'mock-jwt-user-1',
    simulateFailure ? 'server' : undefined,
  );
  return records.map(mapApiTaskToTask);
}
