import { Pressable, StyleSheet, Text, View } from 'react-native';

type StateFeedbackProps = {
  /** Tipo de estado visual a comunicar al usuario. */
  variant: 'offline' | 'error' | 'empty';
  /** Título breve de la situación actual. */
  title: string;
  /** Detalle accionable del problema o estado vacío. */
  message: string;
  /** Acción opcional de reintento o recuperación. */
  onRetry?: () => void;
  /** Etiqueta del botón de acción. */
  retryLabel?: string;
};

const LABELS: Record<StateFeedbackProps['variant'], string> = {
  offline: 'SIN CONEXIÓN',
  error: 'ERROR DE SERVIDOR',
  empty: 'SIN RESULTADOS',
};

/**
 * Componente accesible para representar estados de error HTTP, desconexión de red
 * o listado vacío con claves textuales (no solo color) y botón de reintento.
 */
export function StateFeedback({
  variant,
  title,
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: StateFeedbackProps) {
  const isError = variant !== 'empty';
  return (
    <View
      accessibilityRole={isError ? 'alert' : undefined}
      style={[
        styles.box,
        variant === 'error' && styles.errorBox,
        variant === 'offline' && styles.offlineBox,
      ]}
    >
      <Text
        style={[
          styles.badge,
          variant === 'error' && styles.errorText,
          variant === 'offline' && styles.offlineText,
        ]}
      >
        {LABELS[variant]}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>↻ {retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE4F0',
    marginTop: 10,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F2C6CC',
  },
  offlineBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#4B6580',
    marginBottom: 6,
  },
  errorText: { color: '#A53342' },
  offlineText: { color: '#9A5B04' },
  title: { fontSize: 15, fontWeight: '800', color: '#172743', marginBottom: 4 },
  message: { fontSize: 13, color: '#4B5A75', lineHeight: 19 },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#172743',
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
