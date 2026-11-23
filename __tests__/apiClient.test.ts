import { ApiError, apiRequest, setUnauthorizedHandler } from '../src/services/apiClient';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setUnauthorizedHandler(null);
    jest.restoreAllMocks();
  });

  it('envía encabezado Authorization Bearer y parsea respuesta JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 1, title: 'Demo' }]),
    }) as typeof fetch;

    const result = await apiRequest<{ id: number; title: string }[]>('/api/tasks', {
      method: 'GET',
      token: 'jwt-123',
    });

    expect(result).toEqual([{ id: 1, title: 'Demo' }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks$/),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-123',
        }),
      }),
    );
  });

  it('maneja HTTP 204 No Content sin fallar al parsear JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    }) as typeof fetch;

    const result = await apiRequest<void>('/api/tasks/1', {
      method: 'DELETE',
      token: 'jwt-123',
    });

    expect(result).toBeUndefined();
  });

  it('dispara el callback de sesión expirada al recibir HTTP 401', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ detail: 'Token inválido' }),
    }) as typeof fetch;

    await expect(
      apiRequest('/api/tasks', { method: 'GET', token: 'bad-token' }),
    ).rejects.toMatchObject({
      kind: 'unauthorized',
      status: 401,
    });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('clasifica fallos de conectividad como ApiError de tipo network', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as typeof fetch;

    let caught: unknown;
    try {
      await apiRequest('/api/tasks', { method: 'GET', token: 'jwt-123' });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).kind).toBe('network');
  });
});
