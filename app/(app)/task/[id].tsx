import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StateFeedback } from '../../../src/components/StateFeedback';
import { useAuth } from '../../../src/context/AuthContext';
import { ApiError } from '../../../src/services/apiClient';
import {
  deleteTaskById,
  getTaskById,
  updateTask,
  updateTaskStatus,
} from '../../../src/services/taskService';
import type { Task, TaskPriority } from '../../../src/types/task';
import { isValidTaskTitle } from '../../../src/utils/taskValidation';

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'alta', label: 'Alta' },
  { key: 'media', label: 'Media' },
  { key: 'baja', label: 'Baja' },
];

/**
 * Pantalla 5 · Detalle, edición (`PUT`), cambio de estado (`PATCH`) y eliminación (`DELETE`).
 */
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, useMock } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ variant: 'offline' | 'error'; message: string } | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const record = await getTaskById(token, id, { useMock });
      setTask(record);
      setTitle(record.title);
      setDescription(record.description);
      setPriority(record.priority);
      setCompleted(record.completed);
    } catch (caught) {
      if (caught instanceof ApiError && (caught.kind === 'network' || caught.kind === 'timeout')) {
        setError({ variant: 'offline', message: caught.message });
      } else if (caught instanceof ApiError) {
        setError({ variant: 'error', message: caught.message });
      } else {
        setError({ variant: 'error', message: 'No pudimos cargar el detalle de la tarea.' });
      }
    } finally {
      setLoading(false);
    }
  }, [id, token, useMock]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function handleSave() {
    if (!token || !id) return;
    if (!isValidTaskTitle(title)) {
      setError({ variant: 'error', message: 'El título no puede quedar vacío.' });
      return;
    }

    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const updated = await updateTask(
        token,
        id,
        {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status: completed ? 'resuelta' : 'pendiente',
        },
        { useMock },
      );
      setTask(updated);
      setFeedback('Cambios guardados en el servidor.');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError({
          variant: caught.kind === 'network' ? 'offline' : 'error',
          message: caught.message,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusToggle() {
    if (!token || !id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTaskStatus(token, id, !completed, { useMock });
      setCompleted(updated.completed);
      setTask(updated);
      setFeedback(updated.completed ? 'Marcada como resuelta.' : 'Marcada como pendiente.');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError({
          variant: caught.kind === 'network' ? 'offline' : 'error',
          message: caught.message,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function executeDelete() {
    if (!token || !id) return;
    setSaving(true);
    try {
      await deleteTaskById(token, id, { useMock });
      router.back();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError({
          variant: caught.kind === 'network' ? 'offline' : 'error',
          message: caught.message,
        });
      }
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (Platform.OS === 'web') {
      void executeDelete();
      return;
    }
    Alert.alert('Eliminar tarea', '¿Seguro que querés eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void executeDelete() },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al tablero"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>← Volver al tablero</Text>
          </Pressable>

          <Text style={styles.eyebrow}>DETALLE DE TAREA #{id}</Text>
          <Text style={styles.title}>Editar y gestionar</Text>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#147D73" />
              <Text style={styles.loadingText}>Cargando detalle…</Text>
            </View>
          ) : error && !task ? (
            <StateFeedback
              variant={error.variant}
              title="No se pudo abrir la tarea"
              message={error.message}
              onRetry={() => void loadDetail()}
            />
          ) : (
            <>
              {error ? (
                <StateFeedback
                  variant={error.variant}
                  title="Error al actualizar"
                  message={error.message}
                />
              ) : null}

              {feedback ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <View style={styles.statusBanner}>
                  <View>
                    <Text style={styles.statusLabel}>ESTADO ACTUAL</Text>
                    <Text style={styles.statusValue}>
                      {completed ? 'Resuelta (completada)' : 'Pendiente'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar estado de la tarea"
                    disabled={saving}
                    onPress={() => void handleQuickStatusToggle()}
                    style={styles.statusToggleBtn}
                  >
                    <Text style={styles.statusToggleText}>
                      {completed ? 'Reabrir' : 'Marcar resuelta'}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>TÍTULO</Text>
                <TextInput
                  accessibilityLabel="Título de la tarea"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />

                <Text style={[styles.label, styles.spacing]}>DESCRIPCIÓN</Text>
                <TextInput
                  accessibilityLabel="Descripción de la tarea"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Sin descripción..."
                  placeholderTextColor="#8B98AD"
                  style={[styles.input, styles.textArea]}
                />

                <Text style={[styles.label, styles.spacing]}>PRIORIDAD</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map((item) => (
                    <Pressable
                      key={item.key}
                      accessibilityRole="button"
                      accessibilityLabel={`Prioridad ${item.label}`}
                      accessibilityState={{ selected: priority === item.key }}
                      onPress={() => setPriority(item.key)}
                      style={[styles.priorityPill, priority === item.key && styles.priorityActive]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          priority === item.key && styles.priorityTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Guardar cambios de la tarea"
                  disabled={saving}
                  onPress={() => void handleSave()}
                  style={[styles.saveButton, saving && styles.buttonDisabled]}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar tarea ${title}`}
                  disabled={saving}
                  onPress={confirmDelete}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Eliminar tarea</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { paddingVertical: 10, minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  backText: { color: '#147D73', fontWeight: '800', fontSize: 14 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#147D73' },
  title: { fontSize: 28, fontWeight: '900', color: '#172743', marginTop: 6, marginBottom: 16 },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: '#5A6B82', fontSize: 13, fontWeight: '600' },
  feedbackBox: {
    backgroundColor: '#E5F2EF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  feedbackText: { color: '#147D73', fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4EAF2',
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F6FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  statusLabel: { fontSize: 10, fontWeight: '900', color: '#5A6B82', letterSpacing: 0.8 },
  statusValue: { fontSize: 14, fontWeight: '800', color: '#172743', marginTop: 2 },
  statusToggleBtn: {
    backgroundColor: '#172743',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  statusToggleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: '#384E6D', marginBottom: 8 },
  spacing: { marginTop: 14 },
  input: {
    backgroundColor: '#F9FBFD',
    borderWidth: 1,
    borderColor: '#DCE4F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#172743',
    minHeight: 46,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityPill: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityActive: { backgroundColor: '#172743' },
  priorityText: { fontSize: 13, fontWeight: '800', color: '#4B5A75' },
  priorityTextActive: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: '#147D73',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  deleteButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: { color: '#A53342', fontWeight: '800', fontSize: 14 },
});
