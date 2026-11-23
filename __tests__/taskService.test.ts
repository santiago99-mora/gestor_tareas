import { fetchTasks } from '../src/services/taskService';

describe('fetchTasks', () => {
  it('retorna una copia de las tareas iniciales cuando no hay falla', async () => {
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

  it('lanza error HTTP 503 cuando simulateFailure es true', async () => {
    await expect(fetchTasks(true)).rejects.toThrow(/HTTP 503/);
  });
});
