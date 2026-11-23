/** Prioridad visual de cada tarea. */
export type TaskPriority = 'alta' | 'media' | 'baja';

/** Filtros de estado disponibles en las pestañas del tablero. */
export type TaskStatus = 'todas' | 'pendientes' | 'completadas';

/** Estados persistidos en el backend FastAPI (`tasks.status`). */
export type ApiTaskStatus = 'pendiente' | 'resuelta';

/** Estructura cruda devuelta por el backend `/api/tasks`. */
export type ApiTask = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: ApiTaskStatus;
  created_at: string;
};

/** Modelo de tarea normalizado para la interfaz móvil. */
export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  completed: boolean;
  status?: ApiTaskStatus;
  createdAt?: string;
};

/** Payload para crear una tarea desde la app. */
export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
};

/** Payload para actualizar completamente una tarea existente. */
export type UpdateTaskPayload = {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: ApiTaskStatus;
};
