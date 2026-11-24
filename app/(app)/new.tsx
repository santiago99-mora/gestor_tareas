import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/services/apiClient';
import { createTask } from '../../src/services/taskService';
import { COLORS, MONO_FONT, RADII } from '../../src/theme/theme';
import type { TaskPriority } from '../../src/types/task';
import { isValidTaskTitle } from '../../src/utils/taskValidation';

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'alta', label: 'Alta' },
  { key: 'media', label: 'Media' },
  { key: 'baja', label: 'Baja' },
];

/**
 * Pantalla 4 · Formulario completo para crear una nueva tarea (`POST /api/tasks`).
 */
export default function NewTaskScreen() {
  const { token, useMock } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [focusedField, setFocusedField] = useState<'title' | 'description' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!token) return;
    if (!isValidTaskTitle(title)) {
      setError('El título de la tarea no puede estar vacío.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createTask(
        token,
        {
          title: title.trim(),
          description: description.trim() || null,
          priority,
        },
        { useMock },
      );
      router.back();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('No se pudo guardar la tarea.');
      }
    } finally {
      setSubmitting(false);
    }
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
            accessibilityLabel="Volver al listado"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>← Volver al tablero</Text>
          </Pressable>

          <Text style={styles.eyebrow}>NUEVO REGISTRO</Text>
          <Text style={styles.title}>Crear tarea</Text>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>TÍTULO *</Text>
            <TextInput
              testID="create-title-input"
              accessibilityLabel="Título de la tarea"
              placeholder="Ej.: Comprar materiales de oficina"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              style={[styles.input, focusedField === 'title' && styles.inputFocused]}
            />

            <Text style={[styles.label, styles.spacing]}>DESCRIPCIÓN (OPCIONAL)</Text>
            <TextInput
              testID="create-description-input"
              accessibilityLabel="Descripción de la tarea"
              placeholder="Detalles, criterios o notas..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
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
              testID="create-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Guardar nueva tarea"
              disabled={submitting}
              onPress={() => void handleSave()}
              style={[styles.saveButton, submitting && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.accentDarkInk} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar tarea  →</Text>
              )}
            </Pressable>
          </View>
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
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginTop: 6, marginBottom: 18 },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: RADII.control,
    marginBottom: 14,
  },
  errorText: { color: COLORS.dangerText, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
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
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: COLORS.accentDarkInk, fontWeight: '900', fontSize: 15 },
});
