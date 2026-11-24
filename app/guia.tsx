import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, MONO_FONT, RADII } from '../src/theme/theme';

const missions = [
  'Reproducir los errores antes de cambiar el código.',
  'Examinar las variables con DevTools, consola o breakpoints.',
  'Corregir al menos cuatro incidencias con cambios mínimos.',
  'Ejecutar pruebas automatizadas y explicar sus resultados.',
  'Documentar causa raíz, corrección y prueba de regresión.',
  'Crear un commit con los cambios y defender las decisiones.',
];

export default function GuiaScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Volver al gestor</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GUÍA DE TRABAJO</Text>
        <Text style={styles.title}>Investigar antes de corregir</Text>
        <Text style={styles.intro}>
          No se trata de encontrar el código correcto en Internet, sino de demostrar
          cómo se detecta una falla, cómo se explica y cómo se evita que reaparezca.
        </Text>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Misión de la clase</Text>
          <Text style={styles.calloutText}>
            Corregir al menos 4 fallos y entregar un informe técnico verificable.
          </Text>
        </View>
        {missions.map((mission, index) => (
          <View key={mission} style={styles.mission}>
            <View style={styles.numberBadge}>
              <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.missionText}>{mission}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          Usá la plantilla INFORME_INCIDENTES.md del proyecto para registrar las evidencias.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 22, paddingBottom: 35, paddingTop: 14 },
  back: { paddingVertical: 10, marginBottom: 16 },
  backText: { color: COLORS.accent, fontWeight: '800', fontSize: 13, fontFamily: MONO_FONT },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: COLORS.accent,
    fontWeight: '900',
    fontFamily: MONO_FONT,
  },
  title: { fontSize: 28, color: COLORS.textPrimary, fontWeight: '900', marginTop: 10, lineHeight: 34 },
  intro: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginTop: 12, marginBottom: 20 },
  callout: {
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.card,
    padding: 18,
    marginBottom: 18,
  },
  calloutTitle: { fontSize: 15, fontWeight: '900', color: COLORS.accent },
  calloutText: { marginTop: 7, color: COLORS.textPrimary, lineHeight: 20, fontSize: 13 },
  mission: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    borderRadius: RADII.card,
    gap: 14,
    marginBottom: 9,
  },
  numberBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADII.badge,
  },
  number: { color: COLORS.accentDarkInk, fontWeight: '900', fontFamily: MONO_FONT, fontSize: 11 },
  missionText: { flex: 1, color: COLORS.textPrimary, lineHeight: 20, fontSize: 13 },
  note: { marginTop: 22, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 19, fontSize: 12 },
});
