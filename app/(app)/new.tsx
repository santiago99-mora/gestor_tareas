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
              placeholderTextColor="#8B98AD"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={[styles.label, styles.spacing]}>DESCRIPCIÓN (OPCIONAL)</Text>
            <TextInput
              testID="create-description-input"
              accessibilityLabel="Descripción de la tarea"
              placeholder="Detalles, criterios o notas..."
              placeholderTextColor="#8B98AD"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
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
              testID="create-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Guardar nueva tarea"
              disabled={submitting}
              onPress={() => void handleSave()}
              style={[styles.saveButton, submitting && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar tarea</Text>
              )}
            </Pressable>
          </View>
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
  title: { fontSize: 28, fontWeight: '900', color: '#172743', marginTop: 6, marginBottom: 18 },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F2C6CC',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { color: '#A53342', fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4EAF2',
  },
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
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
