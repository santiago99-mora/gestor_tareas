import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import * as AuthContextModule from '../src/context/AuthContext';
import { ApiError } from '../src/services/apiClient';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

describe('LoginScreen', () => {
  jest.setTimeout(15000);

  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
    mockSignIn.mockReset();
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      token: null,
      user: null,
      isRestoring: false,
      useMock: false,
      sessionNotice: null,
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      setUseMock: jest.fn(),
      clearSessionNotice: jest.fn(),
    });
  });

  it('valida campos antes de enviar al servidor', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('login-email-input'), 'invalido');
    fireEvent.changeText(getByTestId('login-password-input'), '123');
    fireEvent.press(getByTestId('login-submit-button'));

    expect(getByText('Ingresá un correo electrónico válido.')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('envía credenciales válidas y muestra errores HTTP 401 sin bloquear', async () => {
    mockSignIn.mockRejectedValueOnce(
      new ApiError('unauthorized', 'Correo o contraseña incorrectos.', 401),
    );

    const { getByTestId, findByText } = render(<LoginScreen />);

    fireEvent.press(getByTestId('login-demo-button'));
    fireEvent.press(getByTestId('login-submit-button'));

    expect(
      await findByText('Correo o contraseña incorrectos.', {}, { timeout: 4000 }),
    ).toBeTruthy();
    await waitFor(
      () => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'demo@gestortareas.app',
          password: 'Demo1234!',
        });
      },
      { timeout: 4000 },
    );
  });
});
