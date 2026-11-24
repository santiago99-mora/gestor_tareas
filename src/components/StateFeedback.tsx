import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, MONO_FONT, RADII } from '../theme/theme';

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
          style={[
            styles.retryButton,
            variant === 'empty' && styles.emptyRetryButton,
          ]}
        >
          <Text
            style={[
              styles.retryText,
              variant === 'empty' && styles.emptyRetryText,
            ]}
          >
            ↻ {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  offlineBox: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    fontFamily: MONO_FONT,
    color: COLORS.accent,
    marginBottom: 6,
  },
  errorText: { color: COLORS.dangerText },
  offlineText: { color: COLORS.warningText },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  message: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADII.control,
    minHeight: 42,
    justifyContent: 'center',
  },
  emptyRetryButton: {
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.accentBorder,
  },
  retryText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 12 },
  emptyRetryText: { color: COLORS.accent },
});
