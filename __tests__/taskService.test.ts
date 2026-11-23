import {
  createTask,
  deleteTaskById,
  fetchTasks,
  listTasks,
  updateTaskStatus,
} from '../src/services/taskService';

describe('taskService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fetchTasks retorna una copia de las tareas iniciales en modo mock', async () => {
    const tasks = await fetchTasks(false);

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        completed: expect.any(Boolean),
      }),
    );
  });

  it('fetchTasks lanza error HTTP 503 cuando simulateFailure es true', async () => {
    await expect(fetchTasks(true)).rejects.toThrow(/HTTP 503/);
  });

  it('listTasks consume GET /api/tasks con Bearer y mapea status a completed', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 7,
            user_id: 1,
            title: 'Probar API',
            description: null,
            priority: 'alta',
            status: 'resuelta',
            created_at: '2026-11-23T12:00:00Z',
          },
        ]),
    }) as typeof fetch;

    const tasks = await listTasks('token-abc');
    expect(tasks).toEqual([
      expect.objectContaining({
        id: '7',
        title: 'Probar API',
        description: '',
        priority: 'alta',
        completed: true,
        status: 'resuelta',
      }),
    ]);
  });

  it('createTask, updateTaskStatus y deleteTaskById llaman a los endpoints REST exactos', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () =>
          JSON.stringify({
            id: 12,
            user_id: 1,
            title: 'Nueva',
            description: null,
            priority: 'media',
            status: 'pendiente',
            created_at: '2026-11-23T12:00:00Z',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: 12,
            user_id: 1,
            title: 'Nueva',
            description: null,
            priority: 'media',
            status: 'resuelta',
            created_at: '2026-11-23T12:00:00Z',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      }) as typeof fetch;

    const created = await createTask('token-abc', { title: 'Nueva' });
    expect(created.id).toBe('12');

    const patched = await updateTaskStatus('token-abc', '12', true);
    expect(patched.completed).toBe(true);

    await deleteTaskById('token-abc', '12');

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/api\/tasks\/12\/status$/),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'resuelta' }),
      }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/\/api\/tasks\/12$/),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
