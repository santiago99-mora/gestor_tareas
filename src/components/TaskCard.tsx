import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../types/task';

/** Props del componente `TaskCard`. */
export type TaskCardProps = {
  /** Tarea a mostrar en la tarjeta. */
  task: Task;
  /** Callback al alternar el estado pendiente/resuelta. */
  onToggle: () => void;
  /** Callback al eliminar la tarea. */
  onDelete: () => void;
  /** Navegación opcional al detalle completo de la tarea. */
  onOpenDetail?: () => void;
  /** Deshabilita interacciones mientras se procesa una petición remota. */
  busy?: boolean;
};

/**
 * Tarjeta reutilizable de tarea con soporte de marcado, expansión rápida de detalle,
 * eliminación accesible y navegación opcional a la vista completa.
 */
export function TaskCard({ task, onToggle, onDelete, onOpenDetail, busy = false }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Pressable
          testID={`toggle-${task.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Cambiar estado de ${task.title}`}
          accessibilityState={{ checked: task.completed, disabled: busy }}
          disabled={busy}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.check, task.completed && styles.checked, busy && styles.disabled]}
          onPress={onToggle}
        >
          <Text style={styles.checkText}>{task.completed ? '✓' : ''}</Text>
        </Pressable>

        <Pressable
          style={styles.content}
          disabled={!onOpenDetail}
          accessibilityRole={onOpenDetail ? 'button' : undefined}
          accessibilityLabel={onOpenDetail ? `Abrir detalle de ${task.title}` : undefined}
          onPress={onOpenDetail}
        >
          <Text style={[styles.title, task.completed && styles.completed]}>{task.title}</Text>
          <View style={styles.row}>
            <Text style={[styles.priority, task.priority === 'alta' && styles.high]}>
              {task.priority.toUpperCase()}
            </Text>
            <Text style={styles.dividerText}>·</Text>
            <Text style={styles.state}>{task.completed ? 'Completada' : 'Pendiente'}</Text>
          </View>
        </Pressable>

        <Pressable
          testID={`expand-${task.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${task.title}`}
          accessibilityState={{ expanded }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={() => setExpanded((current) => !current)}
          style={styles.expandButton}
        >
          <Text style={styles.expandText}>{expanded ? '−' : '+'}</Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.details} testID={`details-${task.id}`}>
          <Text style={styles.description}>
            {task.description ? task.description : 'Sin descripción adicional registrada.'}
          </Text>
          <View style={styles.detailActions}>
            {onOpenDetail ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar o ver detalle completo de ${task.title}`}
                onPress={onOpenDetail}
                style={styles.detailButton}
              >
                <Text style={styles.detailButtonText}>Editar / Ver detalle</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Eliminar tarea ${task.title}`}
              disabled={busy}
              onPress={onDelete}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Eliminar tarea</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E7EBF3',
  },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    height: 28,
    width: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7E8BA3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: { backgroundColor: '#147D73', borderColor: '#147D73' },
  disabled: { opacity: 0.5 },
  checkText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  content: { flex: 1 },
  title: { color: '#192846', fontSize: 15, fontWeight: '800', lineHeight: 21 },
  completed: { color: '#6E7B91', textDecorationLine: 'line-through' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  priority: { fontSize: 10, letterSpacing: 0.5, color: '#4B6580', fontWeight: '800' },
  high: { color: '#B93E34' },
  dividerText: { color: '#9BA6B8', fontSize: 11 },
  state: { color: '#53627C', fontSize: 11, fontWeight: '600' },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandText: { color: '#294665', fontWeight: '800', fontSize: 20 },
  details: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E9EEF4' },
  description: { fontSize: 13, color: '#4B5A75', lineHeight: 20 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 13 },
  detailButton: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: '#E5F2EF',
    borderRadius: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  detailButtonText: { color: '#147D73', fontSize: 12, fontWeight: '800' },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: '#FFF0F0',
    borderRadius: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  deleteText: { color: '#A53342', fontSize: 12, fontWeight: '800' },
});
