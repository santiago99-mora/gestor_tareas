const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Verifica que un correo electrónico tenga formato básico válido. */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Valida campos del formulario de login o registro.
 * Devuelve un mensaje descriptivo si hay error, o `null` si es válido.
 */
export function validateAuthForm(
  email: string,
  password: string,
  confirmPassword?: string,
): string | null {
  if (!isValidEmail(email)) {
    return 'Ingresá un correo electrónico válido.';
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return 'Las contraseñas no coinciden.';
  }
  return null;
}
