import { User } from '../types';

// Função para buscar usuário por username e senha (simples, sem hash)
export const signIn = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('[authService] signIn chamado:', { username, password });
    const users = await window.electronAPI.getUsers();
    console.log('[authService] users recebidos:', users);
    const user = users.find((u: any) => u.username === username && u.password === password);
    console.log('[authService] user encontrado:', user);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role || 'technician',
      createdAt: user.created_at,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return null;
  }
};

export const signUp = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('[authService] signUp chamado:', { username, password });
    const user = await window.electronAPI.addUser({ username, password });
    console.log('[authService] user criado:', user);
    return {
      id: user.id,
      username: user.username,
      name: user.name || '',
      role: user.role || 'technician',
      createdAt: user.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  // Não é necessário implementar nada para SQLite local
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Implemente lógica de sessão local se necessário
  return null;
};