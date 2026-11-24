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
import { COLORS, MONO_FONT, RADII } from '../../../src/theme/theme';
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
  const [focusedField, setFocusedField] = useState<'title' | 'description' | null>(null);
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
              <ActivityIndicator size="large" color={COLORS.accent} />
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
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>ESTADO ACTUAL</Text>
                    <Text style={[styles.statusValue, completed && styles.statusValueDone]}>
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
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, focusedField === 'title' && styles.inputFocused]}
                />

                <Text style={[styles.label, styles.spacing]}>DESCRIPCIÓN</Text>
                <TextInput
                  accessibilityLabel="Descripción de la tarea"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Sin descripción..."
                  placeholderTextColor={COLORS.textMuted}
                  style={[
                    styles.input,
                    styles.textArea,
                    focusedField === 'description' && styles.inputFocused,
                  ]}
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
                    {saving ? 'Guardando…' : 'Guardar cambios  →'}
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
  screen: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { paddingVertical: 10, minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  backText: { color: COLORS.accent, fontWeight: '800', fontSize: 13, fontFamily: MONO_FONT },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    letterSpacing: 1.5,
    color: COLORS.accent,
  },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginTop: 6, marginBottom: 16 },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  feedbackBox: {
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 12,
    borderRadius: RADII.control,
    marginBottom: 14,
  },
  feedbackText: { color: COLORS.accent, fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: 12,
    borderRadius: RADII.control,
    marginBottom: 16,
    gap: 10,
  },
  statusInfo: { flex: 1 },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: MONO_FONT,
    color: COLORS.textMuted,
    letterSpacing: 0.9,
  },
  statusValue: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginTop: 3 },
  statusValueDone: { color: COLORS.accent },
  statusToggleBtn: {
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: RADII.control,
    minHeight: 40,
    justifyContent: 'center',
  },
  statusToggleText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },
  label: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: MONO_FONT,
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  spacing: { marginTop: 14 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 46,
  },
  inputFocused: { borderColor: COLORS.accent },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityPill: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  priorityText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  priorityTextActive: { color: COLORS.accentDarkInk, fontWeight: '900' },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.control,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.accentDarkInk, fontWeight: '900', fontSize: 15 },
  deleteButton: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADII.control,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: { color: COLORS.dangerText, fontWeight: '800', fontSize: 14 },
});
