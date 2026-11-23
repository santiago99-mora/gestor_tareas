import { useCallback, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StateFeedback } from '../../src/components/StateFeedback';
import { StatusTabs } from '../../src/components/StatusTabs';
import { TaskCard } from '../../src/components/TaskCard';
import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/services/apiClient';
import {
  createTask,
  deleteTaskById,
  listTasks,
  updateTaskStatus,
} from '../../src/services/taskService';
import type { Task, TaskStatus } from '../../src/types/task';
import { filterTasks } from '../../src/utils/taskFilters';
import { isValidTaskTitle } from '../../src/utils/taskValidation';

type ErrorState = {
  variant: 'offline' | 'error';
  message: string;
};

/**
 * Pantalla 3 · Panel principal de tareas autenticadas.
 * Consume `GET /api/tasks`, permite alta rápida (`POST`), cambio de estado (`PATCH`),
 * eliminación (`DELETE`), navegación a detalle/perfil y resolución de todos los estados de red.
 */
export default function TaskManagerScreen() {
  const { token, user, useMock } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todas');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [feedback, setFeedback] = useState('');
  const latestRequestId = useRef(0);

  const loadTasks = useCallback(
    async (options: { simulate?: 'server' | 'offline'; isRefresh?: boolean } = {}) => {
      if (!token) return;
      const requestId = ++latestRequestId.current;
      const controller = new AbortController();

      if (options.isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorState(null);

      try {
        const records = await listTasks(token, {
          useMock,
          signal: controller.signal,
          simulateError: options.simulate,
        });
        if (requestId === latestRequestId.current) {
          setTasks(records);
        }
      } catch (caught) {
        if (requestId !== latestRequestId.current) return;
        console.error('[taskService] Error cargando tareas', caught);
        if (caught instanceof ApiError && (caught.kind === 'network' || caught.kind === 'timeout')) {
          setErrorState({ variant: 'offline', message: caught.message });
        } else if (caught instanceof ApiError) {
          setErrorState({ variant: 'error', message: caught.message });
        } else {
          setErrorState({
            variant: 'error',
            message: 'No pudimos cargar las tareas. Probá otra vez.',
          });
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, useMock],
  );

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks]),
  );

  const visibleTasks = useMemo(() => filterTasks(tasks, query, status), [tasks, query, status]);
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;

  async function toggleTask(task: Task) {
    if (!token) return;
    setBusyTaskId(task.id);
    setErrorState(null);
    try {
      const updated = await updateTaskStatus(token, task.id, !task.completed, { useMock });
      setTasks((previous) => previous.map((item) => (item.id === task.id ? updated : item)));
    } catch (caught) {
      if (caught instanceof ApiError && (caught.kind === 'network' || caught.kind === 'timeout')) {
        setErrorState({ variant: 'offline', message: caught.message });
      } else if (caught instanceof ApiError) {
        setErrorState({ variant: 'error', message: caught.message });
      }
    } finally {
      setBusyTaskId(null);
    }
  }

  async function addQuickTask() {
    if (!token) return;
    if (!isValidTaskTitle(newTitle)) {
      setFeedback('Ingresá un nombre válido para continuar.');
      return;
    }

    setSubmittingNew(true);
    setErrorState(null);
    try {
      const created = await createTask(
        token,
        { title: newTitle.trim(), priority: 'media' },
        { useMock },
      );
      setTasks((previous) => [created, ...previous]);
      setNewTitle('');
      setFeedback('Tarea agregada.');
      Keyboard.dismiss();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFeedback(caught.message);
      } else {
        setFeedback('No se pudo crear la tarea.');
      }
    } finally {
      setSubmittingNew(false);
    }
  }

  async function removeTask(id: string) {
    if (!token) return;
    setBusyTaskId(id);
    setErrorState(null);
    try {
      await deleteTaskById(token, id, { useMock });
      setTasks((previous) => previous.filter((task) => task.id !== id));
      setFeedback('Tarea eliminada.');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrorState({
          variant: caught.kind === 'network' ? 'offline' : 'error',
          message: caught.message,
        });
      }
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        data={loading ? [] : visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            busy={busyTaskId === item.id}
            onToggle={() => void toggleTask(item)}
            onDelete={() => void removeTask(item.id)}
            onOpenDetail={() =>
              router.push({ pathname: '/(app)/task/[id]', params: { id: item.id } })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadTasks({ isRefresh: true })}
            colors={['#147D73']}
          />
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={styles.eyebrowRow}>
              <View>
                <Text style={styles.eyebrow}>
                  {useMock ? 'MODO MOCK CONTRACTUAL' : 'API CONECTADA · JWT'}
                </Text>
                {user ? <Text style={styles.userEmail}>{user.email}</Text> : null}
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  testID="new-task-screen-button"
                  accessibilityRole="button"
                  accessibilityLabel="Crear tarea completa"
                  onPress={() => router.push('/(app)/new')}
                  style={styles.newButton}
                >
                  <Text style={styles.newButtonText}>+ Nueva</Text>
                </Pressable>
                <Pressable
                  testID="profile-button"
                  accessibilityRole="button"
                  accessibilityLabel="Abrir perfil y sesión"
                  onPress={() => router.push('/(app)/profile')}
                  style={styles.profileButton}
                >
                  <Text style={styles.profileButtonText}>Perfil</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.heading}>Gestor de tareas</Text>

            <View style={styles.statsRow}>
              <View style={[styles.stat, styles.statDark]}>
                <Text style={styles.statLabelLight}>TAREAS</Text>
                <Text style={styles.statNumberLight}>{total}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>COMPLETADAS</Text>
                <Text style={styles.statNumber}>{completed}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>PENDIENTES</Text>
                <Text style={styles.statNumber}>{total - completed}</Text>
              </View>
            </View>

            <Text style={styles.label}>ALTA RÁPIDA</Text>
            <View style={styles.addRow}>
              <TextInput
                testID="new-task-input"
                accessibilityLabel="Nombre de la nueva tarea"
                placeholder="Ej.: Revisar documentación"
                placeholderTextColor="#8B98AD"
                value={newTitle}
                onChangeText={setNewTitle}
                returnKeyType="done"
                onSubmitEditing={() => void addQuickTask()}
                style={styles.addInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Agregar tarea rápida"
                testID="add-task-button"
                disabled={submittingNew}
                style={[styles.addButton, submittingNew && styles.buttonDisabled]}
                onPress={() => void addQuickTask()}
              >
                <Text style={styles.addButtonText}>{submittingNew ? '...' : 'Agregar'}</Text>
              </Pressable>
            </View>
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

            <Text style={[styles.label, styles.sectionHeading]}>MIS TAREAS</Text>
            <TextInput
              testID="search-input"
              accessibilityLabel="Buscar tareas"
              placeholder="Buscar por nombre..."
              placeholderTextColor="#8B98AD"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
            <StatusTabs current={status} onChange={setStatus} />

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recargar tareas desde el servidor"
                style={styles.retryButton}
                onPress={() => void loadTasks()}
              >
                <Text style={styles.retryLabel}>↻ Recargar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="simulate-error-button"
                accessibilityLabel="Simular error HTTP 503 del servidor"
                style={styles.simulateButton}
                onPress={() => void loadTasks({ simulate: 'server' })}
              >
                <Text style={styles.simulateLabel}>⚠ Error 503</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="simulate-offline-button"
                accessibilityLabel="Simular pérdida de conexión de red"
                style={styles.offlineButton}
                onPress={() => void loadTasks({ simulate: 'offline' })}
              >
                <Text style={styles.offlineLabel}>✕ Sin red</Text>
              </Pressable>
            </View>

            {errorState ? (
              <StateFeedback
                variant={errorState.variant}
                title={
                  errorState.variant === 'offline'
                    ? 'Problema de conexión'
                    : 'No pudimos sincronizar'
                }
                message={errorState.message}
                onRetry={() => void loadTasks()}
              />
            ) : null}

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#147D73" size="large" />
                <Text style={styles.loadingLabel}>Consultando tareas…</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading && !errorState ? (
            <StateFeedback
              variant="empty"
              title="No hay tareas para mostrar"
              message={
                query || status !== 'todas'
                  ? 'Probá limpiar la búsqueda o cambiar el filtro de estado.'
                  : 'Creá tu primera tarea usando el botón + Nueva o el campo rápido.'
              }
              onRetry={() => {
                setQuery('');
                setStatus('todas');
                void loadTasks();
              }}
              retryLabel="Restablecer y recargar"
            />
          ) : null
        }
        ListFooterComponent={
          <Text style={styles.footer}>EDI · Desarrollo Multiplataforma · Gestor de Tareas 2026</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  listContainer: { paddingHorizontal: 19, paddingTop: 16, paddingBottom: 55, flexGrow: 1 },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: '900', color: '#147D73' },
  userEmail: { fontSize: 12, color: '#4B5A75', fontWeight: '700', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  newButton: {
    backgroundColor: '#147D73',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  newButtonText: { fontWeight: '800', color: '#FFFFFF', fontSize: 12 },
  profileButton: {
    backgroundColor: '#E5EFEC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  profileButtonText: { fontWeight: '800', color: '#147D73', fontSize: 12 },
  heading: { fontSize: 28, fontWeight: '900', color: '#172743', marginTop: 10, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 15,
    flex: 1,
    borderColor: '#E7EBF3',
    borderWidth: 1,
  },
  statDark: { backgroundColor: '#172743', borderColor: '#172743' },
  statLabel: { fontWeight: '800', color: '#5A6B82', fontSize: 9, letterSpacing: 0.35 },
  statLabelLight: { fontWeight: '800', color: '#B3C4DD', fontSize: 9, letterSpacing: 0.35 },
  statNumber: { marginTop: 8, color: '#172743', fontWeight: '900', fontSize: 24 },
  statNumberLight: { marginTop: 8, color: '#FFFFFF', fontWeight: '900', fontSize: 24 },
  label: { fontSize: 11, color: '#384E6D', fontWeight: '900', letterSpacing: 1.1, marginBottom: 8 },
  sectionHeading: { marginTop: 12 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  addInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#172743',
    fontSize: 14,
    minHeight: 46,
    minWidth: 0,
  },
  addButton: {
    backgroundColor: '#147D73',
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  addButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  feedback: { color: '#147D73', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4F0',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#172743',
    fontSize: 14,
    minHeight: 46,
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  retryButton: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    backgroundColor: '#E5F2EF',
    borderRadius: 10,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryLabel: { fontSize: 11, color: '#147D73', fontWeight: '800' },
  simulateButton: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    backgroundColor: '#FDEBEB',
    borderRadius: 10,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulateLabel: { fontSize: 11, color: '#A53342', fontWeight: '800' },
  offlineButton: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineLabel: { fontSize: 11, color: '#92400E', fontWeight: '800' },
  loading: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, gap: 10 },
  loadingLabel: { color: '#5A6B82', fontSize: 13, fontWeight: '600' },
  footer: { textAlign: 'center', color: '#7D8B9F', fontSize: 10, paddingTop: 28 },
});
