import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, MONO_FONT, RADII } from '../theme/theme';
import type { TaskStatus } from '../types/task';

const options: { key: TaskStatus; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'completadas', label: 'Completadas' },
];

type Props = {
  /** Filtro de estado actualmente seleccionado. */
  current: TaskStatus;
  /** Callback invocado cuando el usuario selecciona otra pestaña. */
  onChange: (status: TaskStatus) => void;
};

/** Selector de pestañas accesible para filtrar tareas por estado. */
export function StatusTabs({ current, onChange }: Props) {
  return (
    <View style={styles.container}>
      {options.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityLabel={`Filtrar tareas: ${item.label}`}
          accessibilityState={{ selected: current === item.key }}
          onPress={() => onChange(item.key)}
          style={[styles.button, current === item.key && styles.active]}
        >
          <Text style={[styles.text, current === item.key && styles.textActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    borderRadius: RADII.badge,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: { backgroundColor: COLORS.accent },
  text: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: MONO_FONT,
  },
  textActive: { color: COLORS.accentDarkInk, fontWeight: '900' },
});
