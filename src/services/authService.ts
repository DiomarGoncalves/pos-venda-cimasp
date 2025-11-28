import { User } from '../types';

export const signIn = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('[authService] Tentando login com:', { username });

    // Valida usuário e senha
    const user = await window.electronAPI.validateUser(username, password);

    if (!user) {
      console.log('[authService] Usuário ou senha inválidos');
      return null;
    }

    console.log('[authService] Login bem-sucedido:', user);

    return {
      id: user.id,
      username: user.username,
      name: user.username,
      createdAt: user.created_at,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return null;
  }
};

export const signUp = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('[authService] Registrando novo usuário:', { username });

    const serverUser = await window.electronAPI.addUser({
      username,
      password
    });

    console.log('[authService] Usuário criado:', serverUser);

    return {
      id: serverUser.id,
      username: serverUser.username,
      name: serverUser.username,
      createdAt: serverUser.created_at,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  // Sem lógica necessária
};

export const getCurrentUser = async (): Promise<User | null> => {
  return null;
};