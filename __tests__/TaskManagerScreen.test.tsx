import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TaskManagerScreen from '../app/index';
import * as taskService from '../src/services/taskService';
import type { Task } from '../src/types/task';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

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
    id: 't01',
    title: 'Validar login',
    description: 'Comprobar campos vacíos.',
    priority: 'alta',
    completed: false,
  },
  {
    id: 't02',
    title: 'Corregir navegación',
    description: 'Validar el regreso desde el detalle.',
    priority: 'media',
    completed: true,
  },
];

describe('TaskManagerScreen', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(taskService, 'fetchTasks').mockImplementation(async (simulateFailure = false) => {
      if (simulateFailure) {
        throw new Error('HTTP 503: servidor temporalmente indisponible (simulado)');
      }
      return MOCK_TASKS.map((task) => ({ ...task }));
    });
  });

  it('filtra en vivo al escribir en el buscador sin distinguir mayúsculas ni espacios', async () => {
    const { getByTestId, queryByText, findByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login')).toBeTruthy();

    fireEvent.changeText(getByTestId('search-input'), '  LOGIN  ');

    expect(queryByText('Validar login')).toBeTruthy();
    expect(queryByText('Corregir navegación')).toBeNull();
  });

  it('actualiza la interfaz de forma inmutable al cambiar el estado de una tarea', async () => {
    const { getByTestId, findByText, getAllByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login')).toBeTruthy();
    expect(getAllByText('Pendiente')).toHaveLength(1);
    expect(getAllByText('Completada')).toHaveLength(1);

    fireEvent.press(getByTestId('toggle-t01'));

    expect(getAllByText('Completada')).toHaveLength(2);
  });

  it('detiene el estado de carga y conserva las tareas visibles ante un error del servicio', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { getByTestId, findByText, queryByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login')).toBeTruthy();

    fireEvent.press(getByTestId('simulate-error-button'));

    expect(await findByText('No pudimos cargar las tareas. Probá otra vez.')).toBeTruthy();
    expect(queryByText('Consultando tareas…')).toBeNull();
    expect(queryByText('Validar login')).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('mantiene la identidad de cada tarjeta expandida al cambiar de pestaña', async () => {
    const { getByTestId, getByText, findByText, queryByTestId } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login')).toBeTruthy();
    fireEvent.press(getByTestId('expand-t01'));
    expect(getByTestId('details-t01')).toBeTruthy();

    fireEvent.press(getByText('Completadas'));

    await waitFor(() => {
      expect(queryByTestId('details-t02')).toBeNull();
    });
  });

  it('rechaza títulos solo con espacios y recorta espacios al agregar una tarea válida', async () => {
    const { getByTestId, findByText, getByText, queryByText } = render(<TaskManagerScreen />);

    expect(await findByText('Validar login')).toBeTruthy();

    fireEvent.changeText(getByTestId('new-task-input'), '   ');
    fireEvent.press(getByTestId('add-task-button'));
    expect(getByText('Ingresá un nombre válido para continuar.')).toBeTruthy();

    fireEvent.changeText(getByTestId('new-task-input'), '  Preparar APK  ');
    fireEvent.press(getByTestId('add-task-button'));

    expect(queryByText('Preparar APK')).toBeTruthy();
  });
});
