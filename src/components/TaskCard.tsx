import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, MONO_FONT, RADII } from '../theme/theme';
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
    <View style={[styles.card, task.completed && styles.cardCompleted]}>
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
            <View
              style={[
                styles.priorityChip,
                task.priority === 'alta' && styles.priorityChipHigh,
              ]}
            >
              <Text style={[styles.priority, task.priority === 'alta' && styles.high]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.dividerText}>·</Text>
            <Text style={[styles.state, task.completed && styles.stateCompleted]}>
              {task.completed ? 'Completada' : 'Pendiente'}
            </Text>
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
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardCompleted: {
    borderColor: '#20252A',
    backgroundColor: '#14171A',
  },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    height: 26,
    width: 26,
    borderRadius: RADII.badge,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  disabled: { opacity: 0.5 },
  checkText: { color: COLORS.accentDarkInk, fontWeight: '900', fontSize: 15 },
  content: { flex: 1 },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  completed: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  priorityChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.badge,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityChipHigh: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  priority: {
    fontSize: 9,
    letterSpacing: 0.7,
    color: COLORS.textSecondary,
    fontWeight: '800',
    fontFamily: MONO_FONT,
  },
  high: { color: COLORS.dangerText },
  dividerText: { color: COLORS.textMuted, fontSize: 11 },
  state: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  stateCompleted: { color: COLORS.accent },
  expandButton: {
    width: 34,
    height: 34,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandText: { color: COLORS.accent, fontWeight: '800', fontSize: 18 },
  details: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 13 },
  detailButton: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.control,
    minHeight: 40,
    justifyContent: 'center',
  },
  detailButtonText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },
  deleteButton: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADII.control,
    minHeight: 40,
    justifyContent: 'center',
  },
  deleteText: { color: COLORS.dangerText, fontSize: 12, fontWeight: '800' },
});
