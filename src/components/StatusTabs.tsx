import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    backgroundColor: '#E7ECF5',
    padding: 4,
    borderRadius: 14,
    gap: 3,
    marginBottom: 13,
  },
  button: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: { backgroundColor: '#FFFFFF' },
  text: { color: '#53627B', fontWeight: '700', fontSize: 12 },
  textActive: { color: '#172743', fontWeight: '800' },
});
