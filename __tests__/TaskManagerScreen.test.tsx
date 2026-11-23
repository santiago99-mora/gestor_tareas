import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TaskManagerScreen from '../app/(app)/tasks';
import * as AuthContextModule from '../src/context/AuthContext';
import { ApiError } from '../src/services/apiClient';
import * as taskService from '../src/services/taskService';
import type { Task } from '../src/types/task';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Validar login',
    description: 'Comprobar campos vacíos.',
    priority: 'alta',
    completed: false,
    status: 'pendiente',
  },
  {
    id: '2',
    title: 'Corregir navegación',
    description: 'Validar el regreso desde el detalle.',
    priority: 'media',
    completed: true,
    status: 'resuelta',
  },
];

describe('TaskManagerScreen', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      token: 'mock-jwt-user-1',
      user: { id: 1, email: 'demo@gestortareas.app', created_at: '2026-11-23T12:00:00Z' },
      isRestoring: false,
      useMock: true,
      sessionNotice: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUseMock: jest.fn(),
      clearSessionNotice: jest.fn(),
    });

    jest.spyOn(taskService, 'listTasks').mockImplementation(async (_token, opts) => {
      if (opts?.simulateError === 'server') {
        throw new ApiError('server', 'HTTP 503: servidor temporalmente indisponible (simulado)', 503);
      }
      if (opts?.simulateError === 'offline') {
        throw new ApiError('network', 'Sin conexión con el servidor (simulado).');
      }
      return MOCK_TASKS.map((task) => ({ ...task }));
    });
  });

  it('filtra en vivo al escribir en el buscador sin distinguir mayúsculas ni espacios', async () => {
    const { getByTestId, queryByText, findByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login', {}, { timeout: 4000 })).toBeTruthy();

    fireEvent.changeText(getByTestId('search-input'), '  LOGIN  ');

    expect(queryByText('Validar login')).toBeTruthy();
    expect(queryByText('Corregir navegación')).toBeNull();
  });

  it('actualiza estado mediante updateTaskStatus y recalcula los contadores', async () => {
    jest.spyOn(taskService, 'updateTaskStatus').mockResolvedValue({
      ...MOCK_TASKS[0],
      completed: true,
      status: 'resuelta',
    });

    const { getByTestId, findByText, getAllByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login', {}, { timeout: 4000 })).toBeTruthy();
    expect(getAllByText('Pendiente')).toHaveLength(1);
    expect(getAllByText('Completada')).toHaveLength(1);

    fireEvent.press(getByTestId('toggle-1'));

    await waitFor(
      () => {
        expect(getAllByText('Completada')).toHaveLength(2);
      },
      { timeout: 4000 },
    );
  });

  it('muestra error HTTP 503 y estado sin red con botón Reintentar conservando la lista', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { getByTestId, findByText, queryByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login', {}, { timeout: 4000 })).toBeTruthy();

    fireEvent.press(getByTestId('simulate-error-button'));
    expect(await findByText('No pudimos sincronizar', {}, { timeout: 4000 })).toBeTruthy();
    expect(queryByText('Consultando tareas…')).toBeNull();
    expect(queryByText('Validar login')).toBeTruthy();

    fireEvent.press(getByTestId('simulate-offline-button'));
    expect(await findByText('Problema de conexión', {}, { timeout: 4000 })).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('mantiene la identidad de cada tarjeta expandida al cambiar de pestaña', async () => {
    const { getByTestId, getByText, findByText, queryByTestId } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login', {}, { timeout: 4000 })).toBeTruthy();
    fireEvent.press(getByTestId('expand-1'));
    expect(getByTestId('details-1')).toBeTruthy();

    fireEvent.press(getByText('Completadas'));

    await waitFor(
      () => {
        expect(queryByTestId('details-2')).toBeNull();
      },
      { timeout: 4000 },
    );
  });

  it('rechaza títulos solo con espacios y crea tareas válidas recortando extremos', async () => {
    const createSpy = jest.spyOn(taskService, 'createTask').mockResolvedValue({
      id: '99',
      title: 'Preparar APK',
      description: '',
      priority: 'media',
      completed: false,
      status: 'pendiente',
    });

    const { getByTestId, findByText, getByText } = render(<TaskManagerScreen />);
    expect(await findByText('Validar login', {}, { timeout: 4000 })).toBeTruthy();

    fireEvent.changeText(getByTestId('new-task-input'), '   ');
    fireEvent.press(getByTestId('add-task-button'));
    expect(getByText('Ingresá un nombre válido para continuar.')).toBeTruthy();
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.changeText(getByTestId('new-task-input'), '  Preparar APK  ');
    fireEvent.press(getByTestId('add-task-button'));

    expect(await findByText('Preparar APK', {}, { timeout: 4000 })).toBeTruthy();
    expect(createSpy).toHaveBeenCalledWith(
      'mock-jwt-user-1',
      { title: 'Preparar APK', priority: 'media' },
      { useMock: true },
    );
  });
});
