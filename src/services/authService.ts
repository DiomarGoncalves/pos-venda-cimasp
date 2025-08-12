import { User } from '../types';
import { cacheService } from './cacheService';
import { v4 as uuidv4 } from 'uuid';

// Função para buscar usuário por username e senha (simples, sem hash)
export const signIn = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('[authService] signIn chamado:', { username, password });
    
    // Busca usuários do cache primeiro
    let users = await cacheService.getUsers();
    
    // Se não tem usuários no cache, busca do servidor
    if (users.length === 0) {
      try {
        const serverUsers = await window.electronAPI.getUsers();
        for (const user of serverUsers) {
          await cacheService.saveUser(user);
        }
        users = serverUsers;
      } catch (error) {
        console.error('Erro ao buscar usuários do servidor:', error);
      }
    }
    
    console.log('[authService] users recebidos:', users);
    const user = users.find((u: any) => u.username === username && u.password === password);
    console.log('[authService] user encontrado:', user);
    if (!user) return null;
    
    // Após login bem-sucedido, inicia sincronização completa
    console.log('🔄 Iniciando sincronização após login...');
    cacheService.syncWithServer().catch(console.error);
    
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
    
    const newUser = {
      id: uuidv4(),
      username,
      password,
      name: username,
      role: 'technician' as const,
      createdAt: new Date().toISOString(),
    };
    
    // Salva no cache local
    await cacheService.saveUser(newUser);
    
    // Adiciona à fila de sincronização
    await cacheService.addToSyncQueue({
      id: uuidv4(),
      type: 'create',
      table: 'users',
      data: { username, password }
    });
    
    // Tenta sincronizar imediatamente (em background)
    cacheService.syncWithServer().catch(console.error);
    
    console.log('[authService] user criado:', newUser);
    return {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  // Não é necessário implementar nada para SQLite local
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Implemente lógica de sessão local se necessário
  return null;
};