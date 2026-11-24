import { Platform } from 'react-native';

/**
 * Sistema de diseño centralizado ("Obsidian & Volt Lime") inspirado en
 * interfaces industriales oscuras de alto contraste.
 */
export const COLORS = {
  bg: '#111315',
  surface: '#171A1D',
  surfaceAlt: '#131619',
  surfaceElevated: '#1E2227',
  inputBg: '#121518',
  border: '#262B31',
  borderStrong: '#343A42',

  accent: '#D4F24B',
  accentDarkInk: '#0F120D',
  accentTint: '#1B2212',
  accentBorder: '#8EA832',

  textPrimary: '#F3F5F7',
  textSecondary: '#9CA4B0',
  textMuted: '#697280',

  dangerBg: '#251417',
  dangerBorder: '#6E2A35',
  dangerText: '#FF7D8B',

  warningBg: '#221C11',
  warningBorder: '#6D5421',
  warningText: '#F5C451',
} as const;

export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const RADII = {
  card: 10,
  control: 6,
  badge: 4,
} as const;
