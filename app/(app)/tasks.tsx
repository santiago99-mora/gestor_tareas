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
import { COLORS, MONO_FONT, RADII } from '../../src/theme/theme';
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
  const [focusedField, setFocusedField] = useState<'new' | 'search' | null>(null);
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
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            progressBackgroundColor={COLORS.surface}
          />
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={styles.eyebrowRow}>
              <View style={styles.identityCol}>
                <View style={styles.eyebrowLine}>
                  <View style={[styles.liveDot, useMock && styles.mockDot]} />
                  <Text style={styles.eyebrow}>
                    {useMock ? 'MODO MOCK CONTRACTUAL' : 'API CONECTADA · JWT'}
                  </Text>
                </View>
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
              <View style={[styles.stat, styles.statAccent]}>
                <Text style={styles.statLabelAccent}>TAREAS</Text>
                <Text style={styles.statNumberAccent}>{total}</Text>
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
                placeholderTextColor={COLORS.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                onFocus={() => setFocusedField('new')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={() => void addQuickTask()}
                style={[styles.addInput, focusedField === 'new' && styles.inputFocused]}
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
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocusedField('search')}
              onBlur={() => setFocusedField(null)}
              style={[styles.searchInput, focusedField === 'search' && styles.inputFocused]}
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
                <ActivityIndicator color={COLORS.accent} size="large" />
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
  screen: { flex: 1, backgroundColor: COLORS.bg },
  listContainer: { paddingHorizontal: 19, paddingTop: 16, paddingBottom: 55, flexGrow: 1 },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  identityCol: { flex: 1, minWidth: 0 },
  eyebrowLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  mockDot: { backgroundColor: COLORS.warningText },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    color: COLORS.accent,
  },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 8 },
  newButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.control,
    minHeight: 42,
    justifyContent: 'center',
  },
  newButtonText: { fontWeight: '900', color: COLORS.accentDarkInk, fontSize: 12 },
  profileButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.control,
    minHeight: 42,
    justifyContent: 'center',
  },
  profileButtonText: { fontWeight: '800', color: COLORS.textPrimary, fontSize: 12 },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 16,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADII.card,
    flex: 1,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  statAccent: { backgroundColor: COLORS.accentTint, borderColor: COLORS.accentBorder },
  statLabel: {
    fontWeight: '800',
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: MONO_FONT,
    letterSpacing: 0.4,
  },
  statLabelAccent: {
    fontWeight: '900',
    color: COLORS.accent,
    fontSize: 9,
    fontFamily: MONO_FONT,
    letterSpacing: 0.4,
  },
  statNumber: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    fontSize: 24,
  },
  statNumberAccent: {
    marginTop: 8,
    color: COLORS.accent,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    fontSize: 24,
  },
  label: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '800',
    fontFamily: MONO_FONT,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sectionHeading: { marginTop: 12 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 46,
    minWidth: 0,
  },
  inputFocused: { borderColor: COLORS.accent },
  addButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    borderRadius: RADII.control,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  addButtonText: { color: COLORS.accentDarkInk, fontWeight: '900', fontSize: 13 },
  feedback: { color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 46,
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryLabel: { fontSize: 11, color: COLORS.accent, fontWeight: '800' },
  simulateButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADII.control,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulateLabel: { fontSize: 11, color: COLORS.dangerText, fontWeight: '800' },
  offlineButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: RADII.control,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineLabel: { fontSize: 11, color: COLORS.warningText, fontWeight: '800' },
  loading: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, gap: 10 },
  loadingLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: MONO_FONT,
    paddingTop: 28,
  },
});
