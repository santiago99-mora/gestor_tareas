import { isValidEmail, validateAuthForm } from '../src/utils/authValidation';

describe('authValidation', () => {
  it('valida formatos básicos de correo electrónico', () => {
    expect(isValidEmail('demo@gestortareas.app')).toBe(true);
    expect(isValidEmail('  usuario@dominio.com  ')).toBe(true);
    expect(isValidEmail('sin-arroba')).toBe(false);
    expect(isValidEmail('mal@dominio')).toBe(false);
  });

  it('rechaza contraseñas menores a 6 caracteres y confirmaciones distintas', () => {
    expect(validateAuthForm('mal-correo', '123456')).toMatch(/correo/i);
    expect(validateAuthForm('demo@test.com', '12345')).toMatch(/6 caracteres/i);
    expect(validateAuthForm('demo@test.com', '123456', '654321')).toMatch(/no coinciden/i);
    expect(validateAuthForm('demo@test.com', '123456', '123456')).toBeNull();
  });
});
