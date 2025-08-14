import { User } from '../types';
import { cacheService } from './cacheService';
import { v4 as uuidv4 } from 'uuid';

// Função para buscar usuário por username e senha (simples, sem hash)
export const signIn = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('[authService] signIn chamado:', { username, password });
    
    // SEMPRE tenta buscar usuários do servidor primeiro
    let users: any[] = [];
    
    if (navigator.onLine && window.electronAPI) {
      console.log('📡 Buscando usuários do servidor...');
      try {
        users = await window.electronAPI.getUsers();
        
        // Atualiza o cache com os usuários do servidor
        await cacheService.saveMultipleUsers(users);
        console.log('✅ Usuários obtidos do servidor e cache atualizado');
      } catch (error) {
        console.warn('⚠️ Falha no servidor, usando cache:', error);
        users = await cacheService.getUsers();
      }
    } else {
      console.log('📱 Offline - usando cache');
      users = await cacheService.getUsers();
    }
    
    console.log('[authService] users recebidos:', users);
    const user = users.find((u: any) => u.username === username && u.password === password);
    console.log('[authService] user encontrado:', user);
    if (!user) return null;
    
    // Após login bem-sucedido, processa fila de sincronização se houver itens pendentes
    const hasPending = await cacheService.hasPendingSync();
    if (hasPending) {
      console.log('🔄 Processando itens pendentes de sincronização...');
      cacheService.processSyncQueue().catch(console.error);
    }
    
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
    
    // SEMPRE tenta salvar no servidor primeiro
    if (navigator.onLine && window.electronAPI) {
      console.log('💾 Criando usuário no servidor...');
      try {
        const serverUser = await window.electronAPI.addUser({ username, password });
        
        // Salva no cache após sucesso no servidor
        await cacheService.saveUser(newUser);
        console.log('✅ Usuário criado no servidor e cache atualizado');
        
        return {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        };
      } catch (error) {
        console.warn('⚠️ Falha no servidor, salvando no cache:', error);
        throw error; // Para registro, é melhor falhar se não conseguir criar no servidor
      }
    } else {
      // Offline - salva no cache e adiciona à fila
      await cacheService.saveUser(newUser);
      
      await cacheService.addToSyncQueue({
        id: uuidv4(),
        type: 'create',
        table: 'users',
        data: { username, password }
      });
      
      console.log('📱 Usuário salvo no cache - será sincronizado quando possível');
      
      return {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      };
    }
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